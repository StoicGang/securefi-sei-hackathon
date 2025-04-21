import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import cors from 'cors';

const app = express();
const port = 3000;

// App configuration
app.use(cors());
app.use(express.json());

// API Keys
const ETHERSCAN_API_KEY = 'C1H29S3J1BQA3M4UMU647APSMN961ACCMY';
const GEMINI_API_KEY = 'AIzaSyA6M-6Ad8ZSIfDN0X5uuTMhNCz6Nr86P3U';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Validates if a string is a valid Ethereum address
 * @param {string} address - The address to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function isValidEthereumAddress(address) {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

/**
 * Fetches an Ethereum contract's source code from Etherscan
 * @param {string} contractAddress - Ethereum contract address
 * @returns {Promise<Object>} - Contract source code and metadata
 */
async function getEthereumContractSource(contractAddress) {
  try {
    const url = `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${ETHERSCAN_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== "1") {
      throw new Error(`Etherscan API error: ${data.message || 'Unknown error'}`);
    }
    
    const contractData = data.result[0];
    
    if (!contractData.SourceCode || contractData.SourceCode.trim().length === 0) {
      throw new Error("No verified source code available for this contract");
    }
    
    return {
      address: contractAddress,
      name: contractData.ContractName,
      sourceCode: contractData.SourceCode,
      compiler: contractData.CompilerVersion
    };
  } catch (error) {
    throw new Error(`Failed to retrieve contract source: ${error.message}`);
  }
}

/**
 * Analyzes a smart contract using Gemini API
 * @param {Object} contractData - Contract data with source code
 * @returns {Promise<Object>} - Security analysis
 */
async function analyzeContractWithGemini(contractData) {
    try {
      let codeForAnalysis = contractData.sourceCode;
      if (codeForAnalysis.length > 30000) {
        codeForAnalysis = codeForAnalysis.substring(0, 30000) + "... [truncated for length]";
      }
      
      // Use JSON.stringify() to escape the source code so that any special characters are handled.
      const escapedCode = JSON.stringify(codeForAnalysis);

      // Main analysis prompt
      const analysisPrompt = `
        Your task is to thoroughly analyze the following smart contract and identify all potential security vulnerabilities, logic flaws, and non-compliance with standards.
        
        Focus your analysis on:
        - Common smart contract vulnerabilities (e.g., reentrancy, integer overflows/underflows, unchecked external calls)
        - Denial of Service (DoS) vulnerabilities
        - Misuse of delegatecall or selfdestruct, front-running, gas inefficiencies
        - ERC standard compliance issues (if applicable)
        - Business logic flaws (e.g., incorrect fee handling, flawed mint/burn mechanics, allowance management)
        - Improper access control and trust assumptions (e.g., admin keys, unprotected critical functions)
        - Use of deprecated patterns or unsafe third-party libraries
        - Violations of security best practices (e.g., missing visibility specifiers, non-locked compiler versions)
        
        Also take into account:
        - Severity classification using a risk-based approach (based on likelihood and impact)
        - Cross-reference of code logic with standard token behaviors and expected patterns
        
        Contract name: ${contractData.name}
        
        Return your analysis in JSON format with the following structure:
        {
          "vulnerabilities": [
            {
              "id": number,
              "name": string,
              "description": string,
              "severity": string,
              "lineNumber": number,
              "code": string,
              "recommendation": string
            }
          ],
          "overallScore": number (1-10 with 10 being most secure),
          "summary": string
        }
        
        Contract address: ${contractData.address}
        Contract source code: ${escapedCode}
      `;
      
      // Model configuration - Using Gemini 1.5 Flash for faster processing
      const modelName = "gemini-1.5-flash";
      const model = genAI.getGenerativeModel({ model: modelName });

      // System instruction that defines the audit assistant role
      const systemInstruction = `You are a blockchain audit assistant specialized in analyzing Ethereum and Sei-based smart contracts. 
      Your expertise includes identifying security vulnerabilities, logical flaws, and compliance issues in smart contract code.
      Provide detailed, actionable analysis with clear recommendations for remediation.`;

      // Generate content with appropriate configurations
      const generationConfig = {
        temperature: 0.2,  // Lower temperature for more analytical/deterministic output
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 8192,
      };

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: analysisPrompt }] }],
        generationConfig,
        // Note: The system instruction is included directly in the request headers by the SDK
        // The GoogleGenerativeAI SDK may handle this differently than the example with caches
      });

      let responseText = result.response.text();
      responseText = responseText.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
      
      const jsonMatch = responseText.match(/{[\s\S]*}/);
      if (!jsonMatch) {
        throw new Error("No JSON object found in Gemini response");
      }
      const jsonStr = jsonMatch[0];
      
      try {
        const analysisResult = JSON.parse(jsonStr);
        return analysisResult;
      } catch (parseError) {
        throw new Error(`Failed to parse Gemini JSON: ${parseError.message}`);
      }
    } catch (error) {
      throw new Error(`Error analyzing with Gemini: ${error.message}`);
    }
}

// GET route for smart contract analysis using header input
app.get('/analyze-contract', async (req, res) => {
  try {
    const contractAddress = req.headers['contract-address'];
    
    if (!contractAddress) {
      return res.status(400).json({ error: "Missing contract-address in request header" });
    }
    
    if (!isValidEthereumAddress(contractAddress)) {
      return res.status(400).json({ error: "Invalid Ethereum address format" });
    }
    
    const contractData = await getEthereumContractSource(contractAddress);
    const analysis = await analyzeContractWithGemini(contractData);
    return res.json(analysis);
  } catch (error) {
    console.error("Request error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze smart contract" });
  }
});

// POST route for direct code analysis using JSON input (expects { code: "..." })
app.post('/analyze-contract', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: "Missing contract source code in request body" });
    }
    
    // Build contract data using provided code
    const contractData = {
      address: "Not provided",
      name: "Direct Analysis",
      sourceCode: code,
      compiler: "Not provided"
    };
    
    const analysis = await analyzeContractWithGemini(contractData);
    return res.json(analysis);
  } catch (error) {
    console.error("Request error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze smart contract" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Ethereum smart contract analyzer service running on port ${port}`);
});

app.get('/', async (req, res) => {
  try {
    return res.json({message: "Welcome to Smart contract auditor, Please make request on /analyze-contract route"});
  } catch (error) {
    console.error("Request error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze smart contract" });
  }
});
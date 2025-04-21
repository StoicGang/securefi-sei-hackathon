// server.js
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
app.use(cors());
app.use(express.json());

// Initialize Google Generative AI with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Function to perform token analysis using Gemini
async function analyzeTokenWithGemini(tokenData) {
  try {
    // Initialize the Gemini 1.5 Pro model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Structured prompt for token risk analysis
    const prompt = `
    Perform a comprehensive risk analysis for the cryptocurrency token with the following details:
    
    Token Name: ${tokenData.token_name}
    Token Address: ${tokenData.token_address}
    Smart Contract Address: ${tokenData.smart_contract_address}
    
    Please provide the following analysis components:
    
    1. Risk score data for the following categories (score from 0-100, where 100 is highest risk):
       - Contract Risk
       - Liquidity Risk
       - Market Sentiment
       - Developer Activity
       - Community Trust
       
    2. Five specific risk insights with descriptions
    
    3. Historical risk trend data for the last 6 months (monthly data points)
    
    4. Three specific AI recommendations for risk management
    
    Format your response as a valid JSON object with the following structure:
    {
      "riskData": [
        {"category": "Contract Risk", "risk": 0-100},
        {"category": "Liquidity Risk", "risk": 0-100},
        {"category": "Market Sentiment", "risk": 0-100},
        {"category": "Developer Activity", "risk": 0-100},
        {"category": "Community Trust", "risk": 0-100}
      ],
      "insightsList": [
        {"title": "Insight Title", "description": "Detailed description", "action": "Data Source", "icon": "TrendingDown"},
        ...
      ],
      "chartData": [
        {"name": "Jan", "Risk": 0-100, "Average": 0-100},
        {"name": "Feb", "Risk": 0-100, "Average": 0-100},
        ...
      ],
      "riskConfig": {
        "Risk": {"label": "Project Risk", "color": "#ef4444"},
        "Average": {"label": "Industry Average", "color": "#3b82f6"}
      },
      "ai_recommendations": [
        {"title": "Recommendation Title", "description": "Detailed recommendation"},
        ...
      ]
    }
    
    The icon field in insightsList should be one of: "TrendingDown", "AlertTriangle", "Shield", "BarChart3", "FileSearch", "Activity".
    `;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract the JSON part from the text response
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*}/);
    const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
    
    // Parse the JSON
    const analysisData = JSON.parse(jsonText);
    return analysisData;
  } catch (error) {
    console.error('Error analyzing token with Gemini:', error);
    throw new Error(`Failed to analyze token: ${error.message}`);
  }
}

// API endpoint for risk analysis
app.post('/risk-analysis', async (req, res) => {
  try {
    const tokenData = req.body;
    console.log('Received token data:', tokenData);
    
    if (!tokenData || !tokenData.token_name || !tokenData.token_address || !tokenData.smart_contract_address) {
      return res.status(400).json({ error: 'Invalid token data provided' });
    }
    
    // Analyze token using Gemini
    const analysisData = await analyzeTokenWithGemini(tokenData);
    
    // Map icon string names to appropriate React component names that can be used on the frontend
    if (analysisData.insightsList) {
      analysisData.insightsList = analysisData.insightsList.map(insight => {
        // Convert the icon string to the appropriate component reference
        insight.icon = `<${insight.icon} className="h-5 w-5 text-amber-500" />`;
        return insight;
      });
    }
    
    console.log('Analysis data:', analysisData);
    res.json(analysisData);
  } catch (error) {
    console.error('Error performing risk analysis:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
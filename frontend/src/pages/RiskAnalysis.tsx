import React, { useState, useEffect } from "react";
import {
  TrendingDown,
  AlertTriangle,
  Shield,
  BarChart3,
  FileSearch,
  Activity,
  Loader
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";
import RiskScoreCircle from "@/components/RiskScoreCircle";

// Token data for dropdown selection
const tokenData = [
  {
    token_name: "orchest",
    token_address: "hMpvoZTcApksJyJAXuX1HDDCCE4tEvMd2325vLfpump",
    smart_contract_address: "0x4575f41308ec1483f3d399aa9a2826d74da13deb"
  },
  {
    token_name: "yeye",
    token_address: "9CMi4UyHbhhmoqcf6thKUWSZ6rAuwafQJd7u2CB8pump",
    smart_contract_address: "0x36A500F731e2FFA29207499EFb29326b671000AC"
  },
  {
    token_name: "HoodGold",
    token_address: "AkfgYS26wK9xBmh9gtAGZ2umtVecJYa4co5NayqWpump",
    smart_contract_address: "akfgys26wk9xbmh9gtagz2umtvecjya4co5nayqwpump"
  },
  {
    token_name: "SwastiCoin",
    token_address: "9d1HfhQztyZszDCFS5p2zX6FzNkAPQogvuR3oerXpump",
    smart_contract_address: "9gyfbPVwwZx4y1hotNSLcqXCQNpNqqz6ZRvo8yTLpump"
  },
  {
    token_name: "Ron",
    token_address: "ALbCJ7r81tPuFYpG2hEwsrk6WXBz73xVyWty992Fpump",
    smart_contract_address: "0x23f043426b2336e723b32fb3bf4a1ca410f7c49a"
  },
  {
    token_name: "jupyter",
    token_address: "",
    smart_contract_address: "0x4B1E80cAC91e2216EEb63e29B957eB91Ae9C2Be8"
  },
  {
    token_name: "Token OFFICIAL TRUMP",
    token_address: "6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN",
    smart_contract_address: "0x576e2BeD8F7b46D34016198911Cdf9886f78bea7"
  },
  {
    token_name: "Jito",
    token_address: "jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL",
    smart_contract_address: "0x7fB1ee12Ca098aF9bE5313401d7fCC5c8d7968D8"
  },
  {
    token_name: "Grass",
    token_address: "Grass7B4RdKfBCjTKgSqnXkqjwiGvQyFbuSCUJr3XXjs",
    smart_contract_address: "0x42f0d280e1f4fb064650653445a3c904e61f64b1"
  }
];

// Default fallback values in case the API response is missing any fields
const defaultData = {
  riskData: [
    { category: "Contract Risk", risk: 0 },
    { category: "Liquidity Risk", risk: 0 },
    { category: "Market Sentiment", risk: 0 },
    { category: "Developer Activity", risk: 0 },
    { category: "Community Trust", risk: 0 }
  ],
  insightsList: [],
  chartData: [],
  riskConfig: {
    Risk: { label: "Project Risk", color: "#ef4444" },
    Average: { label: "Industry Average", color: "#3b82f6" }
  },
  ai_recommendations: []
};

// Hardcoded risk score data
const riskScores = {
  overview: {
    title: "Overall Risk Score",
    score: 56.21,
    description: "Combined risk assessment for the selected pool"
  },
  categories: [
    {
      title: "Smart Contract Risk",
      score: 31.14,
      description: "Risk assessment based on contract audit"
    },
    {
      title: "Liquidity Risk",
      score: 85.47,
      description: "Risk based on liquidity analysis"
    },
    {
      title: "Market Risk",
      score: 42.33,
      description: "Risk based on market volatility"
    }
  ],
  detailedMetrics: [
    {
      title: "Price Stability",
      score: 99.99,
      description: "Price stability assessment"
    },
    {
      title: "Volume Analysis",
      score: 78.52,
      description: "Trading volume assessment"
    },
    {
      title: "Holder Distribution",
      score: 65.30,
      description: "Token holder distribution"
    },
    {
      title: "Social Sentiment",
      score: 88.75,
      description: "Social media sentiment"
    },
    {
      title: "Developer Activity",
      score: 45.60,
      description: "Development activity score"
    },
    {
      title: "Community Growth",
      score: 92.15,
      description: "Community engagement metrics"
    }
  ]
};

const RiskAnalysis = () => {
  // State for the selected token index, risk analysis data, loading, and error.
  const [selectedTokenIndex, setSelectedTokenIndex] = useState(0);
  const [data, setData] = useState(defaultData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = "Risk Analysis - AssureFi Guardian";
  }, []);

  // Function to fetch risk analysis data from the backend
  const fetchRiskAnalysis = async (token) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("https://risk-analysis-nzrq.onrender.com/risk-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(token)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const riskAnalysisData = await response.json();
      console.log(riskAnalysisData);
      
      setData({
        riskData: riskAnalysisData.riskData || defaultData.riskData,
        insightsList: riskAnalysisData.insightsList || defaultData.insightsList,
        chartData: riskAnalysisData.chartData || defaultData.chartData,
        riskConfig: riskAnalysisData.riskConfig || defaultData.riskConfig,
        ai_recommendations: riskAnalysisData.ai_recommendations || defaultData.ai_recommendations
      });
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handler for dropdown selection change
  const handleTokenChange = (e) => {
    setSelectedTokenIndex(Number(e.target.value));
  };

  // Handler for analyze button click
  const handleAnalyzeClick = () => {
    const token = tokenData[selectedTokenIndex];
    fetchRiskAnalysis(token);
  };

  // Calculate overall risk based on riskData values
  const overallRisk =
    typeof data.riskData[0].risk === "number"
      ? data.riskData.reduce((sum, item) => sum + item.risk, 0) / data.riskData.length
      : 0;
  const overallRiskText =
    overallRisk > 60 ? "High Risk" : overallRisk > 40 ? "Medium-High Risk" : "Low Risk";

  return (
    <DashboardLayout 
      title="Risk Analysis" 
      description="Comprehensive risk assessment based on multiple data sources"
    >
      {/* Token Selection Section */}
      <div className="mb-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Select Token</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Choose a token from the list below to analyze its liquidity metrics.
        </p>
        <div className="flex gap-2">
          <select
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedTokenIndex}
            onChange={(e) => setSelectedTokenIndex(Number(e.target.value))}
          >
            {tokenData.map((token, index) => (
              <option 
                key={index} 
                value={index}
                className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
              >
                {token.token_name}
              </option>
            ))}
          </select>
          <button
            onClick={handleAnalyzeClick}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                Analyze
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </>
            )}
          </button>
        </div>
        {error && <div className="text-red-500 mt-2">Error: {error}</div>}
      </div>

      {/* Risk Analysis Display */}
      <div className="grid gap-6">
        {/* Overall Risk Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <CardTitle>Overall Risk Assessment</CardTitle>
            </div>
            <CardDescription>
              Combined risk level based on contract audit, liquidity monitoring, sentiment analysis, and trust score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Overall Risk Score */}
              <div className="flex justify-center">
                <Card className="w-64">
                  <CardContent className="p-6">
                    <RiskScoreCircle
                      score={riskScores.overview.score}
                      title={riskScores.overview.title}
                      description={riskScores.overview.description}
                      size="lg"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Main Risk Categories */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Main Risk Categories</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {riskScores.categories.map((category, index) => (
                    <Card key={index} className="p-6">
                      <RiskScoreCircle
                        score={category.score}
                        title={category.title}
                        description={category.description}
                        size="md"
                      />
                    </Card>
                  ))}
                </div>
              </div>

              {/* Detailed Risk Metrics */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Detailed Risk Metrics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {riskScores.detailedMetrics.map((metric, index) => (
                    <Card key={index} className="p-6">
                      <RiskScoreCircle
                        score={metric.score}
                        title={metric.title}
                        description={metric.description}
                        size="md"
                      />
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Insights Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Risk Insights</CardTitle>
            </div>
            <CardDescription>
              Key findings from all analysis tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.insightsList.map((insight, index) => (
                <div key={index}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {insight.icon}
                    </div>
                    <div>
                      <h3 className="font-medium">{insight.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{insight.description}</p>
                      <div className="mt-1">
                        <span className="text-xs inline-block px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300">
                          Source: {insight.action}
                        </span>
                      </div>
                    </div>
                  </div>
                  {index < data.insightsList.length - 1 && <Separator className="my-4" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Risk Trend Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <CardTitle>Risk Analysis Trend</CardTitle>
            </div>
            <CardDescription>
              Historical risk metrics compared to industry average
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ChartContainer 
                config={data.riskConfig}
                className="h-full w-full"
              >
                <BarChart
                  data={data.chartData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                  <Legend />
                  <Bar dataKey="Risk" fill="#ef4444" name="Project Risk" />
                  <Bar dataKey="Average" fill="#3b82f6" name="Industry Average" />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>AI-Powered Risk Recommendations</CardTitle>
            <CardDescription>
              Personalized suggestions based on AI analysis of all data sources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              {data.ai_recommendations && data.ai_recommendations.length > 0 ? (
                data.ai_recommendations.map((rec, index) => (
                  <div key={index} className="p-4 border border-slate-200 dark:border-slate-800 rounded-md">
                    <h3 className="font-medium mb-2">{rec.title}</h3>
                    <p>{rec.description}</p>
                  </div>
                ))
              ) : (
                <>
                  <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-md">
                    <h3 className="font-medium mb-2">Contract Security</h3>
                    <p>
                      Consider waiting for a full audit resolution before investing. The identified access control issues could potentially allow unauthorized control over token functions.
                    </p>
                  </div>
                  <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-md">
                    <h3 className="font-medium mb-2">Liquidity Management</h3>
                    <p>
                      Set up monitoring alerts for large liquidity movements. The concentrated ownership structure increases the risk of sudden price drops due to large sells.
                    </p>
                  </div>
                  <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-md">
                    <h3 className="font-medium mb-2">Market Sentiment</h3>
                    <p>
                      Monitor social channels for upcoming announcements or community events that might improve sentiment. The recent negative trend could indicate undisclosed issues.
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default RiskAnalysis;

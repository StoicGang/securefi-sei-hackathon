import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown,
  User, 
  Loader, 
  PieChart, 
  MessageCircle, 
  Share2, 
  Sparkles,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  LineChart,
  BarChart3,
  ThumbsUp,
  Send
} from "lucide-react";
import { 
  Area, 
  AreaChart, 
  Bar, 
  BarChart, 
  CartesianGrid, 
  Cell, 
  Legend, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip, 
  XAxis, 
  YAxis,
  Pie,
  PieChart as RechartsPieChart
} from "recharts";
import RiskScoreCircle from "@/components/RiskScoreCircle";

// Backend API URL - Replace with your deployed server URL
const API_BASE_URL = 'YOUR_DEPLOYED_SERVER_URL';

const CryptoSentimentDashboard = () => {
  const [coinList, setCoinList] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState('bitcoin');
  const [sentimentData, setSentimentData] = useState(null);
  const [tweets, setTweets] = useState([]);
  const [telegramData, setTelegramData] = useState([]);
  const [geminiInsights, setGeminiInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboardData, setDashboardData] = useState(null);

  // Load available coins on component mount
  useEffect(() => {
    document.title = "Cryptocurrency Market - SafeFund Guardian";
    loadCoins();
  }, []);

  // Load coins list from API
  const loadCoins = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/coins`);
      const coins = await response.json();
      setCoinList(coins.map(coin => ({
        id: coin,
        name: coin.charAt(0).toUpperCase() + coin.slice(1),
        symbol: coin.toUpperCase()
      })));
      
      // Set first coin as default
      if (coins.length > 0) {
        setSelectedCoin(coins[0]);
      }
    } catch (error) {
      console.error('Error loading coins:', error);
    }
  };

  // Fetch coin data from backend
  const fetchCoinData = async (coin) => {
    setLoading(true);
    try {
      // Fetch sentiment analysis
      const sentimentResponse = await fetch(`${API_BASE_URL}/api/sentiment?token=${encodeURIComponent(coin)}`);
      const sentimentData = await sentimentResponse.json();
      
      // Fetch coin analysis
      const analysisResponse = await fetch(`${API_BASE_URL}/api/analyze?coin=${encodeURIComponent(coin)}`);
      const analysisData = await analysisResponse.json();
      
      // Fetch dashboard data
      const dataResponse = await fetch(`${API_BASE_URL}/api/data?coin=${encodeURIComponent(coin)}`);
      const dashboardData = await dataResponse.json();

      // Update state with fetched data
      setSentimentData({
        average_sentiment: analysisData.sentiment_score / 10, // Convert to -1 to 1 scale
        sentiment_distribution: {
          Positive: analysisData.sentiment_distribution?.positive || 0,
          Neutral: analysisData.sentiment_distribution?.neutral || 0,
          Negative: analysisData.sentiment_distribution?.negative || 0
        },
        total_mentions: analysisData.total_mentions,
        momentum: analysisData.momentum,
        analysis_time: new Date().toISOString()
      });

      // Extract messages for Twitter and Telegram
      const messages = sentimentData.social_analysis?.twitter?.messages || [];
      const telegramMessages = sentimentData.social_analysis?.telegram?.messages || [];

      setTweets(messages.slice(0, 5).map(msg => ({
        username: msg.username || 'user' + Math.floor(Math.random() * 1000),
        content: msg.message,
        sentiment: msg.sentiment_label.toLowerCase(),
        timestamp: msg.timestamp ? new Date(msg.timestamp * 1000).toISOString() : new Date().toISOString()
      })));

      setTelegramData(telegramMessages.slice(0, 5).map(msg => ({
        username: msg.username || 'user' + Math.floor(Math.random() * 1000),
        content: msg.message,
        groupName: msg.channel || 'Crypto Community',
        memberCount: Math.floor(Math.random() * 10000) + 1000,
        sentiment: msg.sentiment_label.toLowerCase(),
        timestamp: msg.timestamp ? new Date(msg.timestamp * 1000).toISOString() : new Date().toISOString()
      })));

      // Set Gemini insights
      const insights = sentimentData.ai_insights;
      setGeminiInsights({
        summary: insights.summary || 'No summary available',
        keyInsights: insights.key_factors?.map(factor => factor.text) || [],
        risks: insights.risk_factors?.map(factor => factor.text) || [],
        prediction: {
          shortTerm: insights.prediction || 'No prediction available',
          mediumTerm: 'Analysis pending',
          confidence: 75
        },
        sentimentMetrics: {
          overallScore: sentimentData.overview?.overall_sentiment?.score || 7.8,
          twitterSentiment: sentimentData.social_analysis?.twitter?.score || 8.2,
          telegramSentiment: sentimentData.social_analysis?.telegram?.score || 7.9
        },
        technicalAnalysis: {
          trend: sentimentData.overview?.technical_trend?.trend || 'Bullish',
          riskLevel: sentimentData.overview?.risk_level?.level || 'Moderate',
          strongSupport: sentimentData.overview?.technical_trend?.support || 0,
          strongResistance: sentimentData.overview?.technical_trend?.resistance || 0
        },
        priceCorrelations: [
          { asset: "S&P 500", correlation: 0.65 },
          { asset: "Gold", correlation: 0.12 },
          { asset: "DXY", correlation: -0.45 }
        ]
      });

      setDashboardData(dashboardData);
    } catch (error) {
      console.error('Error fetching coin data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Determine sentiment color based on value
  const getSentimentColor = (value) => {
    if (value > 0.3) return "bg-green-500";
    if (value < -0.3) return "bg-red-500";
    return "bg-yellow-500";
  };

  // Get sentiment color for the Gemini insight metrics
  const getInsightSentimentColor = (value) => {
    if (value >= 7.0) return "text-green-500";
    if (value <= 4.0) return "text-red-500";
    return "text-yellow-500";
  };

  // Prepare sentiment distribution data for the chart
  const getSentimentDistribution = () => {
    if (!sentimentData?.sentiment_distribution) {
      return { positive: 33, neutral: 34, negative: 33 };
    }
    
    return {
      positive: sentimentData.sentiment_distribution.Positive || 0,
      neutral: sentimentData.sentiment_distribution.Neutral || 0,
      negative: sentimentData.sentiment_distribution.Negative || 0
    };
  };

  // Helper function to format correlation data for the bar chart
  const formatCorrelationData = () => {
    if (!geminiInsights?.priceCorrelations) {
      return [];
    }
    
    return geminiInsights.priceCorrelations.map(item => ({
      name: item.asset,
      value: item.correlation * 100, // Convert to percentage
      fill: item.correlation >= 0 ? "#4ade80" : "#f87171" // Green for positive, red for negative
    }));
  };

  // Helper for pie chart data
  const getSentimentDistributionPieData = () => {
    const distribution = getSentimentDistribution();
    return [
      { name: 'Positive', value: distribution.positive, color: '#4ade80' },
      { name: 'Neutral', value: distribution.neutral, color: '#facc15' },
      { name: 'Negative', value: distribution.negative, color: '#f87171' }
    ];
  };

  // Content for each tab
  const renderOverviewTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Overall Sentiment Card */}
        <Card className="shadow-md border border-gray-200 dark:border-gray-700 dark:bg-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Overall Sentiment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-3xl font-bold">
                {geminiInsights?.sentimentMetrics?.overallScore.toFixed(1) || "7.8"}
                <span className="text-sm font-normal text-gray-500 ml-1">/10</span>
              </div>
              <div className={`text-lg font-semibold flex items-center ${
                (geminiInsights?.sentimentMetrics?.overallScore || 7.8) > 6.5 ? "text-green-500" : 
                (geminiInsights?.sentimentMetrics?.overallScore || 7.8) < 4.5 ? "text-red-500" : 
                "text-yellow-500"
              }`}>
                {(geminiInsights?.sentimentMetrics?.overallScore || 7.8) > 6.5 ? (
                  <>Bullish <TrendingUp className="h-5 w-5 ml-1" /></>
                ) : (geminiInsights?.sentimentMetrics?.overallScore || 7.8) < 4.5 ? (
                  <>Bearish <TrendingDown className="h-5 w-5 ml-1" /></>
                ) : (
                  <>Neutral <Share2 className="h-5 w-5 ml-1" /></>
                )}
              </div>
            </div>
            <Progress 
              value={(geminiInsights?.sentimentMetrics?.overallScore || 7.8) * 10} 
              className="h-2 mt-3"
            />
          </CardContent>
        </Card>

        {/* Risk Level Card */}
        <Card className="shadow-md border border-gray-200 dark:border-gray-700 dark:bg-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Risk Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold capitalize">
                {geminiInsights?.technicalAnalysis?.riskLevel || "Moderate"}
              </div>
              <div className={`text-lg font-semibold flex items-center ${
                (geminiInsights?.technicalAnalysis?.riskLevel || "moderate") === "low" ? "text-green-500" : 
                (geminiInsights?.technicalAnalysis?.riskLevel || "moderate") === "high" ? "text-red-500" : 
                "text-yellow-500"
              }`}>
                <AlertTriangle className="h-5 w-5 ml-1" />
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
              {(geminiInsights?.technicalAnalysis?.riskLevel || "moderate") === "low" ? (
                "Low volatility expected in the near term"
              ) : (geminiInsights?.technicalAnalysis?.riskLevel || "moderate") === "high" ? (
                "High volatility expected in the near term"
              ) : (
                "Moderate volatility expected in the near term"
              )}
            </div>
          </CardContent>
        </Card>

        {/* Technical Trend Card */}
        <Card className="shadow-md border border-gray-200 dark:border-gray-700 dark:bg-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Technical Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold capitalize">
                {geminiInsights?.technicalAnalysis?.trend || "Bullish"}
              </div>
              <div className={`text-lg font-semibold flex items-center ${
                (geminiInsights?.technicalAnalysis?.trend || "bullish") === "bullish" ? "text-green-500" : 
                (geminiInsights?.technicalAnalysis?.trend || "bullish") === "bearish" ? "text-red-500" : 
                "text-yellow-500"
              }`}>
                {(geminiInsights?.technicalAnalysis?.trend || "bullish") === "bullish" ? (
                  <ArrowUpRight className="h-5 w-5 ml-1" />
                ) : (geminiInsights?.technicalAnalysis?.trend || "bullish") === "bearish" ? (
                  <ArrowDownRight className="h-5 w-5 ml-1" />
                ) : (
                  <Share2 className="h-5 w-5 ml-1" />
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
              <div className="text-gray-600 dark:text-gray-300">
                Support: <span className="font-semibold text-gray-800 dark:text-gray-100">
                  ${geminiInsights?.technicalAnalysis?.strongSupport?.toLocaleString() || "29,800"}
                </span>
              </div>
              <div className="text-gray-600 dark:text-gray-300">
                Resistance: <span className="font-semibold text-gray-800 dark:text-gray-100">
                  ${geminiInsights?.technicalAnalysis?.strongResistance?.toLocaleString() || "32,500"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Analysis Card */}
        <Card className="shadow-lg border border-gray-200 dark:border-gray-700 dark:bg-slate-900 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <div className="mr-2 font-bold text-lg">{selectedCoin.charAt(0).toUpperCase() + selectedCoin.slice(1)}</div>
                <div className="text-sm opacity-90 bg-white/20 px-2 py-1 rounded">{selectedCoin.toUpperCase()}</div>
              </CardTitle>
              <PieChart className="h-5 w-5 opacity-75" />
            </div>
            <CardDescription className="text-blue-100 mt-1">Sentiment Analysis Dashboard</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex justify-center py-10 animate-pulse">
                <Loader className="text-blue-500 h-10 w-10" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Sentiment Score */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Overall Sentiment Score</p>
                    <span className={`text-sm px-3 py-1 rounded-full font-medium ${getSentimentColor(sentimentData?.average_sentiment || 0.5)}`}>
                      {((sentimentData?.average_sentiment || 0.5) * 10).toFixed(1)}
                    </span>
                  </div>
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-red-600 bg-red-200">
                          Negative
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                          Positive
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                      <div 
                        style={{ width: `${((sentimentData?.average_sentiment || 0.5) + 1) * 50}%` }}
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${getSentimentColor(sentimentData?.average_sentiment || 0.5)}`}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Sentiment Distribution Pie Chart */}
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-inner">
                  <h4 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-200">Sentiment Distribution</h4>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={getSentimentDistributionPieData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, value, cx, cy, midAngle, innerRadius, outerRadius }) => {
                            const RADIAN = Math.PI / 180;
                            const radius = outerRadius * 1.4;
                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                            
                            return (
                              <text
                                x={x}
                                y={y}
                                fill="currentColor"
                                textAnchor={x > cx ? 'start' : 'end'}
                                dominantBaseline="central"
                                className="text-sm font-medium"
                              >
                                {`${name}: ${value}%`}
                              </text>
                            );
                          }}
                          labelLine={{
                            stroke: 'currentColor',
                            strokeWidth: 1,
                            strokeDasharray: "2 2"
                          }}
                        >
                          {getSentimentDistributionPieData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Legend verticalAlign="bottom" height={36} />
                        <RechartsTooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Analysis Time */}
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-4">
                  <div className="flex-1">
                    Last Updated: {new Date(sentimentData?.analysis_time ?? Date.now()).toLocaleString()}
                  </div>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-1 ${getSentimentColor(sentimentData?.average_sentiment || 0.5)}`}></div>
                    <span className="font-medium">
                      {sentimentData?.average_sentiment > 0.3 ? "Bullish" : 
                       sentimentData?.average_sentiment < -0.3 ? "Bearish" : "Neutral"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Insights Card */}
        <Card className="shadow-lg border border-gray-200 dark:border-gray-700 dark:bg-slate-900 h-full">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <Sparkles className="h-5 w-5 mr-2" />
                Gemini AI Insights
              </CardTitle>
              <div className="text-xs bg-white/20 px-2 py-1 rounded-full">Powered by Google</div>
            </div>
            <CardDescription className="text-blue-100 mt-1">
              AI-generated analysis and predictions
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {loading ? (
              <div className="flex justify-center py-10 animate-pulse">
                <Loader className="text-blue-500 h-10 w-10" />
              </div>
            ) : geminiInsights ? (
              <div className="space-y-4">
                {/* Summary */}
                <div className="text-sm text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                  {geminiInsights.summary}
                </div>
                
                {/* Key Insights */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">Key Insights</h4>
                  <ul className="space-y-2">
                    {geminiInsights.keyInsights.map((insight, index) => (
                      <li key={index} className="flex items-start">
                        <ThumbsUp className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Risk Factors */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">Risk Factors</h4>
                  <ul className="space-y-2">
                    {geminiInsights.risks.map((risk, index) => (
                      <li key={index} className="flex items-start">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Price Prediction */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                  <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">Price Predictions</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Short Term:</span>
                      <span className="text-xs font-medium text-gray-800 dark:text-gray-200">{geminiInsights.prediction.shortTerm}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Medium Term:</span>
                      <span className="text-xs font-medium text-gray-800 dark:text-gray-200">{geminiInsights.prediction.mediumTerm}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Confidence:</span>
                      <span className="text-xs font-medium text-gray-800 dark:text-gray-200">{geminiInsights.prediction.confidence}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                <Sparkles className="h-12 w-12 mb-4 text-gray-400" />
                <p>No AI insights available for {selectedCoin}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Price Correlation Chart */}
      <Card className="shadow-lg border border-gray-200 dark:border-gray-700 dark:bg-slate-900">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Price Correlations
            </CardTitle>
          </div>
          <CardDescription className="text-blue-100 mt-1">
            Relationship between {selectedCoin.charAt(0).toUpperCase() + selectedCoin.slice(1)} and other assets
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {loading ? (
            <div className="flex justify-center py-10 animate-pulse">
              <Loader className="text-blue-500 h-10 w-10" />
            </div>
          ) : geminiInsights?.priceCorrelations ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={formatCorrelationData()}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis 
                    type="number" 
                    domain={[-100, 100]} 
                    ticks={[-100, -50, 0, 50, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <YAxis dataKey="name" type="category" />
                  <RechartsTooltip 
                    formatter={(value) => [`${value}%`, 'Correlation']}
                    cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                  />
                  <Bar dataKey="value">
                    {formatCorrelationData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
              <BarChart3 className="h-12 w-12 mb-4 text-gray-400" />
              <p>No correlation data available for {selectedCoin}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderSocialTab = () => (
    <div className="space-y-6">
      {/* Platform Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Twitter Stats */}
        <Card className="shadow-md border border-gray-200 dark:border-gray-700 dark:bg-slate-900">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Twitter Sentiment</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22 5.8a8.49 8.49 0 0 1-2.36.64 4.13 4.13 0 0 0 1.81-2.27 8.21 8.21 0 0 1-2.61 1 4.1 4.1 0 0 0-7 3.74 11.64 11.64 0 0 1-8.45-4.29 4.16 4.16 0 0 0-.55 2.07 4.09 4.09 0 0 0 1.82 3.41 4.05 4.05 0 0 1-1.86-.51v.05a4.1 4.1 0 0 0 3.3 4 3.93 3.93 0 0 1-1.1.17 4.9 4.9 0 0 1-.77-.07 4.11 4.11 0 0 0 3.83 2.84A8.22 8.22 0 0 1 3 18.34a7.93 7.93 0 0 1-1-.06 11.57 11.57 0 0 0 6.29 1.85A11.59 11.59 0 0 0 20 8.45v-.53a8.43 8.43 0 0 0 2-2.12Z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {geminiInsights?.sentimentMetrics?.twitterSentiment.toFixed(1) || "8.2"}
              <span className="text-sm font-normal text-gray-500 ml-1">/10</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Based on {tweets.length} recent tweets
            </p>
            <div className={`text-sm mt-2 font-medium ${getInsightSentimentColor(geminiInsights?.sentimentMetrics?.twitterSentiment || 8.2)}`}>
              {(geminiInsights?.sentimentMetrics?.twitterSentiment || 8.2) > 7 ? "Highly Positive" : 
               (geminiInsights?.sentimentMetrics?.twitterSentiment || 8.2) > 5 ? "Positive" : 
               (geminiInsights?.sentimentMetrics?.twitterSentiment || 8.2) > 4 ? "Neutral" : 
               "Negative"}
            </div>
          </CardContent>
        </Card>

        {/* Telegram Stats */}
        <Card className="shadow-md border border-gray-200 dark:border-gray-700 dark:bg-slate-900">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Telegram Sentiment</CardTitle>
            <Send className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {geminiInsights?.sentimentMetrics?.telegramSentiment.toFixed(1) || "7.9"}
              <span className="text-sm font-normal text-gray-500 ml-1">/10</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Based on {telegramData.length} group messages
            </p>
            <div className={`text-sm mt-2 font-medium ${getInsightSentimentColor(geminiInsights?.sentimentMetrics?.telegramSentiment || 7.9)}`}>
              {(geminiInsights?.sentimentMetrics?.telegramSentiment || 7.9) > 7 ? "Highly Positive" : 
               (geminiInsights?.sentimentMetrics?.telegramSentiment || 7.9) > 5 ? "Positive" : 
               (geminiInsights?.sentimentMetrics?.telegramSentiment || 7.9) > 4 ? "Neutral" : 
               "Negative"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different social platforms */}
      <Tabs defaultValue="twitter" className="w-full">
        <TabsList className="bg-slate-100 dark:bg-slate-800 mb-4">
          <TabsTrigger value="twitter" className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22 5.8a8.49 8.49 0 0 1-2.36.64 4.13 4.13 0 0 0 1.81-2.27 8.21 8.21 0 0 1-2.61 1 4.1 4.1 0 0 0-7 3.74 11.64 11.64 0 0 1-8.45-4.29 4.16 4.16 0 0 0-.55 2.07 4.09 4.09 0 0 0 1.82 3.41 4.05 4.05 0 0 1-1.86-.51v.05a4.1 4.1 0 0 0 3.3 4 3.93 3.93 0 0 1-1.1.17 4.9 4.9 0 0 1-.77-.07 4.11 4.11 0 0 0 3.83 2.84A8.22 8.22 0 0 1 3 18.34a7.93 7.93 0 0 1-1-.06 11.57 11.57 0 0 0 6.29 1.85A11.59 11.59 0 0 0 20 8.45v-.53a8.43 8.43 0 0 0 2-2.12Z" />
            </svg>
            Twitter
          </TabsTrigger>
          <TabsTrigger value="telegram" className="flex items-center">
            <Send className="h-4 w-4 mr-1 text-blue-500" />
            Telegram
          </TabsTrigger>
        </TabsList>

        <TabsContent value="twitter">
          <Card className="shadow-lg border border-gray-200 dark:border-gray-700 dark:bg-slate-900">
            <CardHeader className="bg-gradient-to-r from-blue-400 to-cyan-400 text-white">
              <CardTitle className="flex items-center text-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22 5.8a8.49 8.49 0 0 1-2.36.64 4.13 4.13 0 0 0 1.81-2.27 8.21 8.21 0 0 1-2.61 1 4.1 4.1 0 0 0-7 3.74 11.64 11.64 0 0 1-8.45-4.29 4.16 4.16 0 0 0-.55 2.07 4.09 4.09 0 0 0 1.82 3.41 4.05 4.05 0 0 1-1.86-.51v.05a4.1 4.1 0 0 0 3.3 4 3.93 3.93 0 0 1-1.1.17 4.9 4.9 0 0 1-.77-.07 4.11 4.11 0 0 0 3.83 2.84A8.22 8.22 0 0 1 3 18.34a7.93 7.93 0 0 1-1-.06 11.57 11.57 0 0 0 6.29 1.85A11.59 11.59 0 0 0 20 8.45v-.53a8.43 8.43 0 0 0 2-2.12Z" />
                </svg>
                Recent Tweets about {selectedCoin.charAt(0).toUpperCase() + selectedCoin.slice(1)}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center py-10 animate-pulse">
                  <Loader className="text-blue-500 h-10 w-10" />
                </div>
              ) : tweets.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {tweets.map((tweet, index) => {
                    const sentimentColor = tweet.sentiment === "positive" ? "text-green-500" :
                                          tweet.sentiment === "negative" ? "text-red-500" :
                                          "text-yellow-500";
                    
                    return (
                      <div 
                        key={index} 
                        className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors duration-150"
                      >
                        <div className="flex gap-4">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white">
                              <User className="h-6 w-6" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center mb-1">
                              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">@{tweet.username}</p>
                              {tweet.sentiment && (
                                <span className={`ml-2 text-xs ${sentimentColor}`}>
                                  • {tweet.sentiment}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{tweet.content}</p>
                            {tweet.timestamp && (
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(tweet.timestamp).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p>No recent tweets found for {selectedCoin}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="telegram">
          <Card className="shadow-lg border border-gray-200 dark:border-gray-700 dark:bg-slate-900">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
              <CardTitle className="flex items-center text-lg">
                <Send className="h-5 w-5 mr-2" />
                Telegram Group Discussions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center py-10 animate-pulse">
                  <Loader className="text-blue-500 h-10 w-10" />
                </div>
              ) : telegramData.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {telegramData.map((message, index) => {
                    const sentimentColor = message.sentiment === "positive" ? "text-green-500" :
                                          message.sentiment === "negative" ? "text-red-500" :
                                          "text-yellow-500";
                    
                    return (
                      <div 
                        key={index} 
                        className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors duration-150"
                      >
                        <div className="flex gap-4">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                              <MessageCircle className="h-6 w-6" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1">
                              <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">@{message.username}</p>
                                <p className="text-xs text-gray-500">
                                  {message.groupName} • {message.memberCount.toLocaleString()} members
                                </p>
                              </div>
                              {message.sentiment && (
                                <span className={`text-xs ${sentimentColor} mt-1 sm:mt-0`}>
                                  {message.sentiment}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{message.content}</p>
                            {message.timestamp && (
                              <p className="text-xs text-gray-500 mt-2">
                                {new Date(message.timestamp).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                  <MessageCircle className="h-12 w-12 mb-4 text-gray-400" />
                  <p>No Telegram data found for {selectedCoin}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderInsightsTab = () => (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="shadow-lg border border-gray-200 dark:border-gray-700 dark:bg-slate-900">
        <CardHeader className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2" />
              Gemini AI Market Insights
            </CardTitle>
          </div>
          <CardDescription className="text-indigo-100 mt-1">
            Advanced AI analysis for {selectedCoin.charAt(0).toUpperCase() + selectedCoin.slice(1)}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex justify-center py-10 animate-pulse">
              <Loader className="text-blue-500 h-10 w-10" />
            </div>
          ) : geminiInsights ? (
            <div className="space-y-6">
              <div className="text-sm text-gray-700 dark:text-gray-300 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800">
                {geminiInsights.summary}
              </div>
              
              {/* Key Insights and Risks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Key Insights */}
                <Card className="border border-green-100 dark:border-green-900 bg-green-50 dark:bg-green-900/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-green-800 dark:text-green-300 flex items-center">
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Key Bullish Factors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {geminiInsights.keyInsights.map((insight, index) => (
                        <li key={index} className="flex items-start text-sm text-green-700 dark:text-green-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 text-green-600 dark:text-green-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                
                {/* Risk Factors */}
                <Card className="border border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-900/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-red-800 dark:text-red-300 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Risk Factors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {geminiInsights.risks.map((risk, index) => (
                        <li key={index} className="flex items-start text-sm text-red-700 dark:text-red-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 text-red-600 dark:text-red-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
              
              {/* Price Predictions Card */}
              <Card className="shadow-md border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-blue-800 dark:text-blue-300 flex items-center">
                    <LineChart className="h-4 w-4 mr-2" />
                    Price Predictions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Short Term */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Short Term</div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{geminiInsights.prediction.shortTerm}</div>
                    </div>
                    
                    {/* Medium Term */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Medium Term</div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{geminiInsights.prediction.mediumTerm}</div>
                    </div>
                    
                    {/* Confidence */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Prediction Confidence</div>
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{geminiInsights.prediction.confidence}%</div>
                        <div className="ml-2 flex-1">
                          <Progress value={geminiInsights.prediction.confidence} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
              <Sparkles className="h-12 w-12 mb-4 text-gray-400" />
              <p>No AI insights available for {selectedCoin}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <DashboardLayout title="Sentiment Analysis" description="Analyze market sentiment and social metrics">
      {/* Token Selection Section */}
      <div className="mb-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Select Token</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Choose a token to analyze its sentiment and social metrics.
        </p>
        <div className="flex gap-2">
          <select
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedCoin}
            onChange={(e) => {
              setSelectedCoin(e.target.value);
              fetchCoinData(e.target.value);
            }}
          >
            {coinList.map((coin) => (
              <option 
                key={coin.id} 
                value={coin.id}
                className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
              >
                {coin.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => fetchCoinData(selectedCoin)}
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
      </div>

      <div>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="social">Social Analysis</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">{renderOverviewTab()}</TabsContent>
          <TabsContent value="social">{renderSocialTab()}</TabsContent>
          <TabsContent value="insights">{renderInsightsTab()}</TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default CryptoSentimentDashboard;

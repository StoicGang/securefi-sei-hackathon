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
  Send,
  Search
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

// Backend API URL
const API_BASE_URL = 'https://securefi-2.onrender.com';

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

  // Get sentiment color and icon
  const getSentimentColor = (value) => {
    if (value > 0.3) return "text-green-500";
    if (value < -0.3) return "text-red-500";
    return "text-yellow-500";
  };

  const getSentimentLabel = (value) => {
    if (value > 0.3) return "Bullish";
    if (value < -0.3) return "Bearish";
    return "Neutral";
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
        <Card className="border border-gray-800 bg-gray-900/90 backdrop-blur-sm rounded-xl">
          <CardContent className="p-6">
            <p className="text-sm text-gray-400 mb-3">Overall Sentiment</p>
            <div className="flex justify-between items-center">
              <div className="text-4xl font-bold text-white">
                {(geminiInsights?.sentimentMetrics?.overallScore || 7.8).toFixed(1)}
                <span className="text-sm font-normal text-gray-400">/10</span>
              </div>
  );

  const renderInsightsTab = () => (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="border border-gray-800 bg-gray-900/90 backdrop-blur-sm rounded-xl">
        <CardHeader className="p-6 border-b border-gray-800">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center text-white">
              <Sparkles className="h-5 w-5 mr-2" />
              Gemini AI Market Insights
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader className="h-10 w-10 text-blue-500 animate-spin" />
            </div>
          ) : geminiInsights ? (
            <div className="space-y-6">
              {/* Summary Box */}
              <div className="bg-gray-800/50 rounded-lg p-6">
                <p className="text-sm text-gray-300">{geminiInsights.summary}</p>
              </div>
              
              {/* Key Insights and Risks Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Key Insights */}
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6">
                  <h4 className="text-sm font-semibold text-green-400 mb-4 flex items-center">
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Key Bullish Factors
                  </h4>
                  <ul className="space-y-3">
                    {geminiInsights.keyInsights.map((insight, index) => (
                      <li key={index} className="flex items-start text-sm text-green-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Risk Factors */}
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
                  <h4 className="text-sm font-semibold text-red-400 mb-4 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Risk Factors
                  </h4>
                  <ul className="space-y-3">
                    {geminiInsights.risks.map((risk, index) => (
                      <li key={index} className="flex items-start text-sm text-red-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {/* Price Predictions Card */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
                <h4 className="text-sm font-semibold text-blue-400 mb-4 flex items-center">
                  <LineChart className="h-4 w-4 mr-2" />
                  Price Predictions
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Short Term */}
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <div className="text-xs text-gray-400 mb-1">Short Term</div>
                    <div className="text-sm font-medium text-gray-200">{geminiInsights.prediction.shortTerm}</div>
                  </div>
                  
                  {/* Medium Term */}
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <div className="text-xs text-gray-400 mb-1">Medium Term</div>
                    <div className="text-sm font-medium text-gray-200">{geminiInsights.prediction.mediumTerm}</div>
                  </div>
                  
                  {/* Confidence */}
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <div className="text-xs text-gray-400 mb-1">Prediction Confidence</div>
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-200">{geminiInsights.prediction.confidence}%</div>
                      <div className="ml-2 flex-1">
                        <Progress value={geminiInsights.prediction.confidence} className="h-2 bg-gray-700" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <Sparkles className="h-12 w-12 mb-4 text-gray-600" />
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
        <h1 className="text-2xl font-bold mb-2 text-white">Select Token</h1>
        <p className="text-gray-400 mb-4">
          Choose a token to analyze its sentiment and social metrics.
        </p>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <select
              className="w-full px-4 py-3 rounded-lg border border-blue-500 bg-gray-900/90 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="bg-gray-900 text-white"
                >
                  {coin.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => fetchCoinData(selectedCoin)}
            disabled={loading}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader className="h-5 w-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                Analyze
                <Search className="h-5 w-5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-gray-900/50 border border-gray-800 mb-6 backdrop-blur-sm">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="social" 
              className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400"
            >
              Social Analysis
            </TabsTrigger>
            <TabsTrigger 
              value="insights" 
              className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400"
            >
              AI Insights
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview">{renderOverviewTab()}</TabsContent>
          <TabsContent value="social">{renderSocialTab()}</TabsContent>
          <TabsContent value="insights">{renderInsightsTab()}</TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default CryptoSentimentDashboard;            <div className={`text-lg font-semibold flex items-center ${
                (geminiInsights?.sentimentMetrics?.overallScore || 7.8) > 6.5 ? "text-green-500" : 
                (geminiInsights?.sentimentMetrics?.overallScore || 7.8) < 4.5 ? "text-red-500" : 
                "text-yellow-500"
              }`}>
                {getSentimentLabel(geminiInsights?.sentimentMetrics?.overallScore || 7.8)}
                {(geminiInsights?.sentimentMetrics?.overallScore || 7.8) > 6.5 ? (
                  <TrendingUp className="h-5 w-5 ml-2" />
                ) : (geminiInsights?.sentimentMetrics?.overallScore || 7.8) < 4.5 ? (
                  <TrendingDown className="h-5 w-5 ml-2" />
                ) : (
                  <Share2 className="h-5 w-5 ml-2" />
                )}
              </div>
            </div>
            <Progress 
              value={(geminiInsights?.sentimentMetrics?.overallScore || 7.8) * 10} 
              className="h-2 mt-4 bg-gray-800"
            />
          </CardContent>
        </Card>

        {/* Risk Level Card */}
        <Card className="border border-gray-800 bg-gray-900/90 backdrop-blur-sm rounded-xl">
          <CardContent className="p-6">
            <p className="text-sm text-gray-400 mb-3">Risk Level</p>
            <div className="flex justify-between items-center">
              <div className="text-3xl font-bold text-white capitalize">
                {geminiInsights?.technicalAnalysis?.riskLevel || "Moderate"}
              </div>
              <div className={`flex items-center ${
                (geminiInsights?.technicalAnalysis?.riskLevel || "moderate").toLowerCase() === "low" ? "text-green-500" : 
                (geminiInsights?.technicalAnalysis?.riskLevel || "moderate").toLowerCase() === "high" ? "text-red-500" : 
                "text-yellow-500"
              }`}>
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-400">
              {(geminiInsights?.technicalAnalysis?.riskLevel || "moderate").toLowerCase() === "low" ? (
                "Low volatility expected in the near term"
              ) : (geminiInsights?.technicalAnalysis?.riskLevel || "moderate").toLowerCase() === "high" ? (
                "High volatility expected in the near term"
              ) : (
                "Moderate volatility expected in the near term"
              )}
            </p>
          </CardContent>
        </Card>

        {/* Technical Trend Card */}
        <Card className="border border-gray-800 bg-gray-900/90 backdrop-blur-sm rounded-xl">
          <CardContent className="p-6">
            <p className="text-sm text-gray-400 mb-3">Technical Trend</p>
            <div className="flex justify-between items-center">
              <div className="text-3xl font-bold text-white capitalize">
                {geminiInsights?.technicalAnalysis?.trend || "Bullish"}
              </div>
              <div className={`flex items-center ${
                (geminiInsights?.technicalAnalysis?.trend || "bullish").toLowerCase() === "bullish" ? "text-green-500" : 
                (geminiInsights?.technicalAnalysis?.trend || "bullish").toLowerCase() === "bearish" ? "text-red-500" : 
                "text-yellow-500"
              }`}>
                {(geminiInsights?.technicalAnalysis?.trend || "bullish").toLowerCase() === "bullish" ? (
                  <ArrowUpRight className="h-6 w-6" />
                ) : (geminiInsights?.technicalAnalysis?.trend || "bullish").toLowerCase() === "bearish" ? (
                  <ArrowDownRight className="h-6 w-6" />
                ) : (
                  <Share2 className="h-6 w-6" />
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm text-gray-400">Support:</p>
                <p className="text-lg font-bold text-white">
                  ${geminiInsights?.technicalAnalysis?.strongSupport?.toLocaleString() || "29,800"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Resistance:</p>
                <p className="text-lg font-bold text-white">
                  ${geminiInsights?.technicalAnalysis?.strongResistance?.toLocaleString() || "32,500"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Analysis Card */}
        <Card className="border border-gray-800 bg-gray-900/90 backdrop-blur-sm rounded-xl">
          <CardHeader className="p-6 border-b border-gray-800">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center text-white">
                <div className="mr-2 font-bold text-xl">{selectedCoin.charAt(0).toUpperCase() + selectedCoin.slice(1)}</div>
                <div className="text-sm px-2 py-1 bg-blue-500/20 text-blue-400 rounded">{selectedCoin.toUpperCase()}</div>
              </CardTitle>
              <PieChart className="h-5 w-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader className="h-10 w-10 text-blue-500 animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Sentiment Distribution Chart */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold mb-4 text-gray-300">Sentiment Distribution</h4>
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
                          label={({ name, value }) => `${name}: ${value}%`}
                        >
                          {getSentimentDistributionPieData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Legend />
                        <RechartsTooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Analysis Time */}
                <div className="text-xs text-gray-400 text-center">
                  Last Updated: {new Date(sentimentData?.analysis_time ?? Date.now()).toLocaleString()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Insights Card */}
        <Card className="border border-gray-800 bg-gray-900/90 backdrop-blur-sm rounded-xl">
          <CardHeader className="p-6 border-b border-gray-800">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center text-white">
                <Sparkles className="h-5 w-5 mr-2" />
                Gemini AI Insights
              </CardTitle>
              <div className="text-xs px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded">Powered by Google</div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader className="h-10 w-10 text-blue-500 animate-spin" />
              </div>
            ) : geminiInsights ? (
              <div className="space-y-6">
                {/* Summary */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-sm text-gray-300">{geminiInsights.summary}</p>
                </div>
                
                {/* Key Insights */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-gray-300">Key Insights</h4>
                  <ul className="space-y-2">
                    {geminiInsights.keyInsights.map((insight, index) => (
                      <li key={index} className="flex items-start">
                        <ThumbsUp className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-400">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Risk Factors */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-gray-300">Risk Factors</h4>
                  <ul className="space-y-2">
                    {geminiInsights.risks.map((risk, index) => (
                      <li key={index} className="flex items-start">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-400">{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Price Prediction */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold mb-4 text-gray-300">Price Predictions</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Short Term:</span>
                      <span className="text-sm font-medium text-gray-200">{geminiInsights.prediction.shortTerm}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Medium Term:</span>
                      <span className="text-sm font-medium text-gray-200">{geminiInsights.prediction.mediumTerm}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Confidence:</span>
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-200 mr-2">{geminiInsights.prediction.confidence}%</span>
                        <Progress value={geminiInsights.prediction.confidence} className="w-20 h-2 bg-gray-800" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <Sparkles className="h-12 w-12 mb-4 text-gray-600" />
                <p>No AI insights available for {selectedCoin}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderSocialTab = () => (
    <div className="space-y-6">
      {/* Platform Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Twitter Stats */}
        <Card className="border border-gray-800 bg-gray-900/90 backdrop-blur-sm rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-400">Twitter Sentiment</p>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 5.8a8.49 8.49 0 0 1-2.36.64 4.13 4.13 0 0 0 1.81-2.27 8.21 8.21 0 0 1-2.61 1 4.1 4.1 0 0 0-7 3.74 11.64 11.64 0 0 1-8.45-4.29 4.16 4.16 0 0 0-.55 2.07 4.09 4.09 0 0 0 1.82 3.41 4.05 4.05 0 0 1-1.86-.51v.05a4.1 4.1 0 0 0 3.3 4 3.93 3.93 0 0 1-1.1.17 4.9 4.9 0 0 1-.77-.07 4.11 4.11 0 0 0 3.83 2.84A8.22 8.22 0 0 1 3 18.34a7.93 7.93 0 0 1-1-.06 11.57 11.57 0 0 0 6.29 1.85A11.59 11.59 0 0 0 20 8.45v-.53a8.43 8.43 0 0 0 2-2.12Z" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {geminiInsights?.sentimentMetrics?.twitterSentiment.toFixed(1) || "8.2"}
              <span className="text-sm font-normal text-gray-400 ml-1">/10</span>
            </div>
            <p className="text-xs text-gray-400">
              Based on {tweets.length} recent tweets
            </p>
          </CardContent>
        </Card>

        {/* Telegram Stats */}
        <Card className="border border-gray-800 bg-gray-900/90 backdrop-blur-sm rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-400">Telegram Sentiment</p>
              <Send className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {geminiInsights?.sentimentMetrics?.telegramSentiment.toFixed(1) || "7.9"}
              <span className="text-sm font-normal text-gray-400 ml-1">/10</span>
            </div>
            <p className="text-xs text-gray-400">
              Based on {telegramData.length} group messages
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Social Content Tabs */}
      <Card className="border border-gray-800 bg-gray-900/90 backdrop-blur-sm rounded-xl">
        <Tabs defaultValue="twitter" className="w-full">
          <TabsList className="border-b border-gray-800 bg-transparent p-0">
            <TabsTrigger value="twitter" className="px-6 py-4 text-gray-400 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400">
              Twitter
            </TabsTrigger>
            <TabsTrigger value="telegram" className="px-6 py-4 text-gray-400 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400">
              Telegram
            </TabsTrigger>
          </TabsList>

          <TabsContent value="twitter" className="p-0">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader className="h-10 w-10 text-blue-500 animate-spin" />
              </div>
            ) : tweets.length > 0 ? (
              <div className="divide-y divide-gray-800">
                {tweets.map((tweet, index) => (
                  <div key={index} className="p-6 hover:bg-gray-800/50 transition-colors">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <User className="h-6 w-6 text-blue-400" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <p className="text-sm font-bold text-white">@{tweet.username}</p>
                          {tweet.sentiment && (
                            <span className={`ml-2 text-xs ${
                              tweet.sentiment === "positive" ? "text-green-500" :
                              tweet.sentiment === "negative" ? "text-red-500" :
                              "text-yellow-500"
                            }`}>
                              • {tweet.sentiment}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-300">{tweet.content}</p>
                        {tweet.timestamp && (
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(tweet.timestamp).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <MessageCircle className="h-12 w-12 mb-4 text-gray-600" />
                <p>No recent tweets found for {selectedCoin}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="telegram" className="p-0">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader className="h-10 w-10 text-blue-500 animate-spin" />
              </div>
            ) : telegramData.length > 0 ? (
              <div className="divide-y divide-gray-800">
                {telegramData.map((message, index) => (
                  <div key={index} className="p-6 hover:bg-gray-800/50 transition-colors">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <MessageCircle className="h-6 w-6 text-blue-400" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1">
                          <div>
                            <p className="text-sm font-bold text-white">@{message.username}</p>
                            <p className="text-xs text-gray-500">
                              {message.groupName} • {message.memberCount.toLocaleString()} members
                            </p>
                          </div>
                          {message.sentiment && (
                            <span className={`text-xs mt-1 sm:mt-0 ${
                              message.sentiment === "positive" ? "text-green-500" :
                              message.sentiment === "negative" ? "text-red-500" :
                              "text-yellow-500"
                            }`}>
                              {message.sentiment}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-300 mt-2">{message.content}</p>
                        {message.timestamp && (
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(message.timestamp).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <MessageCircle className="h-12 w-12 mb-4 text-gray-600" />
                <p>No Telegram data found for {selectedCoin}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>

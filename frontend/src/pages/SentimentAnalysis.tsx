import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown,
  ArrowRight,
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
  RefreshCw
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

const API_BASE_URL = 'http://localhost:5000/api';

const CryptoSentimentDashboard = () => {
  const [selectedCoin, setSelectedCoin] = useState('');
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Data states
  const [sentimentData, setSentimentData] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [socialData, setSocialData] = useState(null);
  const [error, setError] = useState(null);

  // Fetch available coins on component mount
  useEffect(() => {
    fetchCoins();
  }, []);

  const fetchCoins = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/coins`);
      const data = await response.json();
      setCoins(data);
    } catch (err) {
      console.error('Error fetching coins:', err);
      setError('Failed to fetch available coins');
    }
  };

  const fetchCoinData = async (coin) => {
    if (!coin) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [sentimentResponse, analysisResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/sentiment?token=${encodeURIComponent(coin)}`),
        fetch(`${API_BASE_URL}/analyze?coin=${encodeURIComponent(coin)}`)
      ]);
      
      const sentimentResult = await sentimentResponse.json();
      const analysisResult = await analysisResponse.json();
      
      setSentimentData(sentimentResult);
      setAiInsights(sentimentResult.ai_insights);
      setSocialData(sentimentResult.social_analysis);
      
    } catch (err) {
      console.error('Error fetching coin data:', err);
      setError('Failed to fetch coin data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/refresh_data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: selectedCoin })
      });
      
      if (response.ok) {
        await fetchCoinData(selectedCoin);
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
    }
  };

  const getSentimentColor = (score) => {
    if (score >= 7.5) return "text-green-500 bg-green-100 dark:bg-green-900";
    if (score <= 4.0) return "text-red-500 bg-red-100 dark:bg-red-900";
    return "text-yellow-500 bg-yellow-100 dark:bg-yellow-900";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {sentimentData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Overall Sentiment Card */}
            <Card className="shadow-md border border-gray-200 dark:border-gray-700 dark:bg-slate-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Overall Sentiment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="text-3xl font-bold">
                    {sentimentData.overview.overall_sentiment.score}
                    <span className="text-sm font-normal text-gray-500 ml-1">/10</span>
                  </div>
                  <Badge className={getSentimentColor(sentimentData.overview.overall_sentiment.score)}>
                    {sentimentData.overview.overall_sentiment.label}
                  </Badge>
                </div>
                <Progress 
                  value={sentimentData.overview.overall_sentiment.score * 10} 
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
                    {sentimentData.overview.risk_level.level}
                  </div>
                  <AlertTriangle className={`h-5 w-5 ${
                    sentimentData.overview.risk_level.level === "Low" ? "text-green-500" :
                    sentimentData.overview.risk_level.level === "High" ? "text-red-500" :
                    "text-yellow-500"
                  }`} />
                </div>
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                  {sentimentData.overview.risk_level.details}
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
                    {sentimentData.overview.technical_trend.trend}
                  </div>
                  {sentimentData.overview.technical_trend.trend === "Bullish" ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : sentimentData.overview.technical_trend.trend === "Bearish" ? (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  ) : (
                    <ArrowRight className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                  <div className="text-gray-600 dark:text-gray-300">
                    Support: <span className="font-semibold">
                      ${sentimentData.overview.technical_trend.support.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-gray-600 dark:text-gray-300">
                    Resistance: <span className="font-semibold">
                      ${sentimentData.overview.technical_trend.resistance.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights Card */}
          {aiInsights && (
            <Card className="shadow-lg border border-gray-200 dark:border-gray-700 dark:bg-slate-900">
              <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <Sparkles className="h-5 w-5 mr-2" />
                    Gemini AI Insights
                  </CardTitle>
                  <button
                    onClick={refreshData}
                    className="text-white hover:text-blue-200 transition-colors"
                  >
                    <RefreshCw className="h-5 w-5" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="text-sm text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    {aiInsights.summary}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">Key Bullish Factors</h4>
                      <ul className="space-y-2">
                        {aiInsights.key_factors.filter(f => f.type === 'bullish').map((factor, index) => (
                          <li key={index} className="flex items-start">
                            <ThumbsUp className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{factor.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">Risk Factors</h4>
                      <ul className="space-y-2">
                        {aiInsights.risk_factors.filter(f => f.type === 'bearish').map((factor, index) => (
                          <li key={index} className="flex items-start">
                            <AlertTriangle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{factor.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                    <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">Market Outlook</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{aiInsights.prediction}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );

  const renderSocialTab = () => (
    <div className="space-y-6">
      {socialData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Twitter Analysis */}
          <Card className="shadow-lg border border-gray-200 dark:border-gray-700 dark:bg-slate-900">
            <CardHeader className="bg-gradient-to-r from-blue-400 to-cyan-400 text-white">
              <CardTitle className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22 5.8a8.49 8.49 0 0 1-2.36.64 4.13 4.13 0 0 0 1.81-2.27 8.21 8.21 0 0 1-2.61 1 4.1 4.1 0 0 0-7 3.74 11.64 11.64 0 0 1-8.45-4.29 4.16 4.16 0 0 0-.55 2.07 4.09 4.09 0 0 0 1.82 3.41 4.05 4.05 0 0 1-1.86-.51v.05a4.1 4.1 0 0 0 3.3 4 3.93 3.93 0 0 1-1.1.17 4.9 4.9 0 0 1-.77-.07 4.11 4.11 0 0 0 3.83 2.84A8.22 8.22 0 0 1 3 18.34a7.93 7.93 0 0 1-1-.06 11.57 11.57 0 0 0 6.29 1.85A11.59 11.59 0 0 0 20 8.45v-.53a8.43 8.43 0 0 0 2-2.12Z" />
                </svg>
                Twitter Sentiment
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {socialData.twitter.score}
                <span className="text-sm font-normal text-gray-500 ml-1">/10</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Based on {socialData.twitter.messages.length} recent tweets
              </p>
              
              <div className="mt-4 space-y-3">
                {socialData.twitter.messages.slice(0, 5).map((message, index) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-medium">@{message.username}</span>
                      <Badge className={`${
                        message.sentiment_label === "Positive" ? "bg-green-100 text-green-800" :
                        message.sentiment_label === "Negative" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {message.sentiment_label}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{message.message}</p>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDate(message.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Telegram Analysis */}
          <Card className="shadow-lg border border-gray-200 dark:border-gray-700 dark:bg-slate-900">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
              <CardTitle className="flex items-center">
                <Send className="h-5 w-5 mr-2" />
                Telegram Sentiment
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {socialData.telegram.score}
                <span className="text-sm font-normal text-gray-500 ml-1">/10</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Based on {socialData.telegram.messages.length} recent messages
              </p>
              
              <div className="mt-4 space-y-3">
                {socialData.telegram.messages.slice(0, 5).map((message, index) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-medium">@{message.username}</span>
                      <Badge className={`${
                        message.sentiment_label === "Positive" ? "bg-green-100 text-green-800" :
                        message.sentiment_label === "Negative" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {message.sentiment_label}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{message.message}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">{message.channel}</span>
                      <span className="text-xs text-gray-500">{formatDate(message.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Token Selection */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Crypto Sentiment Analysis</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Choose a cryptocurrency to analyze its sentiment and social metrics.
        </p>
        <div className="flex gap-2">
          <select
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
            value={selectedCoin}
            onChange={(e) => {
              setSelectedCoin(e.target.value);
              fetchCoinData(e.target.value);
            }}
          >
            <option value="">Select a coin...</option>
            {coins.map((coin) => (
              <option key={coin} value={coin}>
                {coin.charAt(0).toUpperCase() + coin.slice(1)}
              </option>
            ))}
          </select>
          <button
            onClick={() => fetchCoinData(selectedCoin)}
            disabled={loading || !selectedCoin}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze'
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {selectedCoin && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="social">Social Analysis</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">{renderOverviewTab()}</TabsContent>
          <TabsContent value="social">{renderSocialTab()}</TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default CryptoSentimentDashboard;

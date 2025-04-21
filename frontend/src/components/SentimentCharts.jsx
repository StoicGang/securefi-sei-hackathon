import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader, PieChart } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  Tooltip as RechartsTooltip
} from "recharts";

const SentimentCharts = ({ selectedCoin, sentimentData, loading, getSentimentColor }) => {
  // Prepare sentiment distribution data for the chart
  const getSentimentDistribution = () => {
    if (!sentimentData?.sentiment_distribution) {
      return {
        positive: 33,
        neutral: 34,
        negative: 33
      };
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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="shadow-lg border border-gray-200 dark:border-gray-700 dark:bg-slate-900 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <div className="mr-2 font-bold text-lg">{selectedCoin.name}</div>
              <div className="text-sm opacity-90 bg-white/20 px-2 py-1 rounded">{selectedCoin.symbol}</div>
            </CardTitle>
            <PieChart className="h-5 w-5 opacity-75" />
          </div>
          <CardDescription className="text-blue-100 mt-1">Sentiment Analysis Dashboard</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <motion.div className="flex justify-center py-10 animate-pulse">
              <Loader className="text-blue-500 h-10 w-10" />
            </motion.div>
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
                        label={({ name, value }) => `${name}: ${value}%`}
                        labelLine={false}
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
    </motion.div>
  );
};

export default SentimentCharts;
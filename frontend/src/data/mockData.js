// Mock Data for the Crypto Sentiment Dashboard

// Mock Coin Data
export const mockCoinData = [
    {
      id: "bitcoin",
      name: "Bitcoin",
      symbol: "BTC",
      current_price: 31240.52,
      market_cap: 612356794835,
      market_cap_rank: 1,
      price_change_percentage_24h: 2.35,
    },
    {
      id: "ethereum",
      name: "Ethereum",
      symbol: "ETH",
      current_price: 1845.32,
      market_cap: 221753494927,
      market_cap_rank: 2,
      price_change_percentage_24h: 1.89,
    },
    {
      id: "binancecoin",
      name: "Binance Coin",
      symbol: "BNB",
      current_price: 228.91,
      market_cap: 35234567890,
      market_cap_rank: 3,
      price_change_percentage_24h: -0.45,
    }
  ];
  
  // Mock Twitter Data
  export const mockTwitterData = [
    {
      username: "cryptotrader",
      content: "Bitcoin looking strong today! The support at $30k is holding well. Expecting a breakout soon! #BTC #Bullish",
      sentiment: "positive",
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      likes: 245,
      retweets: 78
    },
    {
      username: "blockchain_guru",
      content: "Just analyzed the on-chain metrics for BTC. Accumulation pattern is clear, whales are buying.",
      sentiment: "positive",
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      likes: 189,
      retweets: 42
    },
    {
      username: "crypto_skeptic",
      content: "Be careful with Bitcoin right now. Technical indicators showing overbought conditions. Might see a pullback.",
      sentiment: "negative",
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      likes: 85,
      retweets: 12
    },
    {
      username: "investor_daily",
      content: "Bitcoin consolidating above $30k. Neither bullish nor bearish at the moment. Watching closely.",
      sentiment: "neutral",
      timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      likes: 102,
      retweets: 24
    }
  ];
  
  // Mock Telegram Data
  export const mockTelegramData = [
    {
      username: "crypto_whale",
      content: "Just loaded up on more $BTC. This bull run is just getting started! 🚀",
      sentiment: "positive",
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      groupName: "Bitcoin Traders",
      memberCount: 45800
    },
    {
      username: "defi_guru",
      content: "The recent volatility in Bitcoin is concerning. Be careful with leverage right now.",
      sentiment: "negative",
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      groupName: "DeFi Diamonds",
      memberCount: 32400
    },
    {
      username: "eth_maxi",
      content: "ETH 2.0 is going to change everything. Holding strong despite the market.",
      sentiment: "neutral",
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      groupName: "Ethereum Enthusiasts",
      memberCount: 28900
    }
  ];
  
  // Mock AI Insights Data
  export const mockGeminiInsights = {
    bitcoin: {
      summary: "Bitcoin is showing strong bullish signals based on on-chain metrics, social sentiment, and technical indicators. The asset has maintained support above $30,000 despite recent market turbulence, indicating strong holder conviction.",
      technicalAnalysis: {
        trend: "bullish",
        strongSupport: 29800,
        strongResistance: 32500,
        riskLevel: "moderate"
      },
      sentimentMetrics: {
        overallScore: 7.8,
        twitterSentiment: 8.2,
        telegramSentiment: 7.9,
        fearGreedIndex: 65
      },
      keyInsights: [
        "Increasing institutional adoption with new ETF inflows",
        "Hash rate at all-time high, signaling strong network security",
        "Reduced exchange balances indicating accumulation"
      ],
      risks: [
        "Potential regulatory developments in major markets",
        "Short-term profit-taking after recent rally"
      ],
      prediction: {
        shortTerm: "Likely consolidation between $30,000-$35,000",
        mediumTerm: "Potential breakout above $40,000 within next quarter",
        confidence: 72
      },
      priceCorrelations: [
        { asset: "S&P 500", correlation: 0.68 },
        { asset: "Gold", correlation: 0.32 },
        { asset: "US Dollar", correlation: -0.45 },
        { asset: "Ethereum", correlation: 0.86 }
      ]
    },
    ethereum: {
      summary: "Ethereum continues to show strength following the successful Shanghai upgrade. Developer activity remains robust, and ETH staking rates have increased significantly. Social sentiment has improved, particularly around scaling solutions and reduced gas fees.",
      technicalAnalysis: {
        trend: "bullish",
        strongSupport: 1780,
        strongResistance: 2050,
        riskLevel: "moderate"
      },
      sentimentMetrics: {
        overallScore: 7.5,
        twitterSentiment: 7.9,
        telegramSentiment: 7.6,
        fearGreedIndex: 62
      },
      keyInsights: [
        "Growing DeFi and NFT ecosystem increasing utility",
        "Layer 2 adoption accelerating, reducing gas fees",
        "Institutional interest growing post-Shanghai upgrade"
      ],
      risks: [
        "Competition from alternative L1 blockchains",
        "Technical obstacles in scaling roadmap"
      ],
      prediction: {
        shortTerm: "Range-bound trading between $1,800-$2,100",
        mediumTerm: "Potential rise to $2,500+ following recovery",
        confidence: 68
      },
      priceCorrelations: [
        { asset: "Bitcoin", correlation: 0.86 },
        { asset: "S&P 500", correlation: 0.59 },
        { asset: "US Dollar", correlation: -0.38 },
        { asset: "DeFi Index", correlation: 0.78 }
      ]
    },
    binancecoin: {
      summary: "Binance Coin is maintaining stability despite regulatory concerns around its parent exchange. BNB burn mechanism continues to provide support while the BNB Chain ecosystem expands with new DeFi and NFT projects.",
      technicalAnalysis: {
        trend: "neutral",
        strongSupport: 220,
        strongResistance: 240,
        riskLevel: "high"
      },
      sentimentMetrics: {
        overallScore: 6.2,
        twitterSentiment: 6.5,
        telegramSentiment: 6.8,
        fearGreedIndex: 55
      },
      keyInsights: [
        "Regular token burns reducing supply",
        "Growing ecosystem of applications on BNB Chain",
        "Strong exchange reserves backing value"
      ],
      risks: [
        "Regulatory concerns surrounding Binance exchange",
        "Centralization criticism affecting sentiment",
        "Competition from other exchange tokens"
      ],
      prediction: {
        shortTerm: "Continued range between $220-$240",
        mediumTerm: "Potential growth to $280 if regulatory clarity improves",
        confidence: 65
      },
      priceCorrelations: [
        { asset: "Bitcoin", correlation: 0.72 },
        { asset: "Ethereum", correlation: 0.68 },
        { asset: "Exchange Token Index", correlation: 0.88 },
        { asset: "US Dollar", correlation: -0.42 }
      ]
    }
  };
  
  // Mock Sentiment Analysis Results
  export const mockSentimentData = {
    average_sentiment: 0.65,
    sentiment_distribution: {
      Positive: 62,
      Neutral: 25,
      Negative: 13
    },
    analysis_time: new Date().toISOString()
  };
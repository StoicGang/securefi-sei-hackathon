import os
import json
import time
import logging
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, TypedDict, Any, Union
import requests
from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from flask import Flask, request, jsonify
from flask_cors import CORS
from anthropic import Anthropic
from dotenv import load_dotenv
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
import random
from datetime import datetime, timedelta
from scrapper import TwitterScraper, SentimentAnalyzer as BaseSentimentAnalyzer

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:8000"}})
load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)
load_dotenv()

# Verify API keys are loaded
if not os.getenv("GEMINI_API_KEY"):
    logger.warning("GEMINI_API_KEY not found in environment variables")
if not os.getenv("CLAUDE_API_KEY"):
    logger.warning("CLAUDE_API_KEY not found in environment variables")

# Initialize Anthropic client for AI insights
anthropic = Anthropic(api_key=os.getenv("CLAUDE_API_KEY"))

# Add this class at the top of the file after imports
class SentimentAnalyzer:
    def __init__(self):
        self.cache = {}
        self.base_analyzer = BaseSentimentAnalyzer()
        self.twitter_scraper = TwitterScraper()
    
    def get_data(self, coin_filter=None, refresh=False):
        """Get sentiment analysis data with optional coin filter"""
        try:
            if refresh or not self.cache:
                # Generate random data for demonstration
                sentiment_data = {
                    'sentiment_distribution': {
                        'positive': random.randint(30, 60),
                        'neutral': random.randint(20, 40),
                        'negative': random.randint(10, 30),
                        'warning': random.randint(5, 15)
                    },
                    'topic_distribution': {
                        'price movement': random.randint(150, 200),
                        'regulations': random.randint(100, 150),
                        'adoption': random.randint(80, 120),
                        'technology': random.randint(70, 100),
                        'market analysis': random.randint(60, 90),
                        'security': random.randint(50, 80),
                    },
                    'coin_distribution': self._generate_coin_distribution(coin_filter),
                    'time_series_data': self._generate_time_series_data(),
                    'latest_insights': self._generate_insights(coin_filter)
                }
                self.cache = sentiment_data
            
            return self.cache
        except Exception as e:
            logger.error(f"Error getting data: {str(e)}")
            raise

    def _generate_coin_distribution(self, coin_filter=None):
        coins = {
            'bitcoin': random.randint(180, 250),
            'ethereum': random.randint(150, 200),
            'ripple': random.randint(80, 120),
            'cardano': random.randint(70, 100),
            'solana': random.randint(60, 90),
            'dogecoin': random.randint(50, 80),
        }
        if coin_filter:
            coins[coin_filter] = max(coins.values()) + random.randint(10, 30)
        return coins

    def _generate_time_series_data(self):
        data = []
        sentiments = ['positive', 'neutral', 'negative', 'warning']
        for i in range(5):  # Last 5 days
            date = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
            for sentiment in sentiments:
                data.append({
                    'date': date,
                    'sentiment': sentiment,
                    'count': random.randint(10, 50)
                })
        return data

    def _generate_insights(self, coin_filter=None):
        insights = []
        message_count = random.randint(15, 25)  # Generate more messages
        
        templates = [
            f"Breaking: {coin_filter.upper() if coin_filter else 'Crypto market'} showing strong bullish signals",
            f"Major partnership announced for {coin_filter.upper() if coin_filter else 'crypto project'}",
            f"Technical analysis suggests {coin_filter.upper() if coin_filter else 'market'} trend reversal",
            f"Institutional investors increasing {coin_filter.upper() if coin_filter else 'crypto'} holdings",
            f"New development milestone reached for {coin_filter.upper() if coin_filter else 'blockchain'}",
        ]
        
        for _ in range(message_count):
            insights.append({
                'message': random.choice(templates),
                'sentiment': random.choice(['positive', 'neutral', 'negative', 'warning']),
                'urgent': random.choice([True, False]),
                'source': random.choice(['twitter', 'telegram']),
                'channel': f"@{random.choice(['CryptoNews', 'MarketAlerts', 'TradingSignals'])}",
                'timestamp': (datetime.now() - timedelta(minutes=random.randint(1, 120))).isoformat(),
                'topics': random.sample(['technical analysis', 'price movement', 'adoption', 'development', 'partnership'], 2),
                'cryptocurrencies': [coin_filter] if coin_filter else ['bitcoin', 'ethereum', 'ripple']
            })
        
        return insights

# Initialize the analyzer
analyzer = SentimentAnalyzer()

# ---------- Data Structures ----------
class SocialMessage(TypedDict):
    source: str  # "twitter" or "telegram"
    message: str
    username: str
    timestamp: float
    sentiment_score: float
    sentiment_label: str
    url: Optional[str]
    followers: Optional[int]
    channel: Optional[str]  # For telegram

class TokenSentiment(TypedDict):
    token_symbol: str
    token_name: str
    overall_score: float
    overall_label: str
    twitter_score: float
    telegram_score: float
    sentiment_trend: str
    messages: List[SocialMessage]
    last_updated: float

class AIInsight(TypedDict):
    summary: str
    key_factors: List[Dict[str, str]]  # e.g. {"type": "bullish", "text": "Increasing institutional adoption"}
    risk_factors: List[Dict[str, str]]  # e.g. {"type": "bearish", "text": "Potential regulatory developments"}
    prediction: str

# ---------- Configuration ----------
DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)

SENTIMENT_THRESHOLDS = {
    "highly_positive": 0.6,
    "positive": 0.2,
    "neutral_lower": -0.2,
    "neutral_upper": 0.2,
    "negative": -0.2,
    "highly_negative": -0.6
}

CACHE_DURATION = 3600  # 1 hour cache for sentiment data

# ---------- Data Stores ----------
sentiment_cache: Dict[str, TokenSentiment] = {}
ai_insights_cache: Dict[str, AIInsight] = {}

# ---------- Core Functions ----------
def load_twitter_data(token_symbol: str) -> List[Dict]:
    """Load Twitter data from CSV/JSON files"""
    try:
        # Try loading from JSON first
        json_path = DATA_DIR / f"twitter_{token_symbol.lower()}.json"
        if (json_path.exists()):
            logger.info(f"Loading Twitter data from {json_path}")
            with open(json_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                logger.info(f"Loaded {len(data)} Twitter messages")
                return data
        
        # Fallback to CSV
        csv_path = DATA_DIR / f"twitter_{token_symbol.lower()}.csv"
        if (csv_path.exists()):
            logger.info(f"Loading Twitter data from {csv_path}")
            df = pd.read_csv(csv_path)
            data = df.to_dict("records")
            logger.info(f"Loaded {len(data)} Twitter messages")
            return data
        
        logger.warning(f"No Twitter data found for {token_symbol}")
        return []
    except Exception as e:
        logger.error(f"Error loading Twitter data: {str(e)}")
        return []

def load_telegram_data(token_symbol: str) -> List[Dict]:
    """Load Telegram data from CSV/JSON files"""
    try:
        # Try loading from JSON first
        json_path = DATA_DIR / f"telegram_{token_symbol.lower()}.json"
        if json_path.exists():
            with open(json_path, "r", encoding="utf-8") as f:
                return json.load(f)
        
        # Fallback to CSV
        csv_path = DATA_DIR / f"telegram_{token_symbol.lower()}.csv"
        if csv_path.exists():
            df = pd.read_csv(csv_path)
            return df.to_dict("records")
        
        return []
    except Exception as e:
        print(f"Error loading Telegram data: {e}")
        return []

def calculate_sentiment_score(text: str) -> float:
    """Calculate compound sentiment score using VADER and TextBlob"""
    try:
        # Use VADER for sentiment analysis (specialized for social media)
        analyzer = SentimentIntensityAnalyzer()
        vader_score = analyzer.polarity_scores(text)
        
        # Use TextBlob as secondary sentiment analyzer
        blob = TextBlob(text)
        textblob_score = blob.sentiment.polarity
        
        # Combined weighted score (VADER 70%, TextBlob 30%)
        combined_score = (vader_score['compound'] * 0.7) + (textblob_score * 0.3)
        
        # Ensure score is between -1 and 1
        return max(-1.0, min(1.0, combined_score))
    except Exception as e:
        print(f"Error calculating sentiment: {e}")
        return 0.0

def get_sentiment_label(score: float) -> str:
    """Convert sentiment score to label"""
    if score >= SENTIMENT_THRESHOLDS["highly_positive"]:
        return "Highly Positive"
    elif score >= SENTIMENT_THRESHOLDS["positive"]:
        return "Positive"
    elif score <= SENTIMENT_THRESHOLDS["highly_negative"]:
        return "Highly Negative"
    elif score <= SENTIMENT_THRESHOLDS["negative"]:
        return "Negative"
    else:
        return "Neutral"

def get_market_sentiment_label(score: float) -> str:
    """Convert sentiment score to market sentiment label"""
    # Adjust thresholds for more dynamic sentiment labels
    if score >= 7.5:
        return "Strongly Bullish"
    elif score >= 6.0:
        return "Bullish"
    elif score >= 5.0:
        return "Slightly Bullish"
    elif score >= 4.0:
        return "Neutral"
    elif score >= 3.0:
        return "Slightly Bearish"
    elif score >= 2.0:
        return "Bearish"
    else:
        return "Strongly Bearish"

def process_twitter_data(raw_data: List[Dict]) -> List[SocialMessage]:
    """Process Twitter data into standardized SocialMessage format"""
    messages = []
    
    for item in raw_data:
        # Extract needed fields (accommodate different possible field names)
        text = item.get("text", item.get("tweet", item.get("content", "")))
        username = item.get("username", item.get("user", item.get("screen_name", "")))
        
        # Try different timestamp formats
        timestamp = None
        for key in ["timestamp", "created_at", "date"]:
            if key in item:
                try:
                    if isinstance(item[key], (int, float)):
                        timestamp = float(item[key])
                        break
                    else:
                        # Try parsing date strings
                        dt = pd.to_datetime(item[key])
                        timestamp = dt.timestamp()
                        break
                except:
                    pass
        
        if timestamp is None:
            timestamp = time.time()  # Use current time as fallback
        
        # Calculate sentiment
        sentiment_score = calculate_sentiment_score(text)
        
        messages.append({
            "source": "twitter",
            "message": text,
            "username": username,
            "timestamp": timestamp,
            "sentiment_score": sentiment_score,
            "sentiment_label": get_sentiment_label(sentiment_score),
            "url": item.get("url", ""),
            "followers": item.get("followers", 0),
            "channel": None
        })
    
    # Sort by timestamp (most recent first)
    messages.sort(key=lambda x: x["timestamp"], reverse=True)
    return messages

def process_telegram_data(raw_data: List[Dict]) -> List[SocialMessage]:
    """Process Telegram data into standardized SocialMessage format"""
    messages = []
    
    for item in raw_data:
        # Extract needed fields
        text = item.get("message", item.get("text", item.get("content", "")))
        username = item.get("username", item.get("user", item.get("sender", "")))
        channel = item.get("channel", item.get("group", item.get("chat", "")))
        
        # Try different timestamp formats
        timestamp = None
        for key in ["timestamp", "date", "time"]:
            if key in item:
                try:
                    if isinstance(item[key], (int, float)):
                        timestamp = float(item[key])
                        break
                    else:
                        # Try parsing date strings
                        dt = pd.to_datetime(item[key])
                        timestamp = dt.timestamp()
                        break
                except:
                    pass
        
        if timestamp is None:
            timestamp = time.time()  # Use current time as fallback
        
        # Calculate sentiment
        sentiment_score = calculate_sentiment_score(text)
        
        messages.append({
            "source": "telegram",
            "message": text,
            "username": username,
            "timestamp": timestamp,
            "sentiment_score": sentiment_score,
            "sentiment_label": get_sentiment_label(sentiment_score),
            "url": None,
            "followers": None,
            "channel": channel
        })
    
    # Sort by timestamp (most recent first)
    messages.sort(key=lambda x: x["timestamp"], reverse=True)
    return messages

def analyze_token_sentiment(token_symbol: str, token_name: str = None) -> TokenSentiment:
    """Analyze sentiment for a specific token"""
    logger.info(f"Analyzing sentiment for {token_symbol}")
    
    try:
        # Load data from files
        twitter_raw = load_twitter_data(token_symbol)
        telegram_raw = load_telegram_data(token_symbol)
        
        logger.info(f"Loaded {len(twitter_raw)} Twitter and {len(telegram_raw)} Telegram messages")
        
        # Process data
        twitter_messages = process_twitter_data(twitter_raw)
        telegram_messages = process_telegram_data(telegram_raw)
        
        # Calculate sentiment scores with validation
        twitter_scores = [msg["sentiment_score"] for msg in twitter_messages if msg["sentiment_score"] != 0]
        telegram_scores = [msg["sentiment_score"] for msg in telegram_messages if msg["sentiment_score"] != 0]
        
        # Calculate average scores with error handling
        twitter_score = sum(twitter_scores) / len(twitter_scores) if twitter_scores else 0
        telegram_score = sum(telegram_scores) / len(telegram_scores) if telegram_scores else 0
        
        # Weight calculation
        total_messages = len(twitter_messages) + len(telegram_messages)
        tw_weight = len(twitter_messages) / total_messages if total_messages > 0 else 0.5
        tg_weight = len(telegram_messages) / total_messages if total_messages > 0 else 0.5
        
        # Overall score calculation
        overall_score = (twitter_score * tw_weight) + (telegram_score * tg_weight)
        
        # Create result with meaningful default values
        result = {
            "token_symbol": token_symbol,
            "token_name": token_name or token_symbol,
            "overall_score": max(0.1, overall_score * 10),  # Scale to 1-10
            "overall_label": get_market_sentiment_label(overall_score),
            "twitter_score": max(0.1, twitter_score * 10),
            "telegram_score": max(0.1, telegram_score * 10),
            "sentiment_trend": "Stable",
            "messages": twitter_messages + telegram_messages,
            "last_updated": time.time()
        }
        
        return result
        
    except Exception as e:
        logger.error(f"Error analyzing sentiment: {str(e)}")
        return {
            "token_symbol": token_symbol,
            "token_name": token_name or token_symbol,
            "overall_score": 5.0,  # Neutral default
            "overall_label": "Neutral",
            "twitter_score": 5.0,
            "telegram_score": 5.0,
            "sentiment_trend": "Stable",
            "messages": [],
            "last_updated": time.time()
        }

def generate_ai_insights(token_symbol: str, sentiment_data: TokenSentiment, price_data: Optional[Dict] = None) -> AIInsight:
    try:
        # Check if Gemini API key is available
        gemini_key = os.getenv("GEMINI_API_KEY")
        if not gemini_key:
            print("Warning: GEMINI_API_KEY not found in environment variables")
            return {
                "summary": "AI insights unavailable - Gemini API key not configured",
                "key_factors": [{"type": "error", "text": "API key missing"}],
                "risk_factors": [{"type": "error", "text": "API key missing"}],
                "prediction": "Unavailable - API key not configured"
            }

        # Configure Gemini AI
        genai.configure(api_key=gemini_key)
        
        # Check cache first
        cache_key = token_symbol.lower()
        current_time = time.time()
        
        if cache_key in ai_insights_cache:
            cached_insight = ai_insights_cache[cache_key]
            cache_age = current_time - sentiment_data["last_updated"]
            
            if cache_age < CACHE_DURATION:
                return cached_insight
        
        # Prepare data for AI analysis
        recent_messages = sentiment_data["messages"][:10]  # Top 10 recent messages
        
        message_texts = [
            f"{msg['source'].capitalize()}: '{msg['message']}' ({msg['sentiment_label']})"
            for msg in recent_messages
        ]
        
        data = {
            "token": {
                "symbol": token_symbol,
                "name": sentiment_data["token_name"],
                "sentiment_score": sentiment_data["overall_score"],
                "sentiment_label": sentiment_data["overall_label"],
                "sentiment_trend": sentiment_data["sentiment_trend"]
            },
            "social_data": {
                "twitter_score": sentiment_data["twitter_score"],
                "telegram_score": sentiment_data["telegram_score"],
                "recent_messages": message_texts
            }
        }
        
        if price_data:
            data["price_data"] = price_data
        
        # Create prompt for Gemini
        prompt = f"""
        You are Gemini AI, a crypto market analysis assistant.
        
        Analyze the following sentiment data for {token_symbol.upper()}:
        - Overall sentiment score: {sentiment_data['overall_score']:.1f}/10
        - Sentiment label: {sentiment_data['overall_label']}
        - Sentiment trend: {sentiment_data['sentiment_trend']}
        - Twitter sentiment score: {sentiment_data['twitter_score']:.1f}/10
        - Telegram sentiment score: {sentiment_data['telegram_score']:.1f}/10
        
        Recent messages:
        {chr(10).join(message_texts[:5])}
        
        Based on this data, provide:
        1. A concise summary of sentiment analysis (2-3 sentences max)
        2. 3-4 key bullish factors supported by the data
        3. 2-3 risk factors or bearish signals to be aware of
        4. A balanced market outlook sentence
        
        Format your response as JSON with fields: summary, key_factors, risk_factors, prediction.
        For key_factors and risk_factors, each item should have "type" (bullish/bearish) and "text" fields.
        Keep responses concise and specific to the social sentiment data provided.
        Whenever any new user come on and enter any coin detail, then you always have to give the different bullet points of the Sentiment Analysis Crypto coins.
        """
        
        # Set safety settings
        safety_settings = {
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
        }
        
        # Call Gemini API
        model = genai.GenerativeModel(
            model_name="gemini-1.5-pro",
            generation_config={"temperature": 0.2, "max_output_tokens": 500},
            safety_settings=safety_settings
        )
        
        response = model.generate_content(prompt)
        ai_text = response.text
        
        # Extract JSON content
        try:
            # Try to parse the direct response
            insights = json.loads(ai_text)
        except:
            # Try to extract JSON if surrounded by markdown code blocks
            import re
            json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', ai_text)
            if json_match:
                try:
                    insights = json.loads(json_match.group(1))
                except:
                    # Fallback to structured format
                    insights = {
                        "summary": "Unable to parse AI insights correctly",
                        "key_factors": [],
                        "risk_factors": [],
                        "prediction": ""
                    }
            else:
                # Emergency fallback: create structured response from text
                insights = {
                    "summary": "AI insights processing needed manual parsing",
                    "key_factors": [{"type": "bullish", "text": "Data extraction issue"}],
                    "risk_factors": [{"type": "bearish", "text": "Unable to properly analyze data"}],
                    "prediction": "Please refresh to try again"
                }
        
        # Add randomization to make responses more dynamic
        current_time = datetime.now()
        random.seed(f"{token_symbol}_{current_time.strftime('%Y%m%d%H%M')}")
        
        # Create dynamic templates based on sentiment scores
        sentiment_templates = {
            "positive": [
                f"Strong bullish sentiment detected for {token_symbol.upper()} with increasing social engagement",
                f"Market participants showing high confidence in {token_symbol.upper()}'s current trajectory",
                f"Positive momentum building for {token_symbol.upper()} across social channels"
            ],
            "negative": [
                f"Cautious sentiment prevailing for {token_symbol.upper()} with mixed signals",
                f"Market participants expressing concerns about {token_symbol.upper()}'s short-term outlook",
                f"Bearish signals detected for {token_symbol.upper()} in social discussions"
            ],
            "neutral": [
                f"Mixed sentiment observed for {token_symbol.upper()} with balanced discussions",
                f"Market participants showing neutral stance on {token_symbol.upper()}'s direction",
                f"Consolidating sentiment patterns for {token_symbol.upper()} across platforms"
            ]
        }
        
        # Select summary based on overall sentiment
        sentiment_category = "neutral"
        if sentiment_data["overall_score"] > 6:
            sentiment_category = "positive"
        elif sentiment_data["overall_score"] < 4:
            sentiment_category = "negative"
            
        summary = random.choice(sentiment_templates[sentiment_category])
        
        # Generate dynamic key factors and risk factors
        # ... rest of the function remains the same ...
        
        # Update cache
        ai_insights_cache[cache_key] = insights
        
        return insights
    
    except Exception as e:
        print(f"AI insight generation error: {str(e)}")
        return {
            "summary": f"Error generating AI insights: {str(e)}",
            "key_factors": [{"type": "error", "text": f"Error: {str(e)}"}],
            "risk_factors": [{"type": "error", "text": "Service temporarily unavailable"}],
            "prediction": "Error occurred during analysis"
        }

def get_technical_trend(token_symbol: str) -> Dict:
    """Get technical analysis trend data"""
    # This would normally call your price data API or service
    # For now, we'll return mock data
    mock_trends = {
        "bitcoin": {
            "trend": "Bullish",
            "support": 29800,
            "resistance": 32400
        },
        "ethereum": {
            "trend": "Neutral",
            "support": 1850,
            "resistance": 2100
        },
        "solana": {
            "trend": "Bullish",
            "support": 115,
            "resistance": 135
        }
    }
    
    return mock_trends.get(token_symbol.lower(), {
        "trend": "Neutral",
        "support": 0,
        "resistance": 0
    })

def get_risk_level(token_symbol: str, sentiment_data: TokenSentiment) -> Dict:
    """Calculate risk level based on sentiment and volatility"""
    overall_score = sentiment_data["overall_score"]
    
    # Mock risk calculation - would typically use more sophisticated metrics
    risk_level = "Low"
    risk_details = "Stable price action with consistent sentiment"
    
    if overall_score < 4:
        risk_level = "High"
        risk_details = "Negative sentiment indicating potential downside"
    elif overall_score < 6:
        risk_level = "Moderate"
        risk_details = "Mixed sentiment signals with some volatility expected"
    
    return {
        "level": risk_level,
        "details": risk_details
    }

def generate_coin_specific_topics(coin: str) -> Dict[str, int]:
    """Generate coin-specific topic distribution"""
    topics = {
        'bitcoin': {
            'Mining & Hash Rate': random.randint(200, 400),
            'Institutional Adoption': random.randint(150, 300),
            'Regulatory News': random.randint(100, 200),
            'Market Dominance': random.randint(80, 150),
            'Lightning Network': random.randint(50, 100)
        },
        'ethereum': {
            'Gas Fees': random.randint(200, 400),
            'DeFi Projects': random.randint(150, 300),
            'ETH 2.0 Updates': random.randint(100, 200),
            'Smart Contracts': random.randint(80, 150),
            'Layer 2 Solutions': random.randint(50, 100)
        },
        'cardano': {
            'Smart Contracts': random.randint(200, 400),
            'Hydra Updates': random.randint(150, 300),
            'Africa Projects': random.randint(100, 200),
            'Staking': random.randint(80, 150),
            'Governance': random.randint(50, 100)
        }
        # Add more coin-specific topics as needed
    }
    
    # Default topics for coins not in the mapping
    default_topics = {
        'Price Movement': random.randint(200, 400),
        'Development': random.randint(150, 300),
        'Partnerships': random.randint(100, 200),
        'Community Growth': random.randint(80, 150),
        'Exchange Listings': random.randint(50, 100)
    }
    
    return topics.get(coin.lower(), default_topics)

def generate_time_series_data(coin: str) -> List[Dict]:
    """Generate coin-specific time series data"""
    data = []
    base_volumes = {
        'bitcoin': {'base': 1000, 'variance': 500},
        'ethereum': {'base': 800, 'variance': 400},
        'cardano': {'base': 500, 'variance': 250},
        'default': {'base': 300, 'variance': 150}
    }
    
    volume_config = base_volumes.get(coin.lower(), base_volumes['default'])
    base_volume = volume_config['base']
    variance = volume_config['variance']
    
    # Generate last 7 days of data
    for i in range(7):
        date = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
        
        # Generate different volumes for each sentiment
        for sentiment in ['positive', 'neutral', 'negative', 'warning']:
            # Add some randomization but keep trends consistent
            volume = max(0, base_volume + random.randint(-variance, variance))
            
            # Adjust volume based on sentiment and coin performance
            if sentiment == 'positive':
                volume *= 1.2  # Increase positive sentiment volume
            elif sentiment == 'negative':
                volume *= 0.8  # Decrease negative sentiment volume
            
            data.append({
                'date': date,
                'sentiment': sentiment,
                'count': int(volume)
            })
    
    return data

def generate_sentiment_distribution(coin: str) -> Dict[str, int]:
    """Generate sentiment distribution for a specific coin"""
    # Use coin name and timestamp for consistent but changing seed
    seed = f"{coin}_{datetime.now().strftime('%Y%m%d%H%M')}"
    random.seed(seed)
    
    # Base distribution ranges based on coin performance
    base_ranges = {
        'bitcoin': {'positive': (40, 60), 'neutral': (20, 30), 'negative': (10, 20), 'warning': (5, 10)},
        'ethereum': {'positive': (35, 55), 'neutral': (25, 35), 'negative': (15, 25), 'warning': (5, 15)},
        'default': {'positive': (30, 50), 'neutral': (20, 40), 'negative': (15, 30), 'warning': (5, 15)}
    }
    
    # Get ranges for the specific coin or use default
    ranges = base_ranges.get(coin.lower(), base_ranges['default'])
    
    # Generate distribution
    distribution = {
        'positive': random.randint(*ranges['positive']),
        'neutral': random.randint(*ranges['neutral']),
        'negative': random.randint(*ranges['negative']),
        'warning': random.randint(*ranges['warning'])
    }
    
    # Reset random seed
    random.seed()
    
    return distribution

# Update the analyze_coin function to use coin-specific topics
@app.route('/api/analyze', methods=['GET'])
def analyze_coin():
    """Analyze specific coin"""
    coin = request.args.get('coin')
    if not coin:
        return jsonify({"error": "Coin parameter is required"}), 400
    
    try:
        # Use coin name and timestamp for consistent but changing seed
        seed = f"{coin}_{datetime.now().strftime('%Y%m%d%H%M')}"
        random.seed(seed)
        
        # Generate sentiment score with more variation
        sentiment_score = round(random.uniform(2.0, 9.0), 2)
        sentiment_label = get_market_sentiment_label(sentiment_score)
        
        # Generate dynamic sentiment distribution based on overall sentiment
        if sentiment_score >= 6.0:
            sentiment_distribution = {
                'positive': random.randint(50, 70),
                'neutral': random.randint(15, 30),
                'negative': random.randint(5, 15),
                'warning': random.randint(1, 5)
            }
        elif sentiment_score <= 4.0:
            sentiment_distribution = {
                'positive': random.randint(10, 25),
                'neutral': random.randint(20, 35),
                'negative': random.randint(30, 50),
                'warning': random.randint(5, 15)
            }
        else:
            sentiment_distribution = {
                'positive': random.randint(30, 40),
                'neutral': random.randint(35, 45),
                'negative': random.randint(15, 25),
                'warning': random.randint(3, 8)
            }

        analysis = {
            'sentiment_score': sentiment_score,
            'sentiment_label': sentiment_label,
            'total_mentions': random.randint(5000, 15000),
            'momentum': random.randint(-20, 50),
            'sentiment_distribution': sentiment_distribution,
            'topics': generate_coin_specific_topics(coin),
            'latest_news': generate_mock_news(coin)
        }
        
        # Reset random seed
        random.seed()
        
        return jsonify(analysis)
        
    except Exception as e:
        logger.error(f"Error analyzing coin: {str(e)}")
        return jsonify({"error": str(e)}), 500

def generate_mock_news(coin):
    """Generate mock news data for a coin"""
    news_templates = [
        f"Breaking: {coin.upper()} reaches new all-time high",
        f"Major partnership announced for {coin.upper()}",
        f"Analysts predict bright future for {coin.upper()}",
        f"New development milestone reached for {coin.upper()}"
    ]
    
    return [
        {
            'message': random.choice(news_templates),
            'sentiment': random.choice(['positive', 'neutral', 'negative', 'warning']),
            'source': random.choice(['twitter', 'telegram']),
            'channel': f"@{coin}Updates",
            'timestamp': (datetime.now() - timedelta(hours=random.randint(1, 24))).isoformat(),
            'topics': random.sample(['price', 'technology', 'partnership', 'development'], 2)
        } for _ in range(5)
    ]

# ---------- API Routes ----------
@app.route('/api/sentiment', methods=['GET'])  # Add /api prefix
def get_sentiment():
    """Get sentiment analysis for a token"""
    token_symbol = request.args.get('token')
    if not token_symbol:
        return jsonify({"error": "Token symbol is required"}), 400
    
    # Get token name if provided
    token_name = request.args.get('name', token_symbol)
    
    # Analyze sentiment
    sentiment_data = analyze_token_sentiment(token_symbol, token_name)
    
    # Get technical trend
    technical_trend = get_technical_trend(token_symbol)
    
    # Get risk level
    risk_level = get_risk_level(token_symbol, sentiment_data)
    
    # Generate AI insights
    ai_insights = generate_ai_insights(token_symbol, sentiment_data)
    
    # Format response for the frontend
    response = {
        "overview": {
            "token_symbol": sentiment_data["token_symbol"],
            "token_name": sentiment_data["token_name"],
            "overall_sentiment": {
                "score": round(sentiment_data["overall_score"], 1),
                "label": sentiment_data["overall_label"]
            },
            "risk_level": {
                "level": risk_level["level"],
                "details": risk_level["details"]
            },
            "technical_trend": technical_trend
        },
        "social_analysis": {
            "twitter": {
                "score": round(sentiment_data["twitter_score"], 1),
                "messages": [m for m in sentiment_data["messages"] if m["source"] == "twitter"][:20]
            },
            "telegram": {
                "score": round(sentiment_data["telegram_score"], 1),
                "messages": [m for m in sentiment_data["messages"] if m["source"] == "telegram"][:20]
            }
        },
        "ai_insights": ai_insights,
        "meta": {
            "last_updated": datetime.fromtimestamp(sentiment_data["last_updated"]).isoformat()
        }
    }
    
    return jsonify(response)

@app.route('/api/refresh_data', methods=['POST'])
def refresh_data():
    """Force refresh of sentiment data"""
    try:
        data = request.get_json()
        coin = data.get('token') if data else None
        
        # Clear all caches
        sentiment_cache.clear()
        ai_insights_cache.clear()
        
        # Use current timestamp as seed for new random data
        random.seed(str(datetime.now()))
        
        # Generate fresh data
        if coin:
            # Generate coin-specific data
            twitter_data = analyzer.twitter_scraper.generate_mock_data(coin, count=50)
            sentiment_data = analyze_token_sentiment(coin)
        
        return jsonify({
            "success": True,
            "message": f"Data refreshed successfully for {coin if coin else 'all coins'}",
            "last_updated": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error refreshing data: {str(e)}")
        return jsonify({
            "error": "Failed to refresh data",
            "message": str(e)
        }), 500

@app.route('/api/coins', methods=['GET'])
def get_supported_tokens():
    """Get list of tokens with available data"""
    try:
        tokens = [
            "bitcoin", "ethereum", "ripple", "cardano", "solana", 
            "dogecoin", "polkadot", "litecoin", "chainlink", 
            "avalanche", "cosmos", "monero", "algorand", "tezos"
        ]
        
        # Add any additional tokens from data directory
        if DATA_DIR.exists():
            for file in DATA_DIR.glob("twitter_*.json"):
                token = file.stem.replace("twitter_", "")
                if token not in tokens:
                    tokens.append(token)
        
        return jsonify(sorted(tokens))
    except Exception as e:
        logger.error(f"Error getting supported tokens: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/health', methods=['GET'])  # Add /api prefix
def health_check():
    """Simple health check endpoint"""
    return jsonify({
        "status": "ok",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/data', methods=['GET'])
def get_data():
    coin_filter = request.args.get('coin')
    refresh = request.args.get('refresh', 'false').lower() == 'true'
    
    try:
        if not coin_filter:
            return jsonify({
                'error': 'Please select a coin to view data'
            }), 400
            
        # Use timestamp as part of random seed for variation
        seed = f"{coin_filter}_{datetime.now().strftime('%Y%m%d%H%M')}"
        random.seed(seed)
            
        data = {
            'sentiment_distribution': generate_sentiment_distribution(coin_filter),
            'topic_distribution': generate_coin_specific_topics(coin_filter),
            'time_series_data': generate_time_series_data(coin_filter),
            'latest_insights': generate_mock_news(coin_filter)
        }
        
        # Reset random seed
        random.seed()
        
        return jsonify(data)
    except Exception as e:
        logger.error(f"Error in /api/data: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ---------- Main ----------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
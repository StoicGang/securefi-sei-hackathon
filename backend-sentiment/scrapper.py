import pandas as pd
import numpy as np
import re
import json
import os
import time
import logging
from datetime import datetime, timedelta
import collections
import traceback
import random
from typing import Dict, List, Any, Optional, Union

# Flask imports
from flask import Flask, render_template, request, jsonify, Response
from flask_cors import CORS

# NLP imports
import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("crypto_scraper")

# Download NLTK resources if needed
try:
    nltk.data.find('vader_lexicon')
except LookupError:
    nltk.download('vader_lexicon')

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Constants
URGENCY_KEYWORDS = ['breaking', 'urgent', 'alert', 'warning', 'scam', 'hack', 'exploit', 'security']

TOPIC_CATEGORIES = {
    'Price Movement': ['price', 'ath', 'buy', 'sell', 'pump', 'dump', 'bull', 'bear', 'value', 'surge', 'drop'],
    'Partnerships': ['partnership', 'collaboration', 'announce', 'announcement', 'agreement', 'release', 'upgrade'],
    'Regulation': ['regulation', 'compliance', 'law', 'legal', 'government', 'ban', 'policy', 'governance', 'vote', 'proposal'],
    'Technology': ['protocol', 'token', 'blockchain', 'apy', 'apr', 'yield', 'pool', 'lp', 'liquidity', 'smart contract'],
    'Security': ['security', 'scam', 'hack', 'bug', 'vulnerability', 'warning', 'alert', 'whale', 'exploit'],
    'New Listing': ['listing', 'listed', 'exchange', 'trading', 'pair', 'market'],
    'Development': ['update', 'roadmap', 'milestone', 'alpha', 'beta', 'testnet', 'mainnet', 'release']
}

# Supported cryptocurrencies and their tickers
CRYPTO_MAPPING = {
    'bitcoin': ['btc'],
    'ethereum': ['eth'],
    'binancecoin': ['bnb'],
    'ripple': ['xrp'],
    'cardano': ['ada'],
    'solana': ['sol'],
    'dogecoin': ['doge'],
    'polkadot': ['dot'],
    'litecoin': ['ltc'],
    'chainlink': ['link'],
    'bitcoincash': ['bch'],
    'stellar': ['xlm'],
    'uniswap': ['uni'],
    'avalanche': ['avax'],
    'cosmos': ['atom'],
    'monero': ['xmr'],
    'algorand': ['algo'],
    'tezos': ['xtz'],
    'tron': ['trx'],
    'toncoin': ['ton'],
    'shibainu': ['shib'],
    'nearprotocol': ['near'],
    'orchest': ['orc'],
    'yeye': ['yey'],
    'hoodgold': ['hg'],
    'swasticoin': ['swc'],
    'ron': ['ron'],
    'jupyter': ['jup'],
    'tokenofficialtrump': ['tot'],
    'jito': ['jto'],
    'grass': ['grs']
}

# Create reverse mapping from ticker to name
TICKER_TO_CRYPTO = {}
for name, tickers in CRYPTO_MAPPING.items():
    for ticker in tickers:
        TICKER_TO_CRYPTO[ticker] = name

class SentimentAnalyzer:
    """Enhanced sentiment analyzer with crypto-specific terms"""
    
    def __init__(self):
        self.sia = SentimentIntensityAnalyzer()
        # Add crypto-specific terms to the lexicon
        self.sia.lexicon.update({
            'bullrun': 3.0, 'ATH': 2.5, 'long': 2.0, 'breakout': 2.5,
            'dip': -1.5, 'crash': -3.0, 'short': -2.0, 'delist': -3.0,
            'whale alert': -2.5, 'FOMO': 1.5, 'pump': 2.0, 'dump': -2.5,
            'hard fork': 1.0, 'mainnet launch': 2.0, 'burn': 1.5,
            'halving': 2.0, 'airdrop': 1.5, 'CEX listing': 2.5,
            'support': 1.5, 'resistance': -0.5, 'consolidation': 0.2,
            'scalability': 1.0, 'adoption': 2.0, 'utility': 1.5,
            'fud': -2.0, 'rugpull': -3.5, 'scam': -3.0, 'moon': 2.5,
            'bullish': 2.5, 'bearish': -2.5, 'going up': 1.8, 'going down': -1.8
        })
    
    def analyze(self, text: str) -> Dict[str, float]:
        """Analyze sentiment of text"""
        if not text or not isinstance(text, str):
            return {'compound': 0, 'pos': 0, 'neg': 0, 'neu': 1.0}
        return self.sia.polarity_scores(text)
    
    def get_sentiment_label(self, score: float) -> str:
        """Convert sentiment score to label"""
        if score > 0.2:
            return 'positive'
        if score < -0.2:
            return 'negative'
        if score < -0.5:
            return 'warning'  # Very negative sentiment
        return 'neutral'

class TextProcessor:
    """Process and clean text data"""
    
    @staticmethod
    def clean_text(text: str) -> str:
        """Remove URLs, mentions, special chars"""
        if not isinstance(text, str):
            return ""
        # Remove URLs, mentions, and special characters
        text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
        text = re.sub(r'@\w+', '', text)
        text = re.sub(r'[^\w\s]', '', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text
    
    @staticmethod
    def extract_mentions(text: str) -> List[str]:
        """Extract mentions from text"""
        if not isinstance(text, str):
            return []
        mentions = re.findall(r'@(\w+)', text)
        return mentions
    
    @staticmethod
    def extract_hashtags(text: str) -> List[str]:
        """Extract hashtags from text"""
        if not isinstance(text, str):
            return []
        hashtags = re.findall(r'#(\w+)', text)
        return hashtags
    
    @staticmethod
    def identify_cryptocurrencies(text: str) -> List[str]:
        """Identify cryptocurrencies mentioned in text"""
        if not isinstance(text, str):
            return []
        
        text_lower = text.lower()
        found_cryptos = []
        
        # Check for crypto names
        for crypto_name, tickers in CRYPTO_MAPPING.items():
            if crypto_name in text_lower:
                found_cryptos.append(crypto_name)
                continue
            
            # Check for tickers
            for ticker in tickers:
                # Look for the ticker with word boundaries to avoid false positives
                if re.search(r'\b' + ticker + r'\b', text_lower):
                    found_cryptos.append(crypto_name)
                    break
        
        return list(set(found_cryptos))  # Remove duplicates

class DataSource:
    """Base class for different data sources"""
    
    def __init__(self):
        self.sentiment_analyzer = SentimentAnalyzer()
        self.text_processor = TextProcessor()
    
    def process_message(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Process a single message from any source"""
        # Extract text content
        text = message.get('text', message.get('content', message.get('message_text', '')))
        clean_text = self.text_processor.clean_text(text)
        
        # Analyze sentiment
        sentiment_scores = self.sentiment_analyzer.analyze(clean_text)
        sentiment_label = self.sentiment_analyzer.get_sentiment_label(sentiment_scores['compound'])
        
        # Extract metadata
        cryptocurrencies = self.text_processor.identify_cryptocurrencies(text)
        hashtags = self.text_processor.extract_hashtags(text)
        mentions = self.text_processor.extract_mentions(text)
        
        # Categorize topics
        topics = self.categorize_message(clean_text)
        
        # Check urgency
        is_urgent = self.check_urgency(clean_text, sentiment_label)
        
        # Standardize timestamp
        timestamp = message.get('timestamp', message.get('date', datetime.now().isoformat()))
        if isinstance(timestamp, str):
            try:
                timestamp = datetime.fromisoformat(timestamp)
            except (ValueError, TypeError):
                timestamp = datetime.now()
        
        # Create standardized message format
        processed_message = {
            'source': message.get('source', 'unknown'),
            'source_id': message.get('id', message.get('message_id', str(hash(str(text) + str(timestamp))))),
            'timestamp': timestamp.isoformat() if isinstance(timestamp, datetime) else timestamp,
            'text': text,
            'clean_text': clean_text,
            'sender': message.get('sender', message.get('sender_username', message.get('author', 'unknown'))),
            'channel': message.get('channel', message.get('channel_name', message.get('forum', 'unknown'))),
            'sentiment': sentiment_label,
            'sentiment_scores': sentiment_scores,
            'cryptocurrencies': cryptocurrencies,
            'topics': topics,
            'urgent': is_urgent,
            'hashtags': hashtags,
            'mentions': mentions
        }
        
        return processed_message
    
    def categorize_message(self, text: str) -> List[str]:
        """Categorize message into topics"""
        if not text:
            return []
            
        text_lower = text.lower()
        detected_topics = []
        
        for category, keywords in TOPIC_CATEGORIES.items():
            for keyword in keywords:
                if keyword in text_lower:
                    detected_topics.append(category)
                    break
        
        return list(set(detected_topics))  # Remove duplicates
    
    def check_urgency(self, text: str, sentiment: str) -> bool:
        """Check for urgency in message"""
        if not text:
            return False
            
        text_lower = text.lower()
        
        # Check for urgency keywords
        for keyword in URGENCY_KEYWORDS:
            if keyword in text_lower:
                return True
        
        # Also consider strongly negative sentiment as urgent
        if sentiment == 'warning' or (isinstance(sentiment, str) and 'negative' in sentiment.lower()):
            return True
        
        return False

class TelegramScraper(DataSource):
    """Scraper for Telegram data"""
    
    def __init__(self, api_key=None):
        super().__init__()
        self.api_key = api_key
        # In a real implementation, you would initialize the Telegram client
        # For now, we'll simulate by loading data from CSV
    
    def load_data(self, filepath: str = 'defi_telegram_data.csv') -> pd.DataFrame:
        """Load data from CSV file"""
        try:
            df = pd.read_csv(filepath)
            # Convert timestamp to datetime format if it exists
            if 'timestamp' in df.columns:
                df['timestamp'] = pd.to_datetime(df['timestamp'])
            return df
        except Exception as e:
            logger.error(f"Error loading Telegram data: {str(e)}")
            return pd.DataFrame()
    
    def process_data(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Process all messages in dataframe"""
        processed_messages = []
        
        for _, row in df.iterrows():
            # Convert row to dict
            message = row.to_dict()
            message['source'] = 'telegram'
            
            # Process message
            processed_message = self.process_message(message)
            processed_messages.append(processed_message)
        
        return processed_messages

class TwitterScraper(DataSource):
    """Scraper for Twitter data using free methods"""
    
    def __init__(self):
        super().__init__()
    
    def generate_mock_data(self, coin: str, count: int = 50) -> List[Dict[str, Any]]:
        """Generate mock Twitter data for testing"""
        templates = [
            f"Breaking: {{coin}} {random.choice(['partnership', 'hack', 'listing'])} news!",
            f"{{coin}} price {random.choice(['surges', 'drops'])} {random.randint(5, 95)}%",
            f"Major development in {{coin}} ecosystem",
            f"{{coin}} {random.choice(['wallet', 'exchange', 'network'])} update",
            f"Regulatory news affecting {{coin}}",
            f"Just bought more {{coin}}! {random.choice(['To the moon!', 'Long term hold.', 'DCA strategy working well.'])}",
            f"{{coin}} {random.choice(['bullish pattern', 'bearish divergence'])} on the 4h chart",
            f"New {{coin}} {random.choice(['airdrop', 'staking rewards', 'farming opportunity'])} available!",
            f"{{coin}} team announces {random.choice(['new roadmap', 'token burn', 'major partnership'])}",
            f"Is {{coin}} the next {random.choice(['Bitcoin', 'Ethereum', '100x gem'])}?"
        ]
        
        # Additional attributes for realism
        engagement_ranges = {
            'likes': (0, 5000),
            'retweets': (0, 2000),
            'replies': (0, 500),
            'followers': (50, 1000000)
        }
        
        # Generate variation of timestamps within the last 48 hours
        mock_tweets = []
        for _ in range(count):
            template = random.choice(templates)
            content = template.format(coin=coin)
            
            # Generate random timestamp within the last 48 hours
            hours_ago = random.uniform(0, 48)
            timestamp = datetime.now() - timedelta(hours=hours_ago)
            
            # Add tweet with engagement metrics
            tweet = {
                'source': 'twitter',
                'content': content,
                'text': content,  # For compatibility with processor
                'date': timestamp.isoformat(),
                'likes': random.randint(*engagement_ranges['likes']),
                'retweets': random.randint(*engagement_ranges['retweets']),
                'replies': random.randint(*engagement_ranges['replies']),
                'author': f"crypto_user{random.randint(1, 9999)}",
                'author_followers': random.randint(*engagement_ranges['followers']),
                'hashtags': [f"#{random.choice(['crypto', 'defi', 'altcoin', coin.lower()])}" for _ in range(random.randint(0, 3))]
            }
            mock_tweets.append(tweet)
        
        return mock_tweets
    
    def analyze_tweets(self, coin: str, tweets: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Analyze tweets for a specific coin"""
        processed_tweets = []
        
        for tweet in tweets:
            tweet['source'] = 'twitter'
            processed_tweet = self.process_message(tweet)
            processed_tweets.append(processed_tweet)
        
        return processed_tweets

class CryptoAnalyzer:
    """Main analyzer class that combines data from different sources"""
    
    def __init__(self):
        self.telegram_scraper = TelegramScraper()
        self.twitter_scraper = TwitterScraper()
        self.data_cache = {}
        self.cache_expiry = {}
        self.CACHE_DURATION = 600  # 10 minutes in seconds
    
    def get_data(self, coin: Optional[str] = None, force_refresh: bool = False) -> Dict[str, Any]:
        """Get combined data from all sources"""
        cache_key = f"data_{coin}" if coin else "data_all"
        
        # Check cache first unless force refresh is requested
        if not force_refresh and cache_key in self.data_cache:
            # Check if cache is still valid
            if time.time() < self.cache_expiry.get(cache_key, 0):
                return self.data_cache[cache_key]
        
        # Get data from each source
        try:
            # Telegram data
            telegram_df = self.telegram_scraper.load_data()
            telegram_messages = self.telegram_scraper.process_data(telegram_df)
            
            # Twitter data (mocked)
            twitter_messages = []
            if coin:
                tweets = self.twitter_scraper.generate_mock_data(coin, count=50)
                twitter_messages = self.twitter_scraper.analyze_tweets(coin, tweets)
            else:
                # Generate data for a few popular coins if no specific coin is requested
                for popular_coin in ['bitcoin', 'ethereum', 'solana', 'bnb']:
                    tweets = self.twitter_scraper.generate_mock_data(popular_coin, count=20)
                    twitter_messages.extend(self.twitter_scraper.analyze_tweets(popular_coin, tweets))
            
            # Combine all messages
            all_messages = telegram_messages + twitter_messages
            
            # Apply coin filter if specified
            if coin:
                coin_lower = coin.lower()
                filtered_messages = []
                for msg in all_messages:
                    # Check if the coin is mentioned in cryptocurrencies field or in text
                    if (coin_lower in [c.lower() for c in msg['cryptocurrencies']] or
                        coin_lower in msg['text'].lower() or
                        (coin_lower in CRYPTO_MAPPING and 
                         any(ticker in msg['text'].lower() for ticker in CRYPTO_MAPPING[coin_lower]))):
                        filtered_messages.append(msg)
                all_messages = filtered_messages
            
            # Sort by timestamp (newest first)
            all_messages.sort(key=lambda x: x['timestamp'], reverse=True)
            
            # Process data for analysis
            results = self._process_for_analysis(all_messages)
            
            # Cache the results
            self.data_cache[cache_key] = results
            self.cache_expiry[cache_key] = time.time() + self.CACHE_DURATION
            
            return results
            
        except Exception as e:
            logger.error(f"Error getting data: {str(e)}")
            logger.error(traceback.format_exc())
            return {
                'error': str(e),
                'total_messages': 0,
                'sentiment_distribution': {},
                'topic_distribution': {},
                'time_series_data': []
            }
    
    def _process_for_analysis(self, messages: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Process messages for analysis dashboard"""
        results = {
            'total_messages': len(messages),
            'sentiment_distribution': {'positive': 0, 'neutral': 0, 'negative': 0, 'warning': 0},
            'topic_distribution': {},
            'urgent_messages': 0,
            'channel_distribution': {},
            'source_distribution': {'telegram': 0, 'twitter': 0},
            'latest_insights': [],
            'time_series_data': [],
            'coin_distribution': {},
            'top_hashtags': {},
            'top_mentions': {}
        }
        
        if not messages:
            return results
        
        # Process message data
        all_topics = []
        all_hashtags = []
        all_mentions = []
        daily_sentiment_data = collections.defaultdict(lambda: {'positive': 0, 'neutral': 0, 'negative': 0, 'warning': 0})
        
        for msg in messages:
            # Sentiment distribution
            sentiment = msg['sentiment']
            if sentiment in results['sentiment_distribution']:
                results['sentiment_distribution'][sentiment] += 1
            
            # Topic distribution
            topics = msg['topics']
            all_topics.extend(topics)
            
            # Check for urgency
            if msg['urgent']:
                results['urgent_messages'] += 1
            
            # Channel distribution
            channel = msg['channel']
            if channel in results['channel_distribution']:
                results['channel_distribution'][channel] += 1
            else:
                results['channel_distribution'][channel] = 1
            
            # Source distribution
            source = msg['source']
            if source in results['source_distribution']:
                results['source_distribution'][source] += 1
            
            # Coin distribution
            for coin in msg['cryptocurrencies']:
                if coin in results['coin_distribution']:
                    results['coin_distribution'][coin] += 1
                else:
                    results['coin_distribution'][coin] = 1
            
            # Collect hashtags and mentions
            all_hashtags.extend(msg['hashtags'])
            all_mentions.extend(msg['mentions'])
            
            # Add to latest insights (last 10 messages)
            if len(results['latest_insights']) < 10:
                # Convert timestamp to datetime if it's a string
                if isinstance(msg['timestamp'], str):
                    try:
                        timestamp = datetime.fromisoformat(msg['timestamp'])
                        formatted_time = timestamp.strftime('%Y-%m-%d %H:%M')
                    except (ValueError, TypeError):
                        formatted_time = msg['timestamp']
                else:
                    formatted_time = msg['timestamp']
                
                message_text = msg['text']
                message_preview = message_text[:100] + '...' if len(message_text) > 100 else message_text
                
                insight = {
                    'timestamp': formatted_time,
                    'channel': msg['channel'],
                    'source': msg['source'],
                    'message': message_preview,
                    'sentiment': sentiment,
                    'urgent': msg['urgent'],
                    'topics': topics,
                    'cryptocurrencies': msg['cryptocurrencies']
                }
                results['latest_insights'].append(insight)
            
            # Prepare time series data (messages per day)
            try:
                if isinstance(msg['timestamp'], str):
                    date_str = msg['timestamp'][:10]  # Extract YYYY-MM-DD
                else:
                    date_str = datetime.now().strftime('%Y-%m-%d')
                
                daily_sentiment_data[date_str][sentiment] += 1
            except Exception as e:
                logger.error(f"Error processing timestamp {msg['timestamp']}: {str(e)}")
        
        # Count topic occurrences
        topic_counter = collections.Counter(all_topics)
        results['topic_distribution'] = dict(topic_counter.most_common())
        
        # Count hashtag occurrences
        hashtag_counter = collections.Counter(all_hashtags)
        results['top_hashtags'] = dict(hashtag_counter.most_common(10))
        
        # Count mention occurrences
        mention_counter = collections.Counter(all_mentions)
        results['top_mentions'] = dict(mention_counter.most_common(10))
        
        # Prepare time series data
        for date_str, sentiment_counts in daily_sentiment_data.items():
            for sentiment, count in sentiment_counts.items():
                results['time_series_data'].append({
                    'date': date_str,
                    'sentiment': sentiment,
                    'count': count
                })
        
        return results
    
    def get_coin_list(self) -> List[str]:
        """Get list of available cryptocurrencies"""
        # Combine coins from hardcoded list and those found in data
        coins = []
        
        # Add from hardcoded mapping
        for name in CRYPTO_MAPPING.keys():
            coins.append(name)
        
        # Try to add from data
        try:
            all_data = self.get_data()
            for coin in all_data.get('coin_distribution', {}).keys():
                if coin and coin.lower() not in [c.lower() for c in coins]:
                    coins.append(coin)
        except Exception as e:
            logger.error(f"Error getting coins from data: {str(e)}")
        
        return sorted(coins)
        
    def analyze_coin(self, coin: str) -> Dict[str, Any]:
        """Get detailed analysis for a specific coin"""
        coin_data = self.get_data(coin)
        
        # Extract most relevant information
        sentiment_dist = coin_data['sentiment_distribution']
        total_mentions = sum(sentiment_dist.values())
        
        if total_mentions == 0:
            return {
                'coin': coin,
                'error': 'No data found for this coin',
                'analysis_time': datetime.now().isoformat()
            }
        
        # Calculate sentiment score
        sentiment_score = (
            (sentiment_dist.get('positive', 0) * 1) + 
            (sentiment_dist.get('neutral', 0) * 0) + 
            (sentiment_dist.get('negative', 0) * -1) + 
            (sentiment_dist.get('warning', 0) * -2)
        ) / total_mentions
        
        # Get latest insights
        latest_news = coin_data['latest_insights']
        
        # Calculate momentum (change in mentions over time)
        time_series = coin_data['time_series_data']
        
        # Group by date and calculate total mentions per day
        daily_mentions = {}
        for item in time_series:
            date_str = item['date']
            if date_str in daily_mentions:
                daily_mentions[date_str] += item['count']
            else:
                daily_mentions[date_str] = item['count']
        
        # Calculate momentum as percentage change from previous day
        dates = sorted(daily_mentions.keys())
        momentum = 0
        if len(dates) >= 2:
            today = dates[-1]
            yesterday = dates[-2]
            today_mentions = daily_mentions[today]
            yesterday_mentions = daily_mentions[yesterday]
            
            if yesterday_mentions > 0:
                momentum = ((today_mentions - yesterday_mentions) / yesterday_mentions) * 100
        
        response = {
            'coin': coin,
            'sentiment_distribution': sentiment_dist,
            'average_sentiment': round(sentiment_score, 2),
            'momentum': round(momentum, 2),
            'total_mentions': total_mentions,
            'topics': coin_data['topic_distribution'],
            'urgent_messages': coin_data['urgent_messages'],
            'latest_news': latest_news,
            'analysis_time': datetime.now().isoformat()
        }
        
        return response

# Initialize analyzer
analyzer = CryptoAnalyzer()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/data', methods=['GET'])
def get_data():
    coin_filter = request.args.get('coin', None)
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    
    try:
        results = analyzer.get_data(coin_filter, force_refresh)
        return jsonify(results)
    except Exception as e:
        logger.error(f"Error in /api/data: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/api/coins', methods=['GET'])
def get_coins():
    try:
        coins = analyzer.get_coin_list()
        return jsonify(sorted(coins))
    except Exception as e:
        logger.error(f"Error in /api/coins: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze', methods=['GET', 'POST'])
def analyze_coin():
    if request.method == 'POST':
        # Get coin name from request
        coin = request.headers.get('X-Coin-Name') or request.json.get('coin')
    else:
        coin = request.args.get('coin')
    
    if not coin:
        return jsonify({'error': 'Coin name required'}), 400
    
    try:
        response = analyzer.analyze_coin(coin)
        return jsonify(response)
    except Exception as e:
        logger.error(f"Error in /api/analyze: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/api/trending', methods=['GET'])
def get_trending():
    """Get trending cryptocurrencies based on recent mentions"""
    try:
        data = analyzer.get_data(force_refresh=False)
        
        # Sort coins by number of mentions
        sorted_coins = sorted(
            data['coin_distribution'].items(),
            key=lambda x: x[1],
            reverse=True
        )[:10]  # Top 10
        
        trending = [{'coin': coin, 'mentions': count} for coin, count in sorted_coins]
        
        return jsonify({
            'trending': trending,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error in /api/trending: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/urgent', methods=['GET'])
def get_urgent():
    """Get urgent messages"""
    try:
        coin_filter = request.args.get('coin', None)
        data = analyzer.get_data(coin_filter, force_refresh=False)
        
        # Filter for urgent messages only
        urgent_messages = [msg for msg in data['latest_insights'] if msg['urgent']]
        
        return jsonify({
            'urgent_count': len(urgent_messages),
            'urgent_messages': urgent_messages,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error in /api/urgent: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/agent-data', methods=['GET'])
def get_agent_data():
    """Get data formatted specifically for the agent"""
    try:
        # Get data for trending coins
        trending_data = analyzer.get_data(force_refresh=False)
        
        # Get top 5 trending coins
        top_coins = sorted(
            trending_data['coin_distribution'].items(),
            key=lambda x: x[1],
            # (continuing from previous code)
            reverse=True
        )[:5]  # Top 5
        
        # Analyze each top coin
        coin_insights = []
        for coin_name, mention_count in top_coins:
            coin_data = analyzer.analyze_coin(coin_name)
            
            # Get overall sentiment direction
            sentiment_score = coin_data.get('average_sentiment', 0)
            if sentiment_score > 0.2:
                sentiment_direction = "positive"
            elif sentiment_score < -0.2:
                sentiment_direction = "negative"
            else:
                sentiment_direction = "neutral"
            
            # Format response for the agent
            coin_insight = {
                'coin': coin_name,
                'sentiment': sentiment_direction,
                'sentiment_score': sentiment_score,
                'total_mentions': mention_count,
                'momentum': coin_data.get('momentum', 0),
                'urgent_count': coin_data.get('urgent_messages', 0),
                'top_topics': list(coin_data.get('topics', {}).keys())[:3],  # Top 3 topics
                'latest_update': coin_data.get('latest_news', [{}])[0] if coin_data.get('latest_news') else {}
            }
            
            coin_insights.append(coin_insight)
        
        # Get overall market sentiment
        all_sentiment = trending_data['sentiment_distribution']
        total_messages = trending_data['total_messages']
        
        if total_messages > 0:
            overall_score = (
                (all_sentiment.get('positive', 0) * 1) + 
                (all_sentiment.get('neutral', 0) * 0) + 
                (all_sentiment.get('negative', 0) * -1) + 
                (all_sentiment.get('warning', 0) * -2)
            ) / total_messages
        else:
            overall_score = 0
        
        # Get urgent messages
        urgent_messages = trending_data.get('urgent_messages', 0)
        latest_urgent = [msg for msg in trending_data.get('latest_insights', []) if msg.get('urgent', False)][:3]
        
        # Format response for agent
        agent_data = {
            'market_overview': {
                'sentiment_score': round(overall_score, 2),
                'sentiment_distribution': all_sentiment,
                'total_messages_analyzed': total_messages,
                'urgent_alert_count': urgent_messages,
                'timestamp': datetime.now().isoformat()
            },
            'top_coins': coin_insights,
            'urgent_alerts': latest_urgent,
            'trending_topics': list(trending_data.get('topic_distribution', {}).keys())[:5]  # Top 5 topics
        }
        
        return jsonify(agent_data)
    except Exception as e:
        logger.error(f"Error in /api/agent-data: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """API health check endpoint"""
    return jsonify({
        'status': 'ok',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    # Get port from environment variable or use default
    port = int(os.environ.get('PORT', 5000))
    
    # Log startup information
    logger.info(f"Starting Crypto Scraper API on port {port}")
    logger.info(f"API endpoints: /api/data, /api/coins, /api/analyze, /api/trending, /api/urgent, /api/agent-data")
    
    app.run(host='0.0.0.0', port=port, debug=False)
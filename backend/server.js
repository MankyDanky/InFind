const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const { google } = require('googleapis');
const { TwitterApi } = require('twitter-api-v2');
const FacebookAdsApi = require('facebook-nodejs-business-sdk').FacebookAdsApi;
const Page = require('facebook-nodejs-business-sdk').Page;
require('dotenv').config();

const app = express();
const port = 5002;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize YouTube API
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

// Initialize Twitter API
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

// Initialize Facebook API
try {
  FacebookAdsApi.init(process.env.FACEBOOK_ACCESS_TOKEN);
  console.log('Facebook API initialized successfully');
} catch (error) {
  console.error('Failed to initialize Facebook API:', error);
}

// Add Facebook API error handling
const handleFacebookError = (error) => {
  if (error.status === 401 || error.status === 400) {
    console.error('Facebook API Authentication Error: Please check your API credentials in .env file');
    return {
      error: 'Facebook API Authentication Error',
      details: 'Invalid API credentials. Please check your Facebook API keys in the .env file.',
      useFallback: true
    };
  }
  
  if (error.status === 429) {
    console.error('Facebook API Rate Limit Error: Please wait before trying again');
    return {
      error: 'Facebook API Rate Limit Error',
      details: 'Rate limit exceeded. Please wait before trying again.',
      retryAfter: 60,
      useFallback: true
    };
  }

  // Handle permission errors (code 100)
  if (error.code === 100 || (error.message && error.message.includes('missing permission'))) {
    console.error('Facebook API Permission Error: Missing required permissions');
    return {
      error: 'Facebook API Permission Error',
      details: 'This application does not have the required permissions to access Facebook page data.',
      useFallback: true
    };
  }

  return {
    error: 'Facebook API Error',
    details: error.message || 'Unknown Facebook API error',
    useFallback: true
  };
};

// Add Twitter API error handling
const handleTwitterError = (error) => {
  if (error.code === 401) {
    console.error('Twitter API Authentication Error: Please check your API credentials in .env file');
    return {
      error: 'Twitter API Authentication Error',
      details: 'Invalid API credentials. Please check your Twitter API keys in the .env file.'
    };
  }
  
  if (error.code === 429) {
    const resetTime = error.rateLimit?.reset;
    const waitTime = resetTime ? Math.ceil((resetTime * 1000 - Date.now()) / 1000) : 60;
    
    // Check if this is a monthly cap error
    const isMonthlyCapError = error.data?.detail?.includes('Monthly product cap');
    if (isMonthlyCapError) {
      console.error('Twitter API Monthly Cap Error: Monthly usage limit reached');
      return {
        error: 'Twitter API Monthly Cap Error',
        details: 'Monthly usage limit exceeded. Using fallback data.',
        useFallback: true
      };
    }
    
    console.error(`Twitter API Rate Limit Error: Please wait ${waitTime} seconds before trying again`);
    return {
      error: 'Twitter API Rate Limit Error',
      details: `Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`,
      retryAfter: waitTime
    };
  }

  return {
    error: 'Twitter API Error',
    details: error.message
  };
};

// Add rate limiting middleware
const rateLimiter = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 180; // Twitter's rate limit for v2 API

const checkRateLimit = (req, res, next) => {
  const now = Date.now();
  const ip = req.ip;
  
  if (!rateLimiter.has(ip)) {
    rateLimiter.set(ip, {
      count: 1,
      windowStart: now
    });
    return next();
  }

  const userLimit = rateLimiter.get(ip);
  
  if (now - userLimit.windowStart > RATE_LIMIT_WINDOW) {
    // Reset window if expired
    userLimit.count = 1;
    userLimit.windowStart = now;
    return next();
  }

  if (userLimit.count >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      error: 'Rate Limit Exceeded',
      details: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((RATE_LIMIT_WINDOW - (now - userLimit.windowStart)) / 1000)
    });
  }

  userLimit.count++;
  next();
};

// Apply rate limiting to Twitter endpoints
app.use('/api/twitter', checkRateLimit);

// Cache implementation
const cache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

function getCachedData(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`Cache hit for key: ${key}`);
    return cached.data;
  }
  return null;
}

function setCachedData(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
  console.log(`Cached data for key: ${key}`);
}

// Add YouTube API error handling
const handleYouTubeError = (error) => {
  console.error('YouTube API Error Details:', error.message);
  
  // Check if we have response data with specific error info
  if (error.response && error.response.data && error.response.data.error) {
    const apiError = error.response.data.error;
    console.error('YouTube API Error Code:', apiError.code);
    console.error('YouTube API Error Reason:', apiError.errors?.[0]?.reason);
    
    // Check for quota exceeded errors
    if (apiError.errors && apiError.errors.some(e => e.reason === 'quotaExceeded')) {
      return {
        error: 'YouTube API Quota Exceeded',
        details: 'The daily quota for YouTube API requests has been exceeded. Please try again tomorrow.'
      };
    }
    
    // Check for API key errors
    if (apiError.errors && apiError.errors.some(e => e.reason === 'keyInvalid')) {
      return {
        error: 'YouTube API Key Invalid',
        details: 'The API key used for accessing YouTube data is invalid or has been revoked.'
      };
    }
  }
  
  // Handle specific HTTP status codes
  if (error.code === 403 || (error.response && error.response.status === 403)) {
    console.error('YouTube API Authentication Error: Please check your API credentials in .env file');
    return {
      error: 'YouTube API Access Denied',
      details: 'Authentication failed. This could be due to invalid API credentials or insufficient permissions.'
    };
  }
  
  if (error.code === 429 || (error.response && error.response.status === 429)) {
    console.error('YouTube API Rate Limit Error: Please wait before trying again');
    return {
      error: 'YouTube API Rate Limit Exceeded',
      details: 'Too many requests in a short period. Please wait before trying again.',
      retryAfter: 60
    };
  }

  // Generic error fallback
  return {
    error: 'YouTube API Error',
    details: error.message || 'An unexpected error occurred while connecting to YouTube.'
  };
};

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Hello from the backend!' });
});

// YouTube channel search endpoint
app.get('/api/youtube/channels', async (req, res) => {
  try {
    const { industry } = req.query;
    
    if (!industry) {
      return res.status(400).json({ error: 'Industry parameter is required' });
    }

    // Check cache first
    const cacheKey = `youtube_${industry}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    console.log(`Searching for YouTube channels in industry: ${industry}`);

    const prompt = `You are a YouTube channel research expert. Provide a list of 2 popular YouTube channels in the ${industry} industry. The channels should be influencers, not companies or corporate channels.
    
    IMPORTANT: Your response must be a valid JSON array containing exactly 2 objects. Each object must have these exact fields:
    - name: The channel name
    - url: The channel URL (preferably in format https://youtube.com/channel/CHANNEL_ID)
    - subscribers: Approximate subscriber count (e.g., "1.2M")
    - description: A brief description of their content (around 100-150 characters)
    - influence: Why they are influential in the ${industry} industry
    
    Example format:
    [
      {
        "name": "Channel Name",
        "url": "https://youtube.com/channel/example",
        "subscribers": "1.2M",
        "description": "Brief description here",
        "influence": "Explanation of their influence"
      }
    ]
    
    Ensure all quotes are properly escaped and the JSON is valid.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a YouTube channel research expert. Always respond with valid JSON arrays containing channel information."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const response = completion.choices[0].message.content;
    console.log('Raw response:', response);

    try {
      const channels = JSON.parse(response);
      
      if (!Array.isArray(channels) || channels.length !== 2) {
        throw new Error('Response is not a valid array of 2 channels');
      }

      channels.forEach((channel, index) => {
        if (!channel.name || !channel.url || !channel.subscribers || !channel.description || !channel.influence) {
          throw new Error(`Channel at index ${index} is missing required fields`);
        }
        
        // Add additional fields that might be expected by the frontend
        channel.platform = 'youtube';
      });

      setCachedData(cacheKey, channels);
      
      console.log(`Successfully parsed ${channels.length} YouTube channels for ${industry}`);
      res.json(channels);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw response:', response);
      res.status(500).json({ 
        error: 'Failed to parse channel data',
        details: parseError.message,
        rawResponse: response
      });
    }

  } catch (error) {
    console.error('OpenAI API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch channels',
      details: error.message
    });
  }
});

// Twitter account search endpoint
app.get('/api/twitter/channels', async (req, res) => {
  try {
    const { industry } = req.query;
    
    if (!industry) {
      return res.status(400).json({ error: 'Industry parameter is required' });
    }

    // Check cache first
    const cacheKey = `twitter_${industry}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    console.log(`Searching for Twitter accounts in industry: ${industry}`);

    const prompt = `You are a Twitter account research expert. Provide a list of 2 influential Twitter accounts in the ${industry} industry. The accounts should be individuals or organizations that are thought leaders, not just corporate accounts.
    
    IMPORTANT: Your response must be a valid JSON array containing exactly 2 objects. Each object must have these exact fields:
    - name: The account name
    - url: Their Twitter profile URL
    - subscribers: Approximate follower count (e.g., "1.2M")
    - description: A brief description of their content
    - influence: Why they are influential in the ${industry} industry
    - username: Their Twitter username (without @)
    
    Example format:
    [
      {
        "name": "Account Name",
        "url": "https://twitter.com/username",
        "subscribers": "1.2M",
        "description": "Brief description here",
        "influence": "Explanation of their influence",
        "username": "username"
      }
    ]
    
    Ensure all quotes are properly escaped and the JSON is valid.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a Twitter account research expert. Always respond with valid JSON arrays containing account information."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const response = completion.choices[0].message.content;
    console.log('Raw response:', response);

    try {
      const accounts = JSON.parse(response);
      
      if (!Array.isArray(accounts) || accounts.length !== 2) {
        throw new Error('Response is not a valid array of 2 accounts');
      }

      accounts.forEach((account, index) => {
        if (!account.name || !account.url || !account.subscribers || !account.description || !account.influence || !account.username) {
          throw new Error(`Account at index ${index} is missing required fields`);
        }
        
        // Add platform field
        account.platform = 'twitter';
      });

      setCachedData(cacheKey, accounts);
      
      console.log(`Successfully parsed ${accounts.length} Twitter accounts for ${industry}`);
      res.json(accounts);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw response:', response);
      res.status(500).json({ 
        error: 'Failed to parse account data',
        details: parseError.message,
        rawResponse: response
      });
    }

  } catch (error) {
    console.error('OpenAI API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch accounts',
      details: error.message
    });
  }
});

// YouTube channel details endpoint
app.get('/api/youtube/channel/:channelName', async (req, res) => {
  try {
    const { channelName } = req.params;
    
    if (!channelName) {
      return res.status(400).json({ error: 'Channel name is required' });
    }

    // Check cache first
    const cacheKey = `youtube_channel_${channelName}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    console.log(`Searching for YouTube channel: ${channelName}`);

    try {
      // Always search for the channel by name or ID
      const searchResponse = await youtube.search.list({
        part: 'snippet',
        q: channelName,
        type: 'channel',
        maxResults: 1
      });

      if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
        return res.status(404).json({ 
          error: 'Channel not found',
          message: `No YouTube channel found matching "${channelName}"`
        });
      }

      const channelId = searchResponse.data.items[0].id.channelId;
      console.log(`Found channel ID: ${channelId} for query: ${channelName}`);

      // Get detailed channel information
      const channelResponse = await youtube.channels.list({
        part: 'snippet,statistics,contentDetails',
        id: channelId
      });

      if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
        return res.status(404).json({ 
          error: 'Channel details not found',
          message: `Could not retrieve details for channel "${channelName}"`
        });
      }

      const channel = channelResponse.data.items[0];
      console.log('YouTube Channel Raw Response:', {
        thumbnails: channel.snippet.thumbnails,
        title: channel.snippet.title,
        id: channel.id
      });

      const channelData = {
        id: channel.id,
        name: channel.snippet.title,
        description: channel.snippet.description,
        thumbnail: channel.snippet.thumbnails.high?.url || channel.snippet.thumbnails.medium?.url || channel.snippet.thumbnails.default?.url || 'https://placehold.co/200x200/gray/white?text=No+Image',
        subscriberCount: channel.statistics.subscriberCount,
        videoCount: channel.statistics.videoCount,
        viewCount: channel.statistics.viewCount,
        customUrl: channel.snippet.customUrl,
        publishedAt: channel.snippet.publishedAt,
        country: channel.snippet.country,
        playlistId: channel.contentDetails.relatedPlaylists.uploads
      };

      console.log('YouTube Channel Processed Data:', {
        name: channelData.name,
        thumbnail: channelData.thumbnail,
        thumbnailSource: channel.snippet.thumbnails.high ? 'high' : 
                        channel.snippet.thumbnails.medium ? 'medium' : 
                        channel.snippet.thumbnails.default ? 'default' : 'fallback'
      });

      setCachedData(cacheKey, channelData);
      return res.json(channelData);
    } catch (youtubeError) {
      console.error('YouTube API Error:', youtubeError);
      const errorResponse = handleYouTubeError(youtubeError);
      return res.status(500).json(errorResponse);
    }
  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ 
      error: 'Server Error', 
      message: error.message || 'An unexpected error occurred' 
    });
  }
});

// Facebook page search endpoint
app.get('/api/facebook/channels', async (req, res) => {
  try {
    const { industry } = req.query;
    
    if (!industry) {
      return res.status(400).json({ error: 'Industry parameter is required' });
    }

    // Check cache first
    const cacheKey = `facebook_${industry}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    console.log(`Searching for Facebook pages in industry: ${industry}`);

    const prompt = `You are a Facebook page research expert. Provide a list of 2 influential Facebook pages in the ${industry} industry. The pages should be individuals or organizations that are thought leaders, not just corporate accounts.
    
    IMPORTANT: Your response must be a valid JSON array containing exactly 2 objects. Each object must have these exact fields:
    - name: The page name
    - url: Their Facebook page URL (in the format https://facebook.com/username)
    - subscribers: Approximate follower count (e.g., "1.2M")
    - description: A brief description of their content
    - influence: Why they are influential in the ${industry} industry
    - username: Their Facebook page username (as it appears in the URL)
    
    Example format:
    [
      {
        "name": "Page Name",
        "url": "https://facebook.com/username",
        "subscribers": "1.2M",
        "description": "Brief description here",
        "influence": "Explanation of their influence",
        "username": "username"
      }
    ]
    
    Ensure all quotes are properly escaped and the JSON is valid.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a Facebook page research expert. Always respond with valid JSON arrays containing page information."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const response = completion.choices[0].message.content;
    console.log('Raw response:', response);

    try {
      const pages = JSON.parse(response);
      
      if (!Array.isArray(pages) || pages.length !== 2) {
        throw new Error('Response is not a valid array of 2 pages');
      }

      pages.forEach((page, index) => {
        if (!page.name || !page.url || !page.subscribers || !page.description || !page.influence || !page.username) {
          throw new Error(`Page at index ${index} is missing required fields`);
        }
        
        // Add platform field
        page.platform = 'facebook';
      });

      setCachedData(cacheKey, pages);
      
      console.log(`Successfully parsed ${pages.length} Facebook pages for ${industry}`);
      res.json(pages);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw response:', response);
      res.status(500).json({ 
        error: 'Failed to parse page data',
        details: parseError.message,
        rawResponse: response
      });
    }

  } catch (error) {
    console.error('OpenAI API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch pages',
      details: error.message
    });
  }
});

// Cache status endpoint
app.get('/api/cache/status', (req, res) => {
  const status = {
    totalCached: cache.size,
    industries: Array.from(cache.keys()),
    timestamp: Date.now()
  };
  res.json(status);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: Date.now(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cache: {
      size: cache.size,
      keys: Array.from(cache.keys())
    }
  };
  res.json(health);
});

// Marketing analysis endpoint
app.get('/api/youtube/channel/:channelId/marketing-analysis', async (req, res) => {
  try {
    const { channelId } = req.params;
    
    if (!channelId) {
      return res.status(400).json({ error: 'Channel ID is required' });
    }

    // Check cache first
    const cacheKey = `youtube_marketing_${channelId}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    // First get the channel details to use in the analysis
    const channelResponse = await youtube.channels.list({
      part: 'snippet,statistics,contentDetails',
      id: channelId
    });

    if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
      return res.status(404).json({ 
        error: 'Channel not found',
        message: `Could not retrieve details for channel ID "${channelId}"`
      });
    }

    const channel = channelResponse.data.items[0];
    
    // Get recent videos for content analysis
    const videosResponse = await youtube.search.list({
      part: 'snippet',
      channelId: channelId,
      order: 'date',
      type: 'video',
      maxResults: 10
    });
    
    // Prepare data for OpenAI prompt
    const channelData = {
      name: channel.snippet.title,
      description: channel.snippet.description,
      subscriberCount: parseInt(channel.statistics.subscriberCount).toLocaleString(),
      videoCount: parseInt(channel.statistics.videoCount).toLocaleString(),
      viewCount: parseInt(channel.statistics.viewCount).toLocaleString(),
      recentVideos: videosResponse.data.items ? videosResponse.data.items.map(item => item.snippet.title) : []
    };
    
    // Generate marketing analysis using OpenAI
    const prompt = `You are an expert marketing analyst specializing in influencer marketing. 
    
    Analyze the following YouTube channel for brand partnership potential:
    
    Channel Name: ${channelData.name}
    Subscribers: ${channelData.subscriberCount}
    Total Videos: ${channelData.videoCount}
    Total Views: ${channelData.viewCount}
    
    Description: ${channelData.description}
    
    Recent Video Titles:
    ${channelData.recentVideos.map((title, i) => `${i+1}. ${title}`).join('\n')}
    
    Create a concise pros and cons list for brands considering partnering with this influencer.
    
    FORMAT YOUR RESPONSE EXACTLY AS FOLLOWS:
    
    1. First, a one-sentence "Partnership Potential" summary with a rating (High/Medium/Low)
    2. A list of "PROS:" (5 maximum) - Brief but specific advantages for brands
    3. A list of "CONS:" (5 maximum) - Brief but specific disadvantages or risks
    4. A short "Best fit for:" list of 3-5 specific brand categories or industries that would be most suitable
    
    Keep explanations brief but informative. Avoid excessive words or marketing jargon.`;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert marketing analyst specializing in influencer partnerships. You provide concise, actionable pros and cons lists for brands considering influencer partnerships."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 800
    });
    
    const analysisText = completion.choices[0].message.content;
    
    // Format the analysis into sections
    const formattedAnalysis = {
      channelName: channelData.name,
      channelStats: {
        subscribers: channelData.subscriberCount,
        videos: channelData.videoCount,
        views: channelData.viewCount
      },
      analysisText: analysisText,
      generatedAt: new Date().toISOString()
    };
    
    setCachedData(cacheKey, formattedAnalysis);
    return res.json(formattedAnalysis);
    
  } catch (error) {
    console.error('Marketing Analysis Error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate marketing analysis',
      details: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    details: err.message
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 
import { Scraper, SearchMode, Tweet } from 'agent-twitter-client';
import { TwitterClientConfig, ProcessedTweet, TweetCollectionOptions } from './types';
import { KOL } from '../config/kol-list';
import fs from 'fs';
import path from 'path';

export class TwitterClient {
  private scraper: Scraper;
  private config: TwitterClientConfig;
  private isAuthenticated: boolean = false;
  private storageDir: string;
  private rateLimitDelay: number = 1000; // Delay between requests in ms

  constructor(config: TwitterClientConfig) {
    this.scraper = new Scraper();
    this.config = config;
    this.storageDir = path.join(__dirname, 'storage');
    
    // Ensure storage directory exists
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  /**
   * Initialize the Twitter client and authenticate
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('Attempting to login with:', { 
        username: this.config.username,
        email: this.config.email,
        hasPassword: !!this.config.password,
        hasApiKey: !!this.config.apiKey
      });
      
      // Authenticate with Twitter
      await this.scraper.login(
        this.config.username,
        this.config.password,
        this.config.email
      );

      this.isAuthenticated = await this.scraper.isLoggedIn();
      console.log('Login successful:', this.isAuthenticated);
      return this.isAuthenticated;
    } catch (error) {
      console.error('Error initializing Twitter client:', error);
      return false;
    }
  }

  /**
   * Collects tweets from a list of KOLs based on the provided options
   */
  async collectTweetsFromKOLs(
    kols: KOL[], 
    options: TweetCollectionOptions
  ): Promise<ProcessedTweet[]> {
    if (!this.isAuthenticated) {
      throw new Error('Twitter client not authenticated');
    }

    const allProcessedTweets: ProcessedTweet[] = [];
    const timestamp = new Date().toISOString().replace(/[:\.]/g, '-');
    
    for (const kol of kols) {
      console.log(`Collecting tweets for KOL: ${kol.username}`);
      
      try {
        // Create a unique filename for this collection
        const storageFilename = path.join(
          this.storageDir, 
          `${kol.username}_${timestamp}.json`
        );
        
        // Check if we have cached data that's recent (within lookback period)
        const cachedTweets = this.getRecentCachedTweets(kol.username, options.lookbackDays);
        
        if (cachedTweets.length > 0) {
          console.log(`Using ${cachedTweets.length} cached tweets for @${kol.username}`);
          allProcessedTweets.push(...cachedTweets);
          continue;
        }
        
        console.log(`Fetching tweets for @${kol.username}...`);
        
        // Get tweets generator from this KOL
        const tweetsGenerator = this.scraper.getTweets(kol.username, options.maxTweetsPerKOL);
        
        // Convert AsyncGenerator to array of tweets
        const tweets: Tweet[] = [];
        for await (const tweet of tweetsGenerator) {
          tweets.push(tweet);
          console.log(`Found tweet: ${tweet.text?.substring(0, 50)}...`);
          if (tweets.length >= options.maxTweetsPerKOL) {
            break;
          }
          
          // Add delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
        }
        
        console.log(`Retrieved ${tweets.length} tweets for @${kol.username}`);
        
        // Process and filter tweets
        const processedTweets = await this.processTweets(tweets, options, kol.username);
        
        // Store the processed tweets for future use
        this.storeTweets(storageFilename, processedTweets);
        
        allProcessedTweets.push(...processedTweets);
      } catch (error) {
        console.error(`Error collecting tweets for ${kol.username}:`, error);
        
        // If error occurs, try to use cached data as fallback
        const cachedTweets = this.getAllCachedTweets(kol.username);
        if (cachedTweets.length > 0) {
          console.log(`Using ${cachedTweets.length} cached tweets for @${kol.username} as fallback`);
          allProcessedTweets.push(...cachedTweets);
        }
      }
      
      // Add delay between KOLs to avoid rate limiting
      if (kols.length > 1) {
        console.log(`Waiting ${this.rateLimitDelay * 2}ms before processing next KOL...`);
        await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay * 2));
      }
    }
    
    return allProcessedTweets;
  }

  /**
   * Process raw tweets into a standardized format and filter based on options
   */
  private async processTweets(
    tweets: Tweet[], 
    options: TweetCollectionOptions,
    kolUsername: string
  ): Promise<ProcessedTweet[]> {
    const processedTweets: ProcessedTweet[] = [];
    const currentDate = new Date();
    const lookbackDate = new Date(currentDate);
    lookbackDate.setDate(lookbackDate.getDate() - options.lookbackDays);

    for (const tweet of tweets) {
      try {
        // Skip retweets if configured
        if (tweet.isRetweet) {
          continue;
        }

        // Check if tweet is within the lookback period (using timestamp or timeParsed)
        const tweetDate = tweet.timeParsed || (tweet.timestamp ? new Date(tweet.timestamp) : new Date());
        if (tweetDate < lookbackDate) {
          continue;
        }

        // Check if tweet meets minimum engagement
        const likes = tweet.likes || 0;
        const retweets = tweet.retweets || 0;
        const totalEngagement = likes + retweets;
        if (totalEngagement < options.minEngagement) {
          continue;
        }

        // Extract URLs from tweet content
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const tweetText = tweet.text || '';
        const extractedUrls = tweetText.match(urlRegex) || [];

        // Process media items
        const media = tweet.photos?.map(photo => ({
          type: 'image' as const,
          url: photo.url
        })) || [];

        // Create standardized tweet object - use the KOL username since Twitter API may not return correct username
        const processedTweet: ProcessedTweet = {
          id: tweet.id || '',
          url: tweet.permanentUrl || `https://twitter.com/${kolUsername}/status/${tweet.id || ''}`,
          author: {
            username: kolUsername,
            displayName: tweet.name || kolUsername
          },
          content: tweetText,
          createdAt: tweetDate,
          metrics: {
            likes: likes,
            retweets: retweets,
            replies: tweet.replies || 0
          },
          media: media,
          isRetweet: !!tweet.isRetweet,
          isReply: !!tweet.isReply,
          hasLinks: extractedUrls.length > 0,
          extractedUrls: extractedUrls
        };

        processedTweets.push(processedTweet);
      } catch (error) {
        console.error('Error processing tweet:', error);
      }
    }

    return processedTweets;
  }

  /**
   * Get a specific tweet by ID with all data
   */
  async getTweetById(tweetId: string): Promise<ProcessedTweet | null> {
    try {
      // First check if we have this tweet in cache
      const cachedTweet = this.getCachedTweetById(tweetId);
      if (cachedTweet) {
        console.log(`Using cached data for tweet ID: ${tweetId}`);
        return cachedTweet;
      }
      
      // Add a delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
      
      const tweet = await this.scraper.getTweet(tweetId);
      if (!tweet) {
        return null;
      }

      // Extract URLs from tweet content
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const tweetText = tweet.text || '';
      const extractedUrls = tweetText.match(urlRegex) || [];

      // Process media items
      const media = tweet.photos?.map(photo => ({
        type: 'image' as const,
        url: photo.url
      })) || [];

      // Create standardized tweet object
      const processedTweet = {
        id: tweet.id || '',
        url: tweet.permanentUrl || `https://twitter.com/i/status/${tweet.id || ''}`,
        author: {
          username: tweet.userId || '',
          displayName: tweet.name || tweet.userId || ''
        },
        content: tweetText,
        createdAt: tweet.timeParsed || (tweet.timestamp ? new Date(tweet.timestamp) : new Date()),
        metrics: {
          likes: tweet.likes || 0,
          retweets: tweet.retweets || 0,
          replies: tweet.replies || 0
        },
        media: media,
        isRetweet: !!tweet.isRetweet,
        isReply: !!tweet.isReply,
        hasLinks: extractedUrls.length > 0,
        extractedUrls: extractedUrls
      };
      
      // Store this tweet for future use
      const timestamp = new Date().toISOString().replace(/[:\.]/g, '-');
      const storageFilename = path.join(this.storageDir, `tweet_${tweetId}_${timestamp}.json`);
      this.storeTweets(storageFilename, [processedTweet]);
      
      return processedTweet;
    } catch (error) {
      console.error('Error fetching tweet by ID:', error);
      
      // Try to get from cache as fallback
      const cachedTweet = this.getCachedTweetById(tweetId);
      if (cachedTweet) {
        console.log(`Using cached data for tweet ID: ${tweetId} as fallback`);
        return cachedTweet;
      }
      
      return null;
    }
  }
  
  /**
   * Store tweets to the filesystem for later replay
   */
  private storeTweets(filename: string, tweets: ProcessedTweet[]): void {
    try {
      // Convert date objects to ISO strings for storage
      const tweetsToStore = tweets.map(tweet => ({
        ...tweet,
        createdAt: tweet.createdAt instanceof Date ? tweet.createdAt.toISOString() : tweet.createdAt
      }));
      
      fs.writeFileSync(filename, JSON.stringify(tweetsToStore, null, 2));
      console.log(`Stored ${tweets.length} tweets to ${filename}`);
    } catch (error) {
      console.error(`Error storing tweets to ${filename}:`, error);
    }
  }
  
  /**
   * Get all cached tweets for a specific KOL
   */
  private getAllCachedTweets(username: string): ProcessedTweet[] {
    try {
      const allTweets: ProcessedTweet[] = [];
      const files = fs.readdirSync(this.storageDir);
      
      // Find all files for this KOL
      const userFiles = files.filter(file => 
        file.startsWith(`${username.toLowerCase()}_`) && file.endsWith('.json')
      );
      
      for (const file of userFiles) {
        try {
          const filePath = path.join(this.storageDir, file);
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          const storedTweets = JSON.parse(fileContent) as any[];
          
          // Convert stored format back to ProcessedTweet format
          const processedTweets = storedTweets.map(tweet => ({
            ...tweet,
            createdAt: new Date(tweet.createdAt)
          }));
          
          allTweets.push(...processedTweets);
        } catch (err) {
          console.error(`Error reading cached tweet file ${file}:`, err);
        }
      }
      
      return allTweets;
    } catch (error) {
      console.error(`Error getting cached tweets for ${username}:`, error);
      return [];
    }
  }
  
  /**
   * Get recent cached tweets for a specific KOL (within lookback days)
   */
  private getRecentCachedTweets(username: string, lookbackDays: number): ProcessedTweet[] {
    const allCachedTweets = this.getAllCachedTweets(username);
    
    if (allCachedTweets.length === 0) {
      return [];
    }
    
    // Filter to tweets within lookback period
    const currentDate = new Date();
    const lookbackDate = new Date(currentDate);
    lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);
    
    return allCachedTweets.filter(tweet => tweet.createdAt >= lookbackDate);
  }
  
  /**
   * Get a cached tweet by ID
   */
  private getCachedTweetById(tweetId: string): ProcessedTweet | null {
    try {
      const files = fs.readdirSync(this.storageDir);
      
      // Find files that might contain this tweet
      const relevantFiles = files.filter(file => 
        (file.startsWith('tweet_' + tweetId) || file.includes('.json'))
      );
      
      for (const file of relevantFiles) {
        try {
          const filePath = path.join(this.storageDir, file);
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          const storedTweets = JSON.parse(fileContent) as any[];
          
          // Look for the tweet with matching ID
          const matchingTweet = storedTweets.find(tweet => tweet.id === tweetId);
          
          if (matchingTweet) {
            // Convert stored format back to ProcessedTweet format
            return {
              ...matchingTweet,
              createdAt: new Date(matchingTweet.createdAt)
            };
          }
        } catch (err) {
          console.error(`Error reading cached tweet file ${file}:`, err);
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting cached tweet by ID ${tweetId}:`, error);
      return null;
    }
  }
}
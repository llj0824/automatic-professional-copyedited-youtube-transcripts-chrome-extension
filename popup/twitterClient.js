// popup/twitterClient.js

// Use standard package imports
import { Scraper } from 'agent-twitter-client';
// Assuming Cookie might not be directly exported or needed,
// let's comment it out for now unless the scraper instance requires it explicitly.
// If Cookie is needed, check how agent-twitter-client exports it.
// import { Cookie } from 'agent-twitter-client'; 
import StorageUtils from './storage_utils.js';

// Key for storing cookies in chrome.storage.local
const TWITTER_COOKIES_KEY = 'twitter_session_cookies';

class TwitterClient {
    constructor() {
        // Note: Creating the scraper instance here might trigger initial guest auth network requests.
        // Consider lazy initialization if needed.
        this.scraper = new Scraper();
        this.storageUtils = new StorageUtils();
        this.isLoggedIn = false; // Track login status
    }

    async initialize() {
        console.log('Initializing TwitterClient...');
        await this.loadSession();
        if (this.isLoggedIn) {
            console.log('TwitterClient initialized with existing session.');
        } else {
            console.log('TwitterClient initialized. No active session found.');
        }
    }

    async loadSession() {
        try {
            const cookies = await this.storageUtils.loadData(TWITTER_COOKIES_KEY);
            if (cookies && Array.isArray(cookies) && cookies.length > 0) {
                console.log('Loading saved cookies into scraper...');
                await this.scraper.setCookies(cookies);
                // Verify if the session is still valid
                this.isLoggedIn = await this.scraper.isLoggedIn();
                if (!this.isLoggedIn) {
                    console.warn('Loaded cookies are invalid or expired. Clearing session.');
                    await this.clearSession();
                }
            } else {
                this.isLoggedIn = false;
            }
        } catch (error) {
            console.error('Error loading Twitter session:', error);
            this.isLoggedIn = false;
            await this.clearSession(); // Clear potentially corrupted data
        }
    }

    async saveSession() {
        try {
            const cookies = await this.scraper.getCookies();
            // Filter cookies to save only necessary ones if possible (e.g., auth_token, ct0)
            // For simplicity, saving all for now.
            await this.storageUtils.saveData(TWITTER_COOKIES_KEY, cookies);
            console.log('Twitter session cookies saved.');
        } catch (error) {
            console.error('Error saving Twitter session:', error);
        }
    }

    async clearSession() {
        try {
            await this.storageUtils.removeData(TWITTER_COOKIES_KEY);
            await this.scraper.logout(); // Attempt to clear internal state
            this.isLoggedIn = false;
            console.log('Twitter session cleared.');
        } catch (error) {
            console.error('Error clearing Twitter session:', error);
        }
    }

    async isAuthenticated() {
        // Check internal flag first, then verify with scraper API if needed
        if (!this.isLoggedIn) {
           // Maybe try loading session again just in case?
           await this.loadSession();
        }
        // Double-check with the scraper's check
        try {
             this.isLoggedIn = await this.scraper.isLoggedIn();
        } catch (error) {
            console.error("Error checking login status:", error);
            this.isLoggedIn = false; 
        }
        return this.isLoggedIn;
    }

    /**
     * Authenticates the user using username and password.
     * NOTE: This requires securely getting credentials from the user via UI.
     * @param {string} username
     * @param {string} password
     * @param {string} [email] - Optional, sometimes needed for verification
     * @returns {Promise<boolean>} - True if login successful, false otherwise.
     */
    async authenticate(username, password, email = undefined) {
        console.log(`Attempting login for user: ${username}`);
        if (!username || !password) {
            alert('Username and Password are required.');
            return false;
        }

        try {
            await this.scraper.login(username, password, email);
            this.isLoggedIn = await this.scraper.isLoggedIn();

            if (this.isLoggedIn) {
                console.log('Login successful.');
                await this.saveSession(); // Save cookies after successful login
                return true;
            } else {
                console.warn('Login attempt failed (scraper did not report as logged in).');
                alert('Login failed. Please check your credentials.');
                await this.clearSession();
                return false;
            }
        } catch (error) {
            console.error('Error during Twitter login:', error);
            // Attempt to provide a more user-friendly error
            let errorMessage = 'Login failed. An unexpected error occurred.';
            if (error.message.includes('suspicious login') || error.message.includes('verification')) {
                 errorMessage = 'Login failed. Twitter requires verification. Please log in via twitter.com, then try again here.';
            } else if (error.message.includes('incorrect password')) {
                 errorMessage = 'Login failed. Incorrect username or password.';
            }
            alert(errorMessage);
            await this.clearSession();
            this.isLoggedIn = false;
            return false;
        }
    }

    async logout() {
        await this.clearSession();
        // Scraper logout might clear internal state, session clear removes stored cookies
    }

    /**
     * Posts a tweet using the authenticated session.
     * @param {string} text - The content of the tweet.
     * @returns {Promise<object>} - The result from the scraper's sendTweet call.
     */
    async postTweet(text) {
        console.log("Attempting to post tweet via scraper...");
        if (!this.isLoggedIn) {
             // Try to load session one last time
            await this.loadSession();
            if (!this.isLoggedIn) {
                 throw new Error("Not authenticated with Twitter. Please log in first.");
            }
        }

        try {
            // Using sendTweet - might need sendTweetV2 or others depending on desired features
            const result = await this.scraper.sendTweet(text);
            console.log('Tweet posted successfully via scraper:', result);
            return result; // Return the response from the library
        } catch (error) {
            console.error('Error posting tweet via scraper:', error);
            // Check for specific errors if the library provides them
            throw new Error(`Failed to post tweet: ${error.message}`);
        }
    }
}

// Add generic load/save/remove to StorageUtils if they don't exist
// Modify StorageUtils to include these generic methods
StorageUtils.prototype.saveData = function(key, data) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set({ [key]: data }, () => {
            if (chrome.runtime.lastError) {
                console.error(`Error saving data for key ${key}:`, chrome.runtime.lastError);
                reject(chrome.runtime.lastError);
            } else {
                console.log(`Data saved successfully for key: ${key}`);
                resolve();
            }
        });
    });
};

StorageUtils.prototype.loadData = function(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get([key], (result) => {
            if (chrome.runtime.lastError) {
                console.error(`Error loading data for key ${key}:`, chrome.runtime.lastError);
                reject(chrome.runtime.lastError);
            } else {
                const data = result[key] || null;
                console.log(`Data loaded for key ${key}:`, data ? 'Data found' : 'No data found');
                resolve(data);
            }
        });
    });
};

StorageUtils.prototype.removeData = function(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.remove([key], () => {
            if (chrome.runtime.lastError) {
                console.error(`Error removing data for key ${key}:`, chrome.runtime.lastError);
                reject(chrome.runtime.lastError);
            } else {
                console.log(`Data removed successfully for key: ${key}`);
                resolve();
            }
        });
    });
};

export default TwitterClient; 
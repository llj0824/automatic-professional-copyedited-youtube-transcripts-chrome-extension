/**
 * Fetches the raw transcript for a given YouTube video.
 * Inspired by https://github.com/Kakulukian/youtube-transcript/blob/master/src/index.ts
 * 
 * @class YoutubeTranscriptRetriever
 */
class YoutubeTranscriptRetriever {
  /**
   * Delimiter indicating the beginning of the transcript section.
   * Example: "=== TRANSCRIPT ==="
   */
  static TRANSCRIPT_BEGINS_DELIMITER = "*** Transcript ***";
  static CONTEXT_BEGINS_DELIMITER = "*** Background Context ***";

  /**
   * Fetches the transcript for the specified YouTube video.
   * Transforms to desired format.
   * 
   * @param {string} videoIdOrUrl - The YouTube video ID or full URL.
   * @returns {Promise<string>} - The raw transcript as a single string.
   * @throws Will throw an error if the transcript cannot be retrieved.
   */
  static async fetchParsedTranscript(videoIdOrUrl, retryAttempts = 3) {
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        // Extract the video ID from the URL if necessary
        const videoId = this.extractVideoId(videoIdOrUrl);
        if (!videoId) {
          throw new Error('Invalid YouTube video ID or URL.');
        }

        const html = await this.fetchVideoPage(videoId);
        const initialData = this.extractInitialData(html);
        const captionTracks = this.extractCaptionTracks(initialData);
        
        if (captionTracks.length === 0) {
          throw new Error('NO_CAPTIONS');
        }

      const transcriptUrl = captionTracks[0].baseUrl;
      const xmlTranscript = await this.fetchTranscriptXml(transcriptUrl);
      
      /*
      Expected xmlTranscript format:
      <transcript>
        <text start="1.36" dur="5.24">good</text>
        <text start="3.2" dur="5.439">afternoon we save the best for the last</text>
        <text start="6.6" dur="4.32">okay let me start by saying</text>
        ...
      </transcript>
      */
      
      const parsedTranscript = this.parseTranscriptXml(xmlTranscript);
      
      /*
      Expected parsedTranscript format:
      [0:01] good
      [0:03] afternoon we save the best for the last
      [0:06] okay let me start by saying
      ...
      */

      // Extract video details for context
      const videoDetails = initialData.videoDetails || {};
      
      // Create context block with clear delimiters
      // Note: Extracting just the first paragraph of the description. Moving forward may do RAG search w/ perplexity to hydrate with speaker background.
      const contextBlock = `${this.CONTEXT_BEGINS_DELIMITER}
Title: ${videoDetails.title || 'Unknown'}
Description: ${(videoDetails.shortDescription && videoDetails.shortDescription.split('\n')[0]) || 'No description available'}
${this.TRANSCRIPT_BEGINS_DELIMITER}
`;
        // Combine context and transcript
        return contextBlock + parsedTranscript;
      } catch (error) {
        if (error.message === 'NO_CAPTIONS') {
          throw new Error('This video does not have captions available for automatic retrieval.');
        }
        
        if (attempt === retryAttempts) {
          window.alert('Unable to load transcript. Please try:\n1. Closing and reopening the extension\n2. Refreshing the YouTube page\n3. If the problem persists, you can manually load the transcript.');
        }
        
        // Wait for a short delay before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  /**
   * Fetches the HTML content of the YouTube video page.
   * 
   * @param {string} videoId - The YouTube video ID.
   * @returns {Promise<string>} - HTML content of the video page.
   */
  static async fetchVideoPage(videoId) {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        try {
          const [tab] = tabs;
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => document.documentElement.outerHTML
          });
          resolve(results[0].result);
        } catch (error) {
          reject(error);
        }
      });
    });
  }
  /**
   * Extracts the initial JSON data from the YouTube video page HTML.
   * 
   * @param {string} html - The HTML content of the YouTube video page.
   * @returns {object} - The parsed initial data JSON object.
   * @throws Will throw an error if the initial data cannot be found or parsed.
   */
  static extractInitialData(html) {
    const match = html.match(/ytInitialPlayerResponse\s*=\s*({.+?})\s*;/);
    if (!match) throw new Error('Initial data not found in the page.');
    return JSON.parse(match[1]);
  }

  /**
   * Extracts caption tracks from the initial data.
   * 
   * @param {object} initialData - The initial data JSON object.
   * @returns {Array} - Array of caption track objects.
   */
  static extractCaptionTracks(initialData) {
    return initialData.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
  }

  /**
   * Fetches the XML transcript from the provided URL.
   * 
   * @param {string} transcriptUrl - The URL to fetch the XML transcript from.
   * @returns {Promise<string>} - The XML transcript as a string.
   */
  static async fetchTranscriptXml(transcriptUrl) {
    const response = await fetch(transcriptUrl);
    return await response.text();
  }

  /**
   * Parses the XML transcript and formats it into a readable string.
   * 
   * @param {string} xmlTranscript - The raw XML transcript.
   * @returns {string} - The formatted transcript.
   */
  static parseTranscriptXml(xmlTranscript) {
    // This is a more robust parser that handles timestamps and formatting
    const lines = xmlTranscript.match(/<text.+?>.+?<\/text>/g) || [];
    let currentTimestamp = 0;
    const formattedTranscript = lines.map((line, index) => {
      const startMatch = line.match(/start="([\d.]+)"/);
      const start = startMatch ? parseFloat(startMatch[1]) : currentTimestamp;
      currentTimestamp = start;

      const text = line.replace(/<.+?>/, '').replace(/<\/text>/, '').trim();
      
      // Format timestamp as [M:SS]
      const minutes = Math.floor(start / 60);
      const seconds = Math.floor(start % 60);
      const formattedTime = `[${minutes}:${seconds.toString().padStart(2, '0')}]`;

      return `${formattedTime} ${text}`;
    }).join('\n');

    return formattedTranscript;
  }

  /**
   * Extracts the YouTube video ID from a given URL or returns the ID if provided.
   * 
   * @param {string} videoIdOrUrl - The YouTube video ID or full URL.
   * @returns {string|null} - The extracted video ID or null if invalid.
   */
  static extractVideoId(videoIdOrUrl) {
    // If the input is already a 11-character video ID, return it
    const videoIdRegex = /^[a-zA-Z0-9_-]{11}$/;
    if (videoIdRegex.test(videoIdOrUrl)) {
      return videoIdOrUrl;
    }

    // Regular expression to extract video ID from URL
    const urlRegex = /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/;
    const match = videoIdOrUrl.match(urlRegex);
    return match ? match[1] : null;
  }
}

export default YoutubeTranscriptRetriever;

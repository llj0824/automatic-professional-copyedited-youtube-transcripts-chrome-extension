import { YoutubeTranscript } from 'youtube-transcript';
/**
 * Fetches the raw transcript for a given YouTube video.
 * 
 * @class YoutubeTranscriptRetriever
 */
class YoutubeTranscriptRetriever {
  /**
   * Fetches the raw transcript for the specified YouTube video.
   * 
   * @param {string} videoIdOrUrl - The YouTube video ID or full URL.
   * @returns {Promise<string>} - The raw transcript as a single string.
   * @throws Will throw an error if the transcript cannot be retrieved.
   */
  static async fetchRawTranscript(videoIdOrUrl) {
    try {
      // Extract the video ID from the URL if necessary
      const videoId = this.extractVideoId(videoIdOrUrl);
      if (!videoId) {
        throw new Error('Invalid YouTube video ID or URL.');
      }

      // Fetch the transcript using youtube-transcript
      const transcriptArray = await YoutubeTranscript.fetchTranscript(videoId);
      
      if (!transcriptArray || transcriptArray.length === 0) {
        throw new Error('No transcript available for this video.');
      }

      // Combine the transcript segments into a single string
      const rawTranscript = transcriptArray.map(segment => segment.text).join('\n');
      
      return rawTranscript;
    } catch (error) {
      console.error('Error fetching transcript:', error);
      throw error;
    }
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

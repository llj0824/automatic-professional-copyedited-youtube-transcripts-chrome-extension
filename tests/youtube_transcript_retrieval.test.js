import YoutubeTranscriptRetriever from '../popup/youtube_transcript_retrival.js';

// import fetch from 'node-fetch'; // Add this line
// // Mock the global fetch function
// global.fetch = fetch;

import { TextDecoder, TextEncoder } from 'text-encoding';

global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;

describe('YoutubeTranscriptRetriever', () => {
  describe('fetchRawTranscript', () => {
    it.only('should fetch and return the raw transcript as a string for a valid video ID', async () => {
      const videoId = 'SzCpCbQ27Kk'; // Replace with a video ID that has a transcript
      const result = await YoutubeTranscriptRetriever.fetchRawTranscript(videoId);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should throw an error if the video ID is invalid', async () => {
      await expect(YoutubeTranscriptRetriever.fetchRawTranscript('invalid-id'))
        .rejects
        .toThrow('Invalid YouTube video ID or URL.');
    });

    it('should throw an error if no transcript is available', async () => {
      const videoId = 'noTranscriptVideoId'; // Replace with a video ID that has no transcript
      await expect(YoutubeTranscriptRetriever.fetchRawTranscript(videoId))
        .rejects
        .toThrow('No transcript available for this video.');
    });
  });

  describe('extractVideoId', () => {
    it('should return the video ID if a valid ID is provided', () => {
      const videoId = 'SzCpCbQ27Kk';
      const result = YoutubeTranscriptRetriever.extractVideoId(videoId);
      expect(result).toBe(videoId);
    });

    it('should extract the video ID from a valid YouTube URL', () => {
      const url = 'https://www.youtube.com/watch?v=SzCpCbQ27Kk';
      const result = YoutubeTranscriptRetriever.extractVideoId(url);
      expect(result).toBe('SzCpCbQ27Kk');
    });

    it('should return null for an invalid URL', () => {
      const url = 'https://www.youtube.com/watch?v=invalid';
      const result = YoutubeTranscriptRetriever.extractVideoId(url);
      expect(result).toBeNull();
    });
  });
});

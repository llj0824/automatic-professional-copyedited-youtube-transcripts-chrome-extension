import YoutubeTranscriptRetriever from '../popup/youtube_transcript_retrival.js';

describe('YoutubeTranscriptRetriever', () => {
  describe('fetchParsedTranscript', () => {
    it('should fetch and return the raw transcript as a string for a valid video ID', async () => {
      const videoId = 'SzCpCbQ27Kk'; // Replace with a video ID that has a transcript

      const result = await YoutubeTranscriptRetriever.fetchParsedTranscript(videoId);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should throw an error if the video ID is invalid', async () => {
      await expect(YoutubeTranscriptRetriever.fetchParsedTranscript('invalid-id'))
        .rejects
        .toThrow('Invalid YouTube video ID or URL.');
    });

    it('should throw an error if no transcript is available', async () => {
      const videoId = 'noTranscriptVideoId'; // Replace with a video ID that has no transcript
      await expect(YoutubeTranscriptRetriever.fetchParsedTranscript(videoId))
        .rejects
        .toThrow('No captions available for this video.');
    });

    // Improved and Additional Tests for Fetching Parsed Transcript and Formatting

    describe('Transcript Formatting', () => {
      let videoId;
      let parsedTranscript;

      beforeAll(async () => {
        videoId = 'SzCpCbQ27Kk'; // Replace with a video ID that has a consistent transcript format
        parsedTranscript = await YoutubeTranscriptRetriever.fetchParsedTranscript(videoId);
      });

      it('should maintain consistent formatting for timestamps in the parsed transcript', () => {
        const lines = parsedTranscript.split('\n');
        lines.forEach(line => {
          // Check if each line starts with a timestamp in the format [M:SS]
          expect(line).toMatch(/^\[\d+:\d{2}\] .+/);
        });
      });

      it('should detect changes in the XML transcript format', async () => {
        // Mocking fetchTranscriptXml to return a different XML format
        const originalFetchTranscriptXml = YoutubeTranscriptRetriever.fetchTranscriptXml;

        // Altered XML format (e.g., different tag names and attributes)
        YoutubeTranscriptRetriever.fetchTranscriptXml = async () => {
          return `
            <transcript>
              <sentence start_time="1.36" duration="5.24">good</sentence>
              <sentence start_time="3.2" duration="5.439">afternoon we save the best for the last</sentence>
              <sentence start_time="6.6" duration="4.32">okay let me start by saying</sentence>
            </transcript>
          `;
        };

        await expect(YoutubeTranscriptRetriever.fetchParsedTranscript(videoId))
          .rejects
          .toThrow();

        // Restore the original method
        YoutubeTranscriptRetriever.fetchTranscriptXml = originalFetchTranscriptXml;
      });

      it('should handle empty transcript gracefully', async () => {
        // Mocking fetchTranscriptXml to return an empty transcript
        const originalFetchTranscriptXml = YoutubeTranscriptRetriever.fetchTranscriptXml;

        YoutubeTranscriptRetriever.fetchTranscriptXml = async () => {
          return `<transcript></transcript>`;
        };

        await expect(YoutubeTranscriptRetriever.fetchParsedTranscript(videoId))
          .resolves
          .toBe('');

        // Restore the original method
        YoutubeTranscriptRetriever.fetchTranscriptXml = originalFetchTranscriptXml;
      });

      // New Improvement: Check for Correct Timestamp Parsing
      it('should correctly parse timestamps from XML to [M:SS] format', () => {
        const lines = parsedTranscript.split('\n');
        lines.forEach(line => {
          const match = line.match(/^\[(\d+):(\d{2})\] (.+)$/);
          expect(match).not.toBeNull();
          if (match) {
            const minutes = parseInt(match[1], 10);
            const seconds = parseInt(match[2], 10);
            expect(minutes).toBeGreaterThanOrEqual(0);
            expect(seconds).toBeLessThan(60);
            expect(match[3].length).toBeGreaterThan(0);
          }
        });
      });

      // New Test: Handle Special Characters and Unicode
      it('should correctly handle special characters and unicode in the transcript', () => {
        const specialVideoId = 'SpecialCharVid123'; // Replace with a video ID that includes special characters
        // Mock the fetchTranscriptXml to return XML with special characters
        const originalFetchTranscriptXml = YoutubeTranscriptRetriever.fetchTranscriptXml;

        YoutubeTranscriptRetriever.fetchTranscriptXml = async () => {
          return `
            <transcript>
              <text start="1.0" dur="2.0">Hello, world! 😊</text>
              <text start="3.0" dur="2.0">C'est la vie!</text>
              <text start="5.0" dur="2.0">こんにちは世界</text>
            </transcript>
          `;
        };

        return YoutubeTranscriptRetriever.fetchParsedTranscript(specialVideoId).then(transcript => {
          const expected = `[0:01] Hello, world! 😊
[0:03] C'est la vie!
[0:05] こんにちは世界`;
          expect(transcript).toBe(expected);
        }).finally(() => {
          // Restore the original method
          YoutubeTranscriptRetriever.fetchTranscriptXml = originalFetchTranscriptXml;
        });
      });

      // New Test: Handle Multiple Caption Tracks
      it('should fetch and parse the first available caption track', async () => {
        // Mock fetchCaptionTracks to return multiple tracks
        const originalExtractCaptionTracks = YoutubeTranscriptRetriever.extractCaptionTracks;

        YoutubeTranscriptRetriever.extractCaptionTracks = (initialData) => {
          return [
            { baseUrl: 'http://example.com/transcript1.xml' },
            { baseUrl: 'http://example.com/transcript2.xml' },
          ];
        };

        const originalFetchTranscriptXml = YoutubeTranscriptRetriever.fetchTranscriptXml;

        // Mock fetchTranscriptXml to return a specific transcript for the first track
        YoutubeTranscriptRetriever.fetchTranscriptXml = async (url) => {
          if (url === 'http://example.com/transcript1.xml') {
            return `
              <transcript>
                <text start="0.0" dur="2.0">First transcript line.</text>
              </transcript>
            `;
          } else if (url === 'http://example.com/transcript2.xml') {
            return `
              <transcript>
                <text start="0.0" dur="2.0">Second transcript line.</text>
              </transcript>
            `;
          }
          return `<transcript></transcript>`;
        };

        const result = await YoutubeTranscriptRetriever.fetchParsedTranscript(videoId);
        expect(result).toBe('[0:00] First transcript line.');

        // Restore the original methods
        YoutubeTranscriptRetriever.extractCaptionTracks = originalExtractCaptionTracks;
        YoutubeTranscriptRetriever.fetchTranscriptXml = originalFetchTranscriptXml;
      });

      // New Test: Handle Malformed XML
      it('should throw an error when the XML transcript is malformed', async () => {
        // Mocking fetchTranscriptXml to return malformed XML
        const originalFetchTranscriptXml = YoutubeTranscriptRetriever.fetchTranscriptXml;

        YoutubeTranscriptRetriever.fetchTranscriptXml = async () => {
          return `
            <transcript>
              <text start="1.0" dur="2.0">This is a malformed transcript
              <text start="3.0" dur="2.0">Another line without closing tag.</text>
            </transcript>
          `;
        };

        await expect(YoutubeTranscriptRetriever.fetchParsedTranscript(videoId))
          .rejects
          .toThrow();

        // Restore the original method
        YoutubeTranscriptRetriever.fetchTranscriptXml = originalFetchTranscriptXml;
      });

      // Additional Test: Verify Expected XML Format
      it('should correctly process the expected XML transcript format', async () => {
        const expectedXml = `
          <transcript>
            <text start="10.0" dur="5.0">First line of the transcript.</text>
            <text start="15.0" dur="5.0">Second line of the transcript.</text>
          </transcript>
        `;
        const originalFetchTranscriptXml = YoutubeTranscriptRetriever.fetchTranscriptXml;

        YoutubeTranscriptRetriever.fetchTranscriptXml = async () => expectedXml;

        const transcript = await YoutubeTranscriptRetriever.fetchParsedTranscript(videoId);
        const expectedParsed = `[0:10] First line of the transcript.
[0:15] Second line of the transcript.`;
        expect(transcript).toBe(expectedParsed);

        // Restore the original method
        YoutubeTranscriptRetriever.fetchTranscriptXml = originalFetchTranscriptXml;
      });

      // Additional Test: Verify Expected Parsed Transcript Format
      it('should return transcript lines in the correct [M:SS] format', async () => {
        const xml = `
          <transcript>
            <text start="65.5" dur="4.0">Transition to next topic.</text>
            <text start="70.0" dur="3.0">Conclusion of the discussion.</text>
          </transcript>
        `;
        const originalFetchTranscriptXml = YoutubeTranscriptRetriever.fetchTranscriptXml;

        YoutubeTranscriptRetriever.fetchTranscriptXml = async () => xml;

        const transcript = await YoutubeTranscriptRetriever.fetchParsedTranscript(videoId);
        const expectedParsed = `[1:05] Transition to next topic.
[1:10] Conclusion of the discussion.`;
        expect(transcript).toBe(expectedParsed);

        // Restore the original method
        YoutubeTranscriptRetriever.fetchTranscriptXml = originalFetchTranscriptXml;
      });
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

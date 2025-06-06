#!/usr/bin/env node

/**
 * Test script to verify transcript extraction functionality
 * Mimics the YoutubeTranscriptRetriever class behavior
 */

const https = require('https');
const http = require('http');

class TestTranscriptRetriever {
  static async fetchVideoPage(videoId) {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    console.log(`Fetching video page: ${videoUrl}`);
    
    return new Promise((resolve, reject) => {
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      };
      
      https.get(videoUrl, options, (response) => {
        let data = '';
        response.on('data', (chunk) => data += chunk);
        response.on('end', () => {
          console.log(`✓ Fetched ${data.length} bytes from video page`);
          resolve(data);
        });
      }).on('error', reject);
    });
  }

  static extractInitialData(html) {
    console.log('Extracting ytInitialPlayerResponse...');
    
    // Use the pattern that actually works with current YouTube
    const pattern = /window\["ytInitialPlayerResponse"\]\s*=\s*(\{.+?\});|ytInitialPlayerResponse\s*=\s*(\{.+?\});/;
    const match = html.match(pattern);
    
    if (match) {
      const jsonStr = match[1] || match[2];
      try {
        const data = JSON.parse(jsonStr);
        console.log('✓ Successfully extracted and parsed initial data');
        return data;
      } catch (e) {
        console.log('Failed to parse JSON:', e.message);
      }
    }
    
    // Fallback: more aggressive search
    const start = html.indexOf('ytInitialPlayerResponse');
    if (start !== -1) {
      const jsonStart = html.indexOf('{', start);
      if (jsonStart !== -1) {
        let braceCount = 0;
        let jsonEnd = jsonStart;
        for (let i = jsonStart; i < html.length; i++) {
          if (html[i] === '{') braceCount++;
          if (html[i] === '}') braceCount--;
          if (braceCount === 0) {
            jsonEnd = i + 1;
            break;
          }
        }
        const jsonStr = html.substring(jsonStart, jsonEnd);
        try {
          const data = JSON.parse(jsonStr);
          console.log('✓ Successfully extracted and parsed initial data (aggressive search)');
          return data;
        } catch (e) {
          console.log('Failed to parse with aggressive search:', e.message);
        }
      }
    }
    
    throw new Error('Initial data not found in the page.');
  }

  static extractCaptionTracks(initialData) {
    console.log('Extracting caption tracks...');
    const tracks = initialData.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
    console.log(`✓ Found ${tracks.length} caption tracks`);
    
    if (tracks.length > 0) {
      tracks.forEach((track, i) => {
        const name = track.name?.simpleText || 'Unknown';
        const lang = track.languageCode || 'Unknown';
        console.log(`  Track ${i}: ${name} (${lang})`);
      });
    }
    
    return tracks;
  }

  static async fetchTranscriptXml(transcriptUrl, videoId) {
    console.log('Fetching transcript XML...');
    console.log(`URL: ${transcriptUrl}`);
    
    return new Promise((resolve, reject) => {
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': `https://www.youtube.com/watch?v=${videoId}`,
          'Origin': 'https://www.youtube.com',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin'
        }
      };
      
      https.get(transcriptUrl, options, (response) => {
        if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`Failed to fetch transcript: ${response.statusCode} ${response.statusMessage}`));
          return;
        }
        
        let data = '';
        response.on('data', (chunk) => data += chunk);
        response.on('end', () => {
          console.log(`✓ Received ${data.length} bytes of transcript data`);
          
          if (!data || data.trim().length === 0) {
            reject(new Error('Empty transcript response from YouTube API - URL may have expired'));
            return;
          }
          
          if (!data.includes('<transcript>') && !data.includes('<text')) {
            reject(new Error('Invalid transcript format received from YouTube API'));
            return;
          }
          
          console.log('✓ Valid XML transcript format detected');
          resolve(data);
        });
      }).on('error', reject);
    });
  }

  static parseTranscriptXml(xmlTranscript) {
    console.log('Parsing XML transcript...');
    
    // Use regex to extract text elements (simpler than DOM parsing for Node.js)
    const textRegex = /<text[^>]*start="([^"]*)"[^>]*>([^<]*)<\/text>/g;
    let formattedTranscript = '';
    let match;
    let count = 0;
    
    while ((match = textRegex.exec(xmlTranscript)) !== null) {
      const start = parseFloat(match[1]);
      const text = match[2].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\n/g, ' ').trim();
      
      // Format timestamp as [M:SS]
      const minutes = Math.floor(start / 60);
      const seconds = Math.floor(start % 60);
      const formattedTime = `[${minutes}:${seconds.toString().padStart(2, '0')}]`;
      
      formattedTranscript += `${formattedTime} ${text}\n`;
      count++;
    }
    
    console.log(`✓ Parsed ${count} transcript segments`);
    return formattedTranscript;
  }

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

  static async fetchParsedTranscript(videoIdOrUrl) {
    try {
      console.log('=== Starting transcript extraction ===');
      
      // Extract video ID
      const videoId = this.extractVideoId(videoIdOrUrl);
      if (!videoId) {
        throw new Error('Invalid YouTube video ID or URL.');
      }
      console.log(`✓ Video ID: ${videoId}`);

      // Fetch video page
      const html = await this.fetchVideoPage(videoId);
      
      // Extract initial data
      const initialData = this.extractInitialData(html);
      
      // Extract caption tracks
      const captionTracks = this.extractCaptionTracks(initialData);
      
      if (captionTracks.length === 0) {
        throw new Error('NO_CAPTIONS');
      }

      // Get transcript URL and fetch XML
      const transcriptUrl = captionTracks[0].baseUrl;
      const xmlTranscript = await this.fetchTranscriptXml(transcriptUrl, videoId);
      
      // Parse transcript
      const parsedTranscript = this.parseTranscriptXml(xmlTranscript);
      
      console.log('=== Transcript extraction completed successfully ===');
      return parsedTranscript;
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      throw error;
    }
  }
}

// Test with the shorter video ID
async function test() {
  const videoId = 'qhnJDDX2hhU';
  
  try {
    const transcript = await TestTranscriptRetriever.fetchParsedTranscript(videoId);
    
    console.log('\n=== TRANSCRIPT PREVIEW (first 500 chars) ===');
    console.log(transcript.substring(0, 500));
    console.log('\n=== SUCCESS: Transcript extracted successfully! ===');
    
  } catch (error) {
    console.error('\n=== FAILED ===');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  test();
}

module.exports = TestTranscriptRetriever;
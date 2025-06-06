const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Helper function to execute curl commands
function executeCurl(command) {
  console.log(`Executing command: ${command}`);
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      console.log('\n--- cURL STDOUT ---');
      console.log(stdout.substring(0, 500) + (stdout.length > 500 ? '...' : '')); // Log snippet
      console.log('--- cURL STDERR ---');
      console.error(stderr); // curl verbose output goes to stderr
      console.log('-------------------\n');

      if (error) {
        // Log the error but resolve with current data for analysis
        console.warn(`Curl command finished with error: ${error.message}`);
        resolve({ stdout, stderr, error });
      } else {
        resolve({ stdout, stderr, error: null });
      }
    });
  });
}

class TestYoutubeTranscriptRetriever {
  static CONTEXT_BEGINS_DELIMITER = "--- CONTEXT BEGINS ---";
  static TRANSCRIPT_BEGINS_DELIMITER = "--- TRANSCRIPT BEGINS ---";

  static async fetchVideoPageAndSaveCookies(videoId, cookieJarPath) {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    console.log(`Fetching video page and saving cookies: ${videoUrl}`);
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36'; // Updated UA
    const acceptLanguage = 'en-US,en;q=0.9';
    const acceptHeader = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9'; // Slightly updated accept
    
    const command = `curl -v -L --compressed -A "${userAgent}" -H "Accept-Language: ${acceptLanguage}" -H "Accept: ${acceptHeader}" -c "${cookieJarPath}" "${videoUrl}"`;
    
    const { stdout, stderr, error } = await executeCurl(command);

    if (error && !stdout) { // If curl truly failed and gave no output
        throw new Error(`Failed to fetch video page (curl error): ${error.message}. Stderr: ${stderr}`);
    }
    // Check for HTTP status in stderr if possible (though stdout is primary for page content)
    if (!stdout || stdout.trim().length === 0) {
        console.warn('Video page fetch returned empty stdout from curl.');
    }
    console.log('Finished fetching video page and attempting to save cookies.');
    return stdout; // This is the HTML content
  }

  static extractInitialData(html) {
    console.log('Extracting initial data (ytInitialPlayerResponse)...');
    // More robust regex to capture the object correctly, handling potential variations
    const match = html.match(/ytInitialPlayerResponse\s*=\s*({.*?});(?:\s*var meta|<\/script>)/s);
    if (!match || !match[1]) {
      const alternativeMatch = html.match(/var ytInitialPlayerResponse\s*=\s*({.*?});/s);
      if (!alternativeMatch || !alternativeMatch[1]) {
        console.error('Initial data (ytInitialPlayerResponse) not found with primary or alternative regex.');
        // Log a snippet of HTML around where it's expected, for debugging
        const searchString = 'ytInitialPlayerResponse';
        const idx = html.indexOf(searchString);
        if (idx !== -1) {
          console.error(`Snippet around expected ytInitialPlayerResponse:\n${html.substring(Math.max(0, idx - 300), Math.min(html.length, idx + 300))}`);
        }
        throw new Error('Initial data (ytInitialPlayerResponse) not found in the page.');
      }
      console.log('Successfully extracted initial data (alternative pattern).');
      return JSON.parse(alternativeMatch[1]);
    }
    console.log('Successfully extracted initial data (primary pattern).');
    return JSON.parse(match[1]);
  }

  static extractCaptionTracks(initialData) {
    console.log('Extracting caption tracks...');
    const captionTracks = initialData.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!captionTracks || captionTracks.length === 0) {
      console.log('No caption tracks found in initialData.captions.playerCaptionsTracklistRenderer.captionTracks');
      // Log the relevant part of initialData for debugging
      if (initialData.captions && initialData.captions.playerCaptionsTracklistRenderer) {
        console.log('playerCaptionsTracklistRenderer content:', JSON.stringify(initialData.captions.playerCaptionsTracklistRenderer, null, 2));
      } else if (initialData.captions) {
        console.log('initialData.captions content:', JSON.stringify(initialData.captions, null, 2));
      } else {
        console.log('initialData.captions is missing.');
      }
      throw new Error('No caption tracks found.');
    }
    console.log(`Found ${captionTracks.length} caption track(s).`);
    // Log available languages
    captionTracks.forEach(track => {
      console.log(` - Language: ${track.languageCode}, Name: ${track.name?.simpleText}, URL: ${track.baseUrl.substring(0, 100)}...`);
    });
    return captionTracks;
  }

  static async fetchTranscriptXmlWithCookies(transcriptUrl, cookieJarPath) {
    console.log(`Fetching transcript XML with cookies from: ${transcriptUrl.substring(0,100)}...`);
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36'; // Updated UA
    const acceptLanguage = 'en-US,en;q=0.9';
    // Revert to a more general Accept header, similar to page fetch
    const acceptHeader = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9';
    const originHeader = 'https://www.youtube.com';
    const videoIdMatch = transcriptUrl.match(/[?&]v=([^&]+)/);
    const refererHeader = videoIdMatch ? `https://www.youtube.com/watch?v=${videoIdMatch[1]}` : 'https://www.youtube.com/';

    // Escape double quotes in URL for shell command
    const escapedTranscriptUrl = transcriptUrl.replace(/"/g, '\\"');

    const command = `curl -v -L --compressed -A "${userAgent}" -H "Accept-Language: ${acceptLanguage}" -H "Accept: ${acceptHeader}" -H "Origin: ${originHeader}" -H "Referer: ${refererHeader}" -b "${cookieJarPath}" "${escapedTranscriptUrl}"`;
    
    const { stdout, stderr, error } = await executeCurl(command);

    if (error && !stdout) { // If curl truly failed and gave no output
        // Distinguish between HTTP errors (like 403, where stdout might still be relevant) and network errors
        if (stderr.includes('Could not resolve host') || stderr.includes('Connection refused')) {
            throw new Error(`Failed to fetch transcript XML (network error): ${error.message}. Stderr: ${stderr}`);
        }
        console.warn(`Curl command for transcript resulted in error, but might have content. Error: ${error.message}`);
    }

    if (!stdout || stdout.trim().length === 0) {
      console.warn('Transcript XML response (curl stdout) is empty.');
    }
    console.log('Successfully executed curl command for transcript (length of stdout: ' + stdout.length + ').');
    return stdout; // This is the XML content (or empty if failed)
  }

  static parseTranscriptXml(xmlTranscript) {
    if (!xmlTranscript || xmlTranscript.trim().length === 0) {
        console.log('XML transcript is empty, cannot parse.');
        return 'Cannot parse empty XML transcript.';
    }
    console.log('Parsing transcript XML...');
    const textEntries = [];
    // Improved regex to handle self-closing tags and variations in attributes
    const regex = /<text start="([\d\.]+)"(?: dur="([\d\.]+)")?>(.*?)<\/text>/gs;
    let match;
    let count = 0;
    while ((match = regex.exec(xmlTranscript)) !== null) {
      // Decode HTML entities more comprehensively
      const textContent = match[3]
        .replace(/&amp;#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&'); // Must be last
      textEntries.push(`[${parseFloat(match[1]).toFixed(2)}] ${textContent.replace(/<[^>]*>/g, '')}`);
      count++;
    }
    if (count === 0 && xmlTranscript.length > 0) {
        console.warn('XML parser did not find any <text> elements. Raw XML snippet:');
        console.warn(xmlTranscript.substring(0, 500));
    }
    console.log(`Parsed ${textEntries.length} transcript entries.`);
    return textEntries.join('\n');
  }

  static parseTranscriptContext(videoDetails) {
    if (!videoDetails) {
      console.warn('videoDetails object is missing. Cannot parse context.');
      return '';
    }

    // Get the first paragraph (text before first empty line)
    const firstParagraph = videoDetails.shortDescription?.split('\n\n')[0] || '';

    // Extract timestamp lines - matches both (MM:SS) and MM:SS formats
    const chapterTimestamps = videoDetails.shortDescription?.split('\n')
      .filter(line => {
        const trimmedLine = line.trim();
        // Match both (MM:SS) and MM:SS formats
        return /^\(?(\d+:\d+)\)?/.test(trimmedLine);
      })
      .join('\n') || '';

    // Combine first paragraph and timestamps
    const description = `${firstParagraph}\n\nTimestamps:\n${chapterTimestamps}`.trim();

    return `${this.CONTEXT_BEGINS_DELIMITER}\nTitle: ${videoDetails.title || 'Unknown'}\nDescription: ${description}\n${this.TRANSCRIPT_BEGINS_DELIMITER}\n`;
  }
}

async function main() {
  const videoId = 'qhnJDDX2hhU'; // Revert to original Target video ID
  const cookieJarName = `youtube_cookies_${videoId}.txt`;
  const cookieJarPath = path.join(__dirname, cookieJarName); // Store cookies in the same directory as the script

  console.log(`Starting transcript retrieval test for video ID: ${videoId}`);
  console.log(`Using cookie jar: ${cookieJarPath}\n--------------------------------------------------`);

  try {
    // Step 1: Fetch video page and save cookies
    const html = await TestYoutubeTranscriptRetriever.fetchVideoPageAndSaveCookies(videoId, cookieJarPath);
    if (!html || html.trim().length === 0) {
        console.error('Failed to fetch HTML of the video page or HTML was empty. Cannot proceed.');
        return;
    }

    // Step 2: Extract initial data from HTML
    const initialData = TestYoutubeTranscriptRetriever.extractInitialData(html);
    
    const captionTracks = TestYoutubeTranscriptRetriever.extractCaptionTracks(initialData);

    console.log('\n--------------------------------------------------\nExtracted Caption Tracks (Full Object):\n--------------------------------------------------');
    console.log(JSON.stringify(captionTracks, null, 2));
    console.log('--------------------------------------------------\n');

    if (captionTracks.length === 0) {
      console.error('No caption tracks found in initialData. Cannot proceed.');
      return;
    }

    let targetTrack = captionTracks.find(track => track.languageCode === 'en');
    if (!targetTrack) {
        console.warn("No 'en' language track found. Using the first available track.");
        targetTrack = captionTracks[0];
    }
    console.log(`Selected track: Lang=${targetTrack.languageCode}, Name='${targetTrack.name?.simpleText}', URL=${targetTrack.baseUrl.substring(0,100)}...`);

    // Step 3: Fetch transcript XML using saved cookies
    const xmlTranscript = await TestYoutubeTranscriptRetriever.fetchTranscriptXmlWithCookies(targetTrack.baseUrl, cookieJarPath);
    
    if (!xmlTranscript || xmlTranscript.trim().length === 0) {
        console.error("fetchTranscriptXmlWithCookies returned empty or whitespace-only content. Cannot parse.");
        // Attempt to log cookie jar content for debugging if it's small enough
        try {
            const cookieContent = fs.readFileSync(cookieJarPath, 'utf-8');
            console.log(`--- Content of ${cookieJarName} --- (first 500 chars)`);
            console.log(cookieContent.substring(0,500) + (cookieContent.length > 500 ? '...' : ''));
            console.log('------------------------------------');
        } catch (e) {
            console.warn(`Could not read cookie jar ${cookieJarName}: ${e.message}`);
        }
        return;
    }

    const parsedTranscript = TestYoutubeTranscriptRetriever.parseTranscriptXml(xmlTranscript);
    const videoDetails = initialData.videoDetails || {};
    const contextBlock = TestYoutubeTranscriptRetriever.parseTranscriptContext(videoDetails);

    console.log('\n--------------------------------------------------\nFull Output:\n--------------------------------------------------');
    console.log(contextBlock + parsedTranscript);
    console.log('\n--------------------------------------------------\nTest finished.');

  } catch (error) {
    console.error('\n--------------------------------------------------\nError during transcript retrieval test:');
    console.error(error.message);
    if(error.stack) console.error(error.stack);
    console.log('--------------------------------------------------');
  } finally {
    // Clean up cookie jar file
    try {
      if (fs.existsSync(cookieJarPath)) {
        fs.unlinkSync(cookieJarPath);
        console.log(`Cleaned up cookie jar: ${cookieJarPath}`);
      }
    } catch (e) {
      console.warn(`Failed to clean up cookie jar ${cookieJarPath}: ${e.message}`);
    }
  }
}

main();

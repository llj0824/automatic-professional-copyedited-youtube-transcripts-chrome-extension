// content.js  – runs on every watch page

// --- CONFIGURATION: Update these selectors if YouTube changes their structure ---
const SELECTORS = {
  // Transcript panel containers
  transcriptPanels: 'ytd-transcript-renderer, ytd-transcript-body-renderer',
  
  // Transcript segments (individual lines)
  transcriptSegments: 'ytd-transcript-segment-renderer',
  
  // Within each segment
  timestamp: '.segment-timestamp',
  text: '.segment-text, yt-formatted-string.segment-text',
  
  // Video metadata
  videoTitle: [
    'h1.ytd-video-primary-info-renderer yt-formatted-string',
    'h1.ytd-watch-metadata yt-formatted-string', 
    'h1.title'
  ],
  videoDescription: [
    '#description-inline-expander yt-formatted-string',
    '#description yt-formatted-string'
  ]
};

// --- 1.  Shared helpers ----------------------------------------------------
function isTranscriptPanelOpen() {
  return !!document.querySelector(SELECTORS.transcriptPanels);
}

function extractVideoMetadata() {
  try {
    // Try to get title from multiple sources
    let titleElement = null;
    for (const selector of SELECTORS.videoTitle) {
      titleElement = document.querySelector(selector);
      if (titleElement) break;
    }
    const title = titleElement?.textContent?.trim() || 'Unknown';

    // Try to get description
    let descriptionElement = null;
    for (const selector of SELECTORS.videoDescription) {
      descriptionElement = document.querySelector(selector);
      if (descriptionElement) break;
    }
    let description = descriptionElement?.textContent?.trim() || 'No description available';

    // Extract first paragraph and timestamps
    if (description && description !== 'No description available') {
      const lines = description.split('\n');
      const firstParagraph = lines[0] || '';
      
      // Extract timestamp lines
      const chapterTimestamps = lines
        .filter(line => /^\(?(\d+:\d+)\)?/.test(line.trim()))
        .join('\n');
      
      description = firstParagraph + (chapterTimestamps ? '\n\nTimestamps:\n' + chapterTimestamps : '');
    }

    return { title, description };
  } catch (error) {
    console.error('Error extracting metadata:', error);
    return { title: 'Unknown', description: 'No description available' };
  }
}

function extractTranscript() {
  // Use the configured selector for transcript segments
  const segments = document.querySelectorAll(SELECTORS.transcriptSegments);
  
  console.log(`Found ${segments.length} transcript segments`);
  if (!segments.length) return '';

  // Get video metadata
  const { title, description } = extractVideoMetadata();
  
  // Format context block
  const contextBlock = `*** Background Context ***
Title: ${title}
Description: ${description}
*** Transcript ***`;

  // Extract transcript text
  const transcriptText = [...segments].map(segment => {
    const timeElement = segment.querySelector(SELECTORS.timestamp);
    const textElement = segment.querySelector(SELECTORS.text);
    
    const time = timeElement?.textContent?.trim() || '';
    const text = textElement?.textContent?.trim() || '';
    
    return time && text ? `[${time}] ${text}` : '';
  }).filter(line => line !== '').join('\n');

  console.log(`Extracted transcript with ${transcriptText.split('\n').length} lines`);
  return contextBlock + '\n' + transcriptText;
}

// --- 2.  Message bridge ----------------------------------------------------
chrome.runtime.onMessage.addListener((msg, _sender, respond) => {
  console.log('Content script received message:', msg);
  if (msg?.type !== 'CHECK_TRANSCRIPT') return;
  
  console.log('Checking for transcript panel...');
  const panelOpen = isTranscriptPanelOpen();
  console.log('Panel open:', panelOpen);
  
  if (panelOpen) {
    const transcript = extractTranscript();
    console.log('Transcript extracted, length:', transcript.length);
    respond({success: true, transcript: transcript});
  } else {
    console.log('No transcript panel found');
    respond({success: false});
  }
  // Return true to keep the channel open for async respond() if needed
  return false;
});

// --- 3.  UX helper (overlay) ----------------------------------------------
function injectGuideOverlay() {
  if (document.getElementById('aytpe-guide')) return; // already injected

  const div = Object.assign(document.createElement('div'), {
    id:   'aytpe-guide',
    textContent: '👉 Click "..." below the video → "Show transcript".\n' +
                 'This message disappears when a transcript is detected.',
    style: `
      position:fixed;top:80px;right:24px;max-width:320px;z-index:2147483647;
      background:#fff;border:2px solid #cd201f;border-radius:8px;
      padding:12px 16px;font:14px/1.4 Arial,sans-serif;white-space:pre;
      box-shadow:0 2px 6px rgba(0,0,0,.3);user-select:none;`
  });
  document.body.appendChild(div);
}

function hideGuide() {
  document.getElementById('aytpe-guide')?.remove();
}

// Observe for panel‑open events so we can hide the overlay automatically.
const panelObserver = new MutationObserver(() => {
  if (isTranscriptPanelOpen()) hideGuide();
});
panelObserver.observe(document.body, {subtree: true, childList: true});

// First‑time load: insert overlay if panel not already open.
// if (!isTranscriptPanelOpen()) injectGuideOverlay();
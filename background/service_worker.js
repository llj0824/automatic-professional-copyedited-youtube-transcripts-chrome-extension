// background/service_worker.js

// Import necessary utilities. Use relative paths from the extension root.
try {
  // Note: In MV3, importScripts is synchronous and runs during initialization.
  importScripts('../popup/storage_utils.js'); // Path relative to extension root
  console.log('Successfully imported storage_utils.js');
} catch (e) {
  console.error('Failed to import storage_utils.js:', e);
  // Handle the error appropriately, maybe disable features that depend on it.
}

const YOUTUBE_ORIGIN = 'www.youtube.com';
// IMPORTANT: Replace with your actual backend API endpoint for clipping
const BACKEND_CLIP_API_URL = 'https://your-backend-service.com/api/create-clip'; 

// Configure side panel to open on action click
console.log('Configuring side panel behavior...');
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('Failed to set panel behavior:', error));

// Helper: Show or hide the side panel
async function togglePanel(tabId, shouldShow) {
  if (shouldShow) {
    await chrome.sidePanel.setOptions({
      tabId,
      path: 'popup/popup.html',
      enabled: true
    });
    console.log('Panel opened');
    return;
  }

  await chrome.sidePanel.setOptions({
    path: 'popup/popup.html',
    enabled: false
  });
  console.log('Panel closed');
}

// Event: User clicks extension icon - show panel
chrome.action.onClicked.addListener((tab) => {
  togglePanel(tab.id, true);
});

// Event: User switches tabs - hide panel if not on YouTube
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  const isYouTube = tab.url?.includes(YOUTUBE_ORIGIN);
  
  if (!isYouTube) {
    togglePanel(tabId, false);
  }
});

//==============================================================================
//                         MESSAGE HANDLING
//==============================================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message in service worker:", message);

  if (message.type === 'MAKE_CLIP') {
    // Make the handler async to use await for transcript loading
    (async () => {
      const { videoId, start, end } = message.payload;
      console.log(`MAKE_CLIP request received: videoId=${videoId}, start=${start}, end=${end}`);
      
      // Function to send feedback messages to the popup
      const sendFeedback = (type, payload) => {
        chrome.runtime.sendMessage({ type, payload }).catch(err => console.error("Error sending feedback:", err));
      };

      try {
        sendFeedback('CLIP_PROGRESS', { status: 'Fetching transcript...' });

        // Ensure StorageUtils class is available
        if (typeof StorageUtils === 'undefined') {
          throw new Error('StorageUtils is not defined. Import failed.');
        }
        
        const storageUtils = new StorageUtils();
        const { rawTranscript } = await storageUtils.loadTranscriptsById(videoId);

        if (!rawTranscript) {
          throw new Error(`Raw transcript not found in storage for video ID: ${videoId}`);
        }
        
        console.log('Successfully loaded raw transcript.');
        sendFeedback('CLIP_PROGRESS', { status: 'Sending request to clipping service...' });

        // --- Call Backend API ---
        if (!BACKEND_CLIP_API_URL || BACKEND_CLIP_API_URL.includes('your-backend-service.com')) {
            throw new Error('Backend clipping API URL is not configured in service_worker.js');
        }

        const response = await fetch(BACKEND_CLIP_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ videoId, start, end }),
        });

        if (!response.ok) {
          let errorMsg = `Backend API error: ${response.status} ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMsg += ` - ${errorData.message || 'No additional details'}`;
          } catch (e) { /* Ignore if response body is not JSON */ }
          throw new Error(errorMsg);
        }

        const clipData = await response.json();

        if (!clipData.downloadUrl || !clipData.filename) {
            throw new Error('Invalid response from backend: missing downloadUrl or filename.');
        }

        console.log('Received clip data from backend:', clipData);
        sendFeedback('CLIP_PROGRESS', { status: 'Clip ready. Starting download...' });

        // --- Initiate Download --- 
        chrome.downloads.download({
            url: clipData.downloadUrl,
            filename: clipData.filename, // Suggest a filename
            saveAs: true // Prompt user where to save
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                console.error('Download initiation failed:', chrome.runtime.lastError);
                sendFeedback('CLIP_ERROR', { error: `Failed to start download: ${chrome.runtime.lastError.message}` });
            } else {
                console.log(`Download started with ID: ${downloadId}`);
                // Send final completion message
                sendFeedback('CLIP_COMPLETE', { filename: clipData.filename });
            }
        });

      } catch (error) {
        console.error('Error during MAKE_CLIP process:', error);
        sendFeedback('CLIP_ERROR', { error: error.message || 'Unknown error occurred during clipping.' });
      }
    })(); // Immediately invoke the async function

    // Indicate that the response will be sent asynchronously
    return true; 
  }

  // Return false for synchronous message handlers
  return false; 
});

console.log('Service worker loaded and message listener added.');

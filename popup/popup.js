// popup/popup.js

import LLM_API_Utils from './llm_api_utils.js';
import StorageUtils from './storage_utils.js';
import YoutubeTranscriptRetriever from './youtube_transcript_retrival.js'; // New import

// Declare the variables in a higher scope
let transcriptDisplay, processedDisplay, prevBtn, nextBtn, segmentInfo, processBtn, loader, tabButtons, tabContents, openaiApiKeyInput, anthropicApiKeyInput, saveKeysBtn, modelSelect, transcriptInput, loadTranscriptBtn;

let isRawTranscriptVisible = true; // true for 'raw transcript', false for 'processed transcript'
let rawTranscript = ""; // loaded from youtube automatically 
let processedTranscript = ""; // loaded from storage
let rawTranscriptSegments = []; // paginated from raw transcript
let processedTranscriptSegments = []; // paginated from processed transcript
let currentSegmentIndex = 0;
let SEGMENT_DURATION = 15 * 60; // seconds (modifiable)

const llmSystemRole = `Take a raw video transcript and copyedit it into a world-class professionally copyedited transcript.  
Attempt to identify the speaker from the context of the conversation.

# Steps
1. **Speaker Identification**: Identify who is speaking at each segment based on context clues within the transcript.
2. **Copyediting**:
   - Correct any grammatical or typographical errors.
   - Ensure coherence and flow of conversation.
   - Maintain the original meaning while enhancing clarity.
3. **Structure**: Format the transcript with each speaker's name followed by their dialogue.

# Output Format
[Time Range]
[Speaker Name]:
[Dialogue]

**Requirements:**
- **Time Range:** Combine the start and end timestamps in the format [Start Time -> End Time].
- **Speaker Name:** Followed by a colon (:) and a newline.
- **Dialogue:** Starts on a new line beneath the speaker's name. Ensure the dialogue is free of filler words and is professionally phrased.

# Examples
**Example Input:**  
[00:06] uh so um today were going to be talking about, uh, 
[00:12] mental health and, um, ideas of, uh, self with, um, 
[00:15] Dr. Paul Conti. uh welcome."

**Example Output:**  
[00:06 -> 00:15]
Andrew Huberman:
Today we are going to be talking about mental health and ideas of self with Dr. Paul Conti. Welcome.

# Notes
- If unable to identify the speaker, use placeholders such as "Speaker", "Interviewer", "Interviewee", etc. 
- Ensure that the final transcript reads smoothly and professionally while maintaining the integrity of the original dialogue.`;

const llmUtils = new LLM_API_Utils();

/**
 * Initialize the popup with dependency injection
 * @param {Document} doc - The Document object to interact with the DOM.
 * @param {StorageUtils} storageUtils - The StorageUtils instance.
 */
document.addEventListener('DOMContentLoaded', () => initializePopup(document, new StorageUtils()));

/**
 * Initialize the popup by loading API keys and any existing transcripts.
 * @param {Document} doc - The Document object to interact with the DOM.
 * @param {StorageUtils} storageUtils - The StorageUtils instance.
 * @param {YoutubeTranscriptRetriever} youtubeTranscriptRetriever - The YoutubeTranscriptRetriever instance.
 */
async function initializePopup(doc = document, storageUtils = new StorageUtils(), youtubeTranscriptRetriever = new YoutubeTranscriptRetriever()) {
  try {
    // Initialize the variables within the function using dependency injection
    // this is allow for jest testing...lol
    transcriptDisplay = doc.getElementById('transcript-display');
    processedDisplay = doc.getElementById('processed-display');
    prevBtn = doc.getElementById('prev-btn');
    nextBtn = doc.getElementById('next-btn');
    segmentInfo = doc.getElementById('segment-info');
    processBtn = doc.getElementById('process-btn');
    loader = doc.getElementById('loader');
    tabButtons = doc.querySelectorAll('.tab-button');
    tabContents = doc.querySelectorAll('.tab-content');
    openaiApiKeyInput = doc.getElementById('openai-api-key');
    anthropicApiKeyInput = doc.getElementById('anthropic-api-key');
    saveKeysBtn = doc.getElementById('save-keys-btn');
    modelSelect = doc.getElementById('model-select');
    transcriptInput = doc.getElementById('transcript-input');
    loadTranscriptBtn = doc.getElementById('load-transcript-btn');

    await llmUtils.loadApiKeys();
    loadApiKeysIntoUI(doc);
    setupTabs(doc, tabButtons, tabContents);
    setupProcessButton(processBtn, modelSelect, storageUtils);
    setupSaveKeysButton(saveKeysBtn, openaiApiKeyInput, anthropicApiKeyInput);
    setupLoadTranscriptButton(loadTranscriptBtn, transcriptInput, storageUtils);
    setupPagination(prevBtn, nextBtn, segmentInfo);

     // Load existing transcripts if available
     const videoId = await storageUtils.getCurrentYouTubeVideoId();
     console.log(`Current YouTube Video ID: ${videoId}`);
     
     // First try to load from storage
     const savedTranscripts = await storageUtils.loadTranscriptsById(videoId);
     
     // Then try to load from YouTube if needed
     const { youtubeTranscriptStatus, youtubeTranscriptMessage, existingTranscriptStatus, existingTranscriptMessage } = 
       await handleTranscriptRetrieval(videoId, savedTranscripts, youtubeTranscriptRetriever, storageUtils);
 
     // Update status indicator
     const statusIndicator = doc.getElementById('status-indicator');
     statusIndicator.textContent = `${youtubeTranscriptStatus} ${youtubeTranscriptMessage}\n${existingTranscriptStatus} ${existingTranscriptMessage}`;
 
     if (youtubeTranscriptStatus === '✅' || existingTranscriptStatus === '✅') {
       // Hide manual load transcript section
       doc.getElementById('transcript-input-section').classList.add('hidden');
       doc.getElementById('api-section').classList.add('hidden');
       
       // Show other sections
       doc.getElementById('transcript-section').classList.remove('hidden');
       doc.getElementById('content-section').classList.remove('hidden');
       doc.getElementById('actions').classList.remove('hidden');
 
       // Paginate transcripts and update UI
       paginateTranscript(rawTranscript, processedTranscript);
       setRawAndProcessedTranscriptText();
       updatePaginationButtons();
       updateSegmentInfo();
     } else {
       // Show manual load transcript section only if both auto-load methods failed
       doc.getElementById('transcript-input-section').classList.remove('hidden');
       statusIndicator.textContent += "\nUnable to auto-load transcript. Please load manually.";
     }
 
   } catch (error) {
     console.error('Error initializing popup:', error);
     transcriptDisplay.textContent = 'Error initializing popup.';
   }
 }

 async function handleTranscriptRetrieval(videoId, savedTranscripts, youtubeTranscriptRetriever, storageUtils) {
  let youtubeTranscriptStatus = '⏭️';  // Changed to skip emoji
  let youtubeTranscriptMessage = 'Skipped YouTube retrieval (found in storage)';
  let existingTranscriptStatus = '❌';
  let existingTranscriptMessage = 'No existing transcript found.';
  
  // First check if we have saved transcripts
  if (savedTranscripts.rawTranscript) {
    rawTranscript = savedTranscripts.rawTranscript;
    processedTranscript = savedTranscripts.processedTranscript || "";
    existingTranscriptStatus = '✅';
    existingTranscriptMessage = 'Existing transcript loaded from storage.';
    return { youtubeTranscriptStatus, youtubeTranscriptMessage, existingTranscriptStatus, existingTranscriptMessage };
  }
  
  // If no saved transcript, try to fetch from YouTube
  youtubeTranscriptStatus = '❌';  // Reset to failure state before attempting
  youtubeTranscriptMessage = 'Failed to automatically retrieve transcript from YouTube.';
  
  try {
    rawTranscript = await youtubeTranscriptRetriever.fetchParsedTranscript(videoId);
    if (rawTranscript) {
      // Save the newly fetched transcript
      await storageUtils.saveRawTranscriptById(videoId, rawTranscript);
      youtubeTranscriptStatus = '✅';
      youtubeTranscriptMessage = 'Transcript automatically retrieved from YouTube.';
    }
  } catch (ytError) {
    console.error('Error automatically retrieving transcript from YouTube:', ytError);
  }

  return { youtubeTranscriptStatus, youtubeTranscriptMessage, existingTranscriptStatus, existingTranscriptMessage };
}

// Load API keys from storage and populate the UI
function loadApiKeysIntoUI(doc) {
  const openaiApiKeyInput = doc.getElementById('openai-api-key');
  const anthropicApiKeyInput = doc.getElementById('anthropic-api-key');
  openaiApiKeyInput.value = llmUtils.openai_api_key || '';
  anthropicApiKeyInput.value = llmUtils.anthropic_api_key || '';
}

// Save API keys to storage
function setupSaveKeysButton(saveKeysBtn, openaiApiKeyInput, anthropicApiKeyInput) {
  saveKeysBtn.addEventListener('click', async () => {
    const openaiKey = openaiApiKeyInput.value.trim();
    const anthropicKey = anthropicApiKeyInput.value.trim();

    try {
      await LLM_API_Utils.saveApiKeys(openaiKey, anthropicKey);
      await llmUtils.loadApiKeys(); // Reload the keys into the instance
      alert('API Keys saved successfully!');
    } catch (error) {
      console.error('Error saving API keys:', error);
      alert('Failed to save API Keys.');
    }
  });
}

// Setup load transcript button event
function setupLoadTranscriptButton(loadTranscriptBtn, transcriptInput, storageUtils) {
  loadTranscriptBtn.addEventListener('click', handleLoadTranscriptClick.bind(null, transcriptInput, storageUtils));
}



/**
 * Paginate the transcript into segments based on SEGMENT_DURATION.
 * 
 * This function divides both raw and processed transcripts into smaller segments based on a predefined duration.
 * It updates the global rawTranscriptSegments and processedTranscriptSegments arrays, ensuring each segment is 
 * properly formatted with timestamps and text.
 * 
 * @param {Array} rawTranscript - Array of objects with timestamp and text for raw transcript
 * @param {string} processedTranscript - Full processed transcript string
 * @returns {Object} An object containing rawTranscriptSegments and processedTranscriptSegments
 */
function paginateTranscript(rawTranscript, processedTranscript) {
  rawTranscriptSegments = paginateTranscriptHelper(rawTranscript);
  processedTranscriptSegments = paginateProcessedTranscript(processedTranscript);

  // If no segments were created, add a default message
  if (rawTranscriptSegments.length === 0) {
    rawTranscriptSegments.push("No raw transcript available.");
  }
  if (processedTranscriptSegments.length === 0) {
    processedTranscriptSegments.push("No processed transcript available.");
  }

  // Reset the current segment index and update UI
  currentSegmentIndex = 0;
  updateSegmentInfo();
  setRawAndProcessedTranscriptText();
  updatePaginationButtons();

  return { rawTranscriptSegments, processedTranscriptSegments };
}

/**
 * Helper function to paginate a raw transcript
 * 
 * @param {Array} transcript - Array of objects with timestamp and text
 * @returns {Array} Array of paginated transcript segments
 */
function paginateTranscriptHelper(transcript) {
  let segments = [];
  let currentSegment = '';
  let segmentStartTime = 0;
  let segmentEndTime = SEGMENT_DURATION;

  transcript.forEach(item => {
    if (item.timestamp < segmentEndTime) {
      currentSegment += `[${formatTime(item.timestamp)}] ${item.text}\n`;
    } else {
      if (currentSegment) {
        segments.push(currentSegment.trim());
      }
      // Update the segment window
      segmentStartTime = Math.floor(item.timestamp / SEGMENT_DURATION) * SEGMENT_DURATION;
      segmentEndTime = segmentStartTime + SEGMENT_DURATION;
      currentSegment = `[${formatTime(item.timestamp)}] ${item.text}\n`;
    }
  });

  if (currentSegment) {
    segments.push(currentSegment.trim());
  }

  return segments;
}

/**
 * Helper function to paginate a processed transcript
 * 
 * @param {string} processedTranscript - Full processed transcript string
 * @returns {Array} Array of paginated processed transcript segments
 */
function paginateProcessedTranscript(processedTranscript) {
  const lines = processedTranscript.split('\n');
  const paginated = [];
  let currentPage = '';
  let currentDuration = 0;
  let segmentStartTime = 0;
  let segmentEndTime = SEGMENT_DURATION;

  lines.forEach(line => {
    const match = line.match(/\[(\d+):(\d+) -> (\d+):(\d+)\]/);
    if (match) {
      const startMinutes = parseInt(match[1], 10);
      const startSeconds = parseInt(match[2], 10);
      const endMinutes = parseInt(match[3], 10);
      const endSeconds = parseInt(match[4], 10);
      const startTime = startMinutes * 60 + startSeconds;
      const endTime = endMinutes * 60 + endSeconds;
      const duration = endTime - startTime;

      if (startTime >= segmentEndTime) {
        if (currentPage) {
          paginated.push(currentPage.trim());
        }
        // Update the segment window
        segmentStartTime = Math.floor(startTime / SEGMENT_DURATION) * SEGMENT_DURATION;
        segmentEndTime = segmentStartTime + SEGMENT_DURATION;
        currentPage = '';
        currentDuration = 0;
      }

      if (currentDuration + duration > SEGMENT_DURATION) {
        if (currentPage) {
          paginated.push(currentPage.trim());
        }
        currentPage = '';
        currentDuration = 0;
      }

      currentPage += `${line}\n`;
      currentDuration += duration;
    } else {
      currentPage += `${line}\n`;
    }
  });

  if (currentPage.trim().length > 0) {
    paginated.push(currentPage.trim());
  }

  return paginated;
}

// Format time from seconds to mm:ss or hh:mm:ss with two digits for each unit
function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');

  return hrs > 0 ? `${hrs}:${mins}:${secs}` : `${mins}:${secs}`;
}

/**
 * Displays the current segment based on visibility state.
 */
function setRawAndProcessedTranscriptText() {
  // Visibility is handled separately via CSS classes
  transcriptDisplay.textContent = rawTranscriptSegments[currentSegmentIndex] || "No transcript available.";
  processedDisplay.textContent = processedTranscriptSegments[currentSegmentIndex] || "Processed output will appear here.";
}

/**
 * Updates the state of pagination buttons.
 */
function updatePaginationButtons() {
  prevBtn.disabled = currentSegmentIndex === 0;
  nextBtn.disabled = currentSegmentIndex === (getCurrentDisplaySegments().length - 1);
}

/**
 * Retrieves the current set of segments based on the active tab.
 * @returns {Array} Array of current display segments.
 */
function getCurrentDisplaySegments() {
  return isRawTranscriptVisible ? rawTranscriptSegments : processedTranscriptSegments;
}

// Update handleLoadTranscriptClick to remove formatting step
async function handleLoadTranscriptClick(transcriptInput, storageUtils) {
  rawTranscript = transcriptInput.value.trim();
  if (!rawTranscript) {
    console.warn('No transcript entered.');
    alert('Please enter a transcript.');
    return;
  }

  paginateTranscript(rawTranscript, processedTranscript);
  setRawAndProcessedTranscriptText();
  updatePaginationButtons();

  const videoId = await storageUtils.getCurrentYouTubeVideoId();
  if (videoId) {
    try {
      await storageUtils.saveRawTranscriptById(videoId, rawTranscript);
      alert('Transcript loaded and saved successfully!');
    } catch (error) {
      console.error('Error saving raw transcript:', error);
      alert('Failed to save the raw transcript.');
    }
  }
}

// Event handler for previous button click
function handlePrevClick() {
  if (currentSegmentIndex > 0) {
    console.log('prevBtn clicked');
    currentSegmentIndex--;
    setRawAndProcessedTranscriptText();
    updatePaginationButtons();
    updateSegmentInfo();
  }
}

// Event handler for next button click
function handleNextClick() {
  const currentSegments = getCurrentDisplaySegments();
  if (currentSegmentIndex < currentSegments.length - 1) {
    console.log('nextBtn clicked');
    currentSegmentIndex++;
    setRawAndProcessedTranscriptText();
    updatePaginationButtons();
    updateSegmentInfo();
  }
}

/**
 * Sets up pagination button event listeners.
 * @param {HTMLElement} prevBtn - The previous button element.
 * @param {HTMLElement} nextBtn - The next button element.
 */
function setupPagination(prevBtn, nextBtn) {
  // Add event listeners
  prevBtn.addEventListener('click', handlePrevClick);
  nextBtn.addEventListener('click', handleNextClick);
}

/**
 * Updates the segment information display.
 */
function updateSegmentInfo() {
  const currentSegments = getCurrentDisplaySegments();
  segmentInfo.textContent = `Segment ${currentSegmentIndex + 1} of ${currentSegments.length}`;
}

/**
 * Sets up tab switching functionality.
 * @param {Document} doc - The Document object to interact with the DOM.
 * @param {NodeList} tabButtons - The list of tab button elements.
 * @param {NodeList} tabContents - The list of tab content elements.
 */
function setupTabs(doc, tabButtons, tabContents) {
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      tabButtons.forEach(btn => btn.classList.remove('active'));
      // Add active class to clicked button
      button.classList.add('active');

      // Hide all tab contents
      tabContents.forEach(content => content.classList.add('hidden'));

      // Show corresponding tab content
      const tab = button.getAttribute('data-tab');
      const tabContent = doc.getElementById(tab);
      if (tabContent) {
        tabContent.classList.remove('hidden');
      }

      // Update the isRawTranscriptVisible state
      isRawTranscriptVisible = (tab === 'raw');

      // Update the display based on the new state
      setRawAndProcessedTranscriptText();
      updatePaginationButtons();
      updateSegmentInfo();
    });
  });
}

/**
 * Sets up the process button event listener.
 * @param {HTMLElement} processBtn - The process button element.
 * @param {HTMLElement} modelSelect - The model selection element.
 * @param {StorageUtils} storageUtils - The StorageUtils instance.
 */
function setupProcessButton(processBtn, modelSelect, storageUtils) {
  processBtn.addEventListener('click', async () => {
    const selectedModel = modelSelect.value;

    const videoId = await storageUtils.getCurrentYouTubeVideoId();
    if (!videoId) {
      alert('Unable to determine YouTube Video ID.');
      return;
    }

    try {
      const savedTranscripts = await storageUtils.loadTranscriptsById(videoId);
      if (!savedTranscripts.rawTranscript) {
        alert('No raw transcript available to process.');
        return;
      }

      const loader = document.getElementById('loader');
      loader.classList.remove('hidden');

      // Process only the current segment
      const currentRawSegment = rawTranscriptSegments[currentSegmentIndex];

      // Check if the current segment is already processed sufficiently
      if (processedTranscriptSegments[currentSegmentIndex] &&
        processedTranscriptSegments[currentSegmentIndex].split(/\s+/).length >= 100) {
        alert('Current segment is already processed sufficiently.');
        return;
      }

      const response = await llmUtils.call_llm(selectedModel, llmSystemRole, currentRawSegment);

      // Update the processed segment
      processedTranscriptSegments[currentSegmentIndex] = response;

      // Update the display for the current segment
      processedDisplay.textContent = response;

      // Combine all processed segments into a single text block
      processedTranscript = processedTranscriptSegments.join('\n');

      // Save the full processed transcript
      await storageUtils.saveProcessedTranscriptById(videoId, processedTranscript);

      alert('Current segment processed successfully!');

      // Update the display
      setRawAndProcessedTranscriptText();
      updatePaginationButtons();
      updateSegmentInfo();
    } catch (error) {
      console.error('Error processing transcript:', error);
      alert('Failed to process the current segment.');
    } finally {
      const loader = document.getElementById('loader');
      loader.classList.add('hidden');
    }
  });
}

// Export the functions for testing purposes
export {
  initializePopup,
  paginateTranscript,
  handlePrevClick,
  handleNextClick,
  setupProcessButton,
  setupLoadTranscriptButton
};


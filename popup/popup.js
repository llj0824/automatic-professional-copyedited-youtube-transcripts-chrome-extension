// popup/popup.js

import LLM_API_Utils from './llm_api_utils.js';
import StorageUtils from './storage_utils.js';

// Declare the variables in a higher scope
let transcriptDisplay, processedDisplay, prevBtn, nextBtn, segmentInfo, processBtn, loader, tabButtons, tabContents, openaiApiKeyInput, anthropicApiKeyInput, saveKeysBtn, modelSelect, transcriptInput, loadTranscriptBtn;


let isRawTranscriptVisible = true; // true for 'raw transcript', false for 'processed transcript'
let transcript = [];
let rawTranscriptSegments = [];
let processedTranscriptSegments = [];
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
 */
async function initializePopup(doc = document, storageUtils = new StorageUtils()) {
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
    if (videoId) {
      const transcripts = await storageUtils.loadTranscriptsById(videoId);
      if (transcripts.rawTranscript) {
        transcriptInput.value = transcripts.rawTranscript;
        transcriptDisplay.textContent = transcripts.rawTranscript;
        parseTranscript(transcripts.rawTranscript);
        paginateTranscript();
      }
      if (transcripts.processedTranscript) {
        processedTranscriptSegments = paginateProcessedTranscript(transcripts.processedTranscript);
        if (processedTranscriptSegments.length > 0) {
          processedDisplay.textContent = processedTranscriptSegments[0];
        }
      }
      setRawAndProcessedTranscriptText();
      updatePaginationButtons();
      updateSegmentInfo();
    } else {
      console.warn('No YouTube Video ID found.');
    } 
  } catch (error) {
    console.error('Error initializing popup:', error);
    transcriptDisplay.textContent = 'Error initializing popup.';
  }
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
  loadTranscriptBtn.addEventListener('click', async () => {
    const rawTranscript = transcriptInput.value.trim();
    if (!rawTranscript) {
      console.warn('No transcript entered.');
      alert('Please enter a transcript.');
      return;
    }
    parseTranscript(rawTranscript);
    paginateTranscript();
    setRawAndProcessedTranscriptText();
    updatePaginationButtons();

    const videoId = await storageUtils.getCurrentYouTubeVideoId();
    console.log(`Saving transcript for Video ID: ${videoId}`);
    if (videoId) {
      try {
        await storageUtils.saveRawTranscriptById(videoId, rawTranscript);
        alert('Transcript loaded and saved successfully!');
      } catch (error) {
        console.error('Error saving raw transcript:', error);
        alert('Failed to save the raw transcript.');
      }
    }
  });
}

/**
 * Parse the raw transcript into an array of objects with timestamp and text
 * @param {string} rawTranscript 
 * @returns {Array} Array of parsed transcript objects with timestamp and text
 * 
 * This function expects the timestamp in the format [mm:ss] or [hh:mm:ss]
 * It handles both formats and converts them to seconds.
 */
function parseTranscript(rawTranscript) {
  transcript = rawTranscript.split('\n').map(line => {
    // This regex expects timestamps in the format [mm:ss] or [hh:mm:ss]
    const match = line.match(/\[(?:(\d+):)?(\d+):(\d+)\]\s*(.*)/);
    if (match) {
      const hours = parseInt(match[1] || '0', 10); // If hours are not provided, default to 0
      const minutes = parseInt(match[2], 10);
      const seconds = parseInt(match[3], 10);
      const timeInSeconds = hours * 3600 + minutes * 60 + seconds;
      return {
        timestamp: timeInSeconds,
        text: match[4]
      };
    }
    return null;
  }).filter(item => item !== null);
  return transcript;
}
/**
 * Paginate the transcript into segments based on SEGMENT_DURATION.
 * 
 * This function divides the transcript into smaller segments based on a predefined duration. It iterates through each 
 * transcript item, appending it to the current segment if it falls within the segment's time range. If not, it starts 
 * a new segment. The function updates the global segments array, ensuring each segment is properly formatted with 
 * timestamps and text. It also handles cases where no segments are created by adding a default message, and updates 
 * the segment index, segment info, and pagination buttons.
 * 
 * Example:
 * Input: [{ timestamp: 0, text: 'Hello' }, { timestamp: 900, text: 'World' }]
 * Output: ['[00:00] Hello\n', '[15:00] World\n']
 */
function paginateTranscript() {
  rawTranscriptSegments = [];
  let segmentStartTime = 0;
  let segmentEndTime = SEGMENT_DURATION;
  let currentSegment = '';

  // Iterate through each item in the transcript
  transcript.forEach(item => {
    // Check if the item's timestamp is within the current segment
    if (item.timestamp >= segmentStartTime && item.timestamp < segmentEndTime) {
      // Append the formatted timestamp and text to the current segment
      currentSegment += `[${formatTime(item.timestamp)}] ${item.text}\n`;
    } else {
      // Push the current segment to segments array and start a new segment
      if (currentSegment) {
        rawTranscriptSegments.push(currentSegment.trim());
      }
      currentSegment = `[${formatTime(item.timestamp)}] ${item.text}\n`;
      // Move to the next segment
      segmentStartTime = segmentEndTime;
      segmentEndTime += SEGMENT_DURATION;
    }
  });

  // Push the last segment if it exists
  if (currentSegment) {
    rawTranscriptSegments.push(currentSegment.trim());
  }

  // If no segments were created, add a default message
  if (rawTranscriptSegments.length === 0) {
    rawTranscriptSegments.push("No transcript available.");
  }

  // Reset the current segment index and update the segment info
  currentSegmentIndex = 0;
  updateSegmentInfo();
  setRawAndProcessedTranscriptText();
  updatePaginationButtons();

  return rawTranscriptSegments
}

// Format time from seconds to mm:ss with two digits for minutes and seconds
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');

  return `${mins}:${secs}`;
}

/**
 * Paginate the processed transcript into segments based on SEGMENT_DURATION
 * @param {string} processedTranscript 
 * @returns {string[]}
 */
function paginateProcessedTranscript(processedTranscript) {
  const lines = processedTranscript.split('\n');
  const paginated = [];
  let currentPage = '';
  let currentDuration = 0;

  lines.forEach(line => {
    const match = line.match(/\[(\d+):(\d+) -> (\d+):(\d+)\]/);
    if (match) {
      const startMinutes = parseInt(match[1], 10);
      const startSeconds = parseInt(match[2], 10);
      const endMinutes = parseInt(match[3], 10);
      const endSeconds = parseInt(match[4], 10);
      const duration = (endMinutes * 60 + endSeconds) - (startMinutes * 60 + startSeconds);

      if (currentDuration + duration > SEGMENT_DURATION && currentPage.length > 0) {
        paginated.push(currentPage.trim());
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


// Display the current segment or processed segment
function setRawAndProcessedTranscriptText() {
  // Visibility is handled separately via CSS classes
  transcriptDisplay.textContent = rawTranscriptSegments[currentSegmentIndex] || "No transcript available.";
  processedDisplay.textContent = processedTranscriptSegments[currentSegmentIndex] || "Processed output will appear here.";
}

// Update pagination buttons
function updatePaginationButtons() {
  prevBtn.disabled = currentSegmentIndex === 0;
  nextBtn.disabled = currentSegmentIndex === (getCurrentDisplaySegments().length - 1);
}


// Get current display segments based on active tab
function getCurrentDisplaySegments() {
  return isRawTranscriptVisible ? rawTranscriptSegments : processedTranscriptSegments;
}

// Define the event handler functions outside of setupPagination
function handlePrevClick() {
  if (currentSegmentIndex > 0) {
    console.log('prevBtn clicked');
    currentSegmentIndex--;
    setRawAndProcessedTranscriptText();
    updatePaginationButtons();
    updateSegmentInfo();
  }
}

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

// Setup pagination button events
function setupPagination(prevBtn, nextBtn) {
  // Add event listeners
  prevBtn.addEventListener('click', handlePrevClick);
  nextBtn.addEventListener('click', handleNextClick);
}

// Update segment info display
function updateSegmentInfo() {
  const currentSegments = getCurrentDisplaySegments();
  segmentInfo.textContent = `Segment ${currentSegmentIndex + 1} of ${currentSegments.length}`;
}

// Setup tab switching
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
      isRawTranscriptVisible = (tab === 'raw-tab');

      // Update the display based on the new state
      setRawAndProcessedTranscriptText();
      updatePaginationButtons();
      updateSegmentInfo();
    });
  });
}

// Setup process button event
function setupProcessButton(processBtn, modelSelect, storageUtils) {
  processBtn.addEventListener('click', async () => {
    const selectedModel = modelSelect.value;

    const videoId = await storageUtils.getCurrentYouTubeVideoId();
    if (!videoId) {
      alert('Unable to determine YouTube Video ID.');
      return;
    }

    try {
      const transcripts = await storageUtils.loadTranscriptsById(videoId);
      if (!transcripts.rawTranscript) {
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

      // Combine all processed segments and save
      const processedTranscript = processedTranscriptSegments.join('\n\n');
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
export { initializePopup, parseTranscript, paginateTranscript};

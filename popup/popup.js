// popup/popup.js

import LLM_API_Utils from './llm_api_utils.js';
import StorageUtils from './storage_utils.js';

const transcriptDisplay = document.getElementById('transcript-display');
const processedDisplay = document.getElementById('processed-display');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const segmentInfo = document.getElementById('segment-info');
const processBtn = document.getElementById('process-btn');
const loader = document.getElementById('loader');
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const openaiApiKeyInput = document.getElementById('openai-api-key');
const anthropicApiKeyInput = document.getElementById('anthropic-api-key');
const saveKeysBtn = document.getElementById('save-keys-btn');
const modelSelect = document.getElementById('model-select');
const transcriptInput = document.getElementById('transcript-input');
const loadTranscriptBtn = document.getElementById('load-transcript-btn');

let transcript = [];
let segments = [];
let processedSegments = [];
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
const storageUtils = new StorageUtils();

// Initialize the popup
document.addEventListener('DOMContentLoaded', initializePopup);

/**
 * Initialize the popup by loading API keys and any existing transcripts.
 */
async function initializePopup() {
  try {
    await llmUtils.loadApiKeys();
    console.log('about to loadApiKeysIntoUI');
    loadApiKeysIntoUI();
    setupTabs();
    setupPagination();
    setupProcessButton();
    setupSaveKeysButton();
    setupLoadTranscriptButton();

    // Load existing transcripts if available
    const videoId = await storageUtils.getCurrentYouTubeVideoId();
    console.log(`Current YouTube Video ID: ${videoId}`);
    if (videoId) {
      const transcripts = await storageUtils.loadTranscriptsById(videoId);
      console.log('Loaded Transcripts:', transcripts);
      if (transcripts.rawTranscript) {
        transcriptInput.value = transcripts.rawTranscript;
        parseTranscript(transcripts.rawTranscript);
        paginateTranscript();
        displaySegment();
        updatePaginationButtons();
        alert('Raw transcript loaded from storage.');
      }
      if (transcripts.processedTranscript) {
        processedSegments = paginateProcessedTranscript(transcripts.processedTranscript);
        if (processedSegments.length > 0) {
          processedDisplay.textContent = processedSegments[0];
        }
      }
    } else {
      console.warn('No YouTube Video ID found.');
    }
  } catch (error) {
    console.error('Error initializing popup:', error);
    transcriptDisplay.textContent = 'Error initializing popup.';
  }
}

// Load API keys from storage and populate the UI
function loadApiKeysIntoUI() {
  console.log('loadApiKeysIntoUI called.');
  openaiApiKeyInput.value = llmUtils.openai_api_key || '';
  anthropicApiKeyInput.value = llmUtils.anthropic_api_key || '';
}

// Save API keys to storage
function setupSaveKeysButton() {
  console.log('setupSaveKeysButton called.');
  saveKeysBtn.addEventListener('click', async () => {
    console.log('Save Keys button clicked.');
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
function setupLoadTranscriptButton() {
  console.log('setupLoadTranscriptButton called.');
  loadTranscriptBtn.addEventListener('click', async () => {
    console.log('Load Transcript button clicked.');
    const rawTranscript = transcriptInput.value.trim();
    if (!rawTranscript) {
      console.warn('No transcript entered.');
      alert('Please enter a transcript.');
      return;
    }
    parseTranscript(rawTranscript);
    paginateTranscript();
    displaySegment();
    updatePaginationButtons();

    const videoId = await storageUtils.getCurrentYouTubeVideoId();
    console.log(`Saving transcript for Video ID: ${videoId}`);
    if (videoId) {
      try {
        await storageUtils.saveRawTranscriptById(videoId, rawTranscript);
        console.log('Transcript saved successfully.');
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
 */
function parseTranscript(rawTranscript) {
  console.log('parseTranscript called.');
  transcript = rawTranscript.split('\n').map(line => {
    const match = line.match(/\[(\d+):(\d+)\]\s*(.*)/);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const timeInSeconds = minutes * 60 + seconds;
      return {
        timestamp: timeInSeconds,
        text: match[3]
      };
    }
    return null;
  }).filter(item => item !== null);
  console.log('Parsed Transcript:', transcript);
  return transcript
}

// Paginate the transcript into segments based on SEGMENT_DURATION
function paginateTranscript() {
  console.log('paginateTranscript called.');
  segments = [];
  let segmentStartTime = 0;
  let segmentEndTime = SEGMENT_DURATION;

  transcript.forEach(item => {
    if (item.timestamp >= segmentStartTime && item.timestamp < segmentEndTime) {
      if (!segments[segments.length - 1]) {
        segments.push('');
      }
      segments[segments.length - 1] += `[${formatTime(item.timestamp)}] ${item.text}\n`;
    } else if (item.timestamp >= segmentEndTime) {
      segmentStartTime += SEGMENT_DURATION;
      segmentEndTime += SEGMENT_DURATION;
      segments.push(`[${formatTime(item.timestamp)}] ${item.text}\n`);
    }
  });

  if (segments.length === 0) {
    segments.push("No transcript available.");
  }

  currentSegmentIndex = 0;
  updateSegmentInfo();
  console.log('Paginated Segments:', segments);
}

/**
 * Paginate the processed transcript into segments based on SEGMENT_DURATION
 * @param {string} processedTranscript 
 * @returns {string[]}
 */
function paginateProcessedTranscript(processedTranscript) {
  console.log('paginateProcessedTranscript called.');
  const lines = processedTranscript.split('\n');
  const paginated = [];
  let currentPage = '';
  let currentDuration = 0;

  lines.forEach(line => {
    // This regex matches time range patterns in the format [mm:ss -> mm:ss]
    // Examples of matches:
    // - [00:00 -> 00:05]
    // - [12:34 -> 56:78]
    // Examples of non-matches:
    // - [00:00-00:05] (missing spaces around the arrow)
    // - 00:00 -> 00:05 (missing square brackets)
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

// Format time from seconds to mm:ss
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Display the current segment or processed segment
function displaySegment() {
  if (tabContents[0].classList.contains('hidden')) {
    // If not on the processed tab
    transcriptDisplay.textContent = segments[currentSegmentIndex]  || "No transcript available.";
  } else {
    // On the processed tab
    if (processedSegments.length > 0) {
      processedDisplay.textContent = processedSegments[currentSegmentIndex] || "Processed output will appear here.";
    } else {
      processedDisplay.textContent = "Processed output will appear here.";
    }
  }
}

// Update pagination buttons
function updatePaginationButtons() {
  prevBtn.disabled = currentSegmentIndex === 0;
  nextBtn.disabled = currentSegmentIndex === (getCurrentDisplaySegments().length - 1);
}

// Get current display segments based on active tab
function getCurrentDisplaySegments() {
  if (tabContents[0].classList.contains('hidden')) {
    return segments;
  } else {
    return processedSegments;
  }
}

// Setup pagination button events
function setupPagination() {
  prevBtn.addEventListener('click', () => {
    if (currentSegmentIndex > 0) {
      currentSegmentIndex--;
      displaySegment();
      updatePaginationButtons();
      updateSegmentInfo();
    }
  });

  nextBtn.addEventListener('click', () => {
    const currentSegments = getCurrentDisplaySegments();
    if (currentSegmentIndex < currentSegments.length - 1) {
      currentSegmentIndex++;
      displaySegment();
      updatePaginationButtons();
      updateSegmentInfo();
    }
  });
}

// Update segment info display
function updateSegmentInfo() {
  const currentSegments = getCurrentDisplaySegments();
  segmentInfo.textContent = `Segment ${currentSegmentIndex + 1} of ${currentSegments.length}`;
}

// Setup tab switching
function setupTabs() {
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      tabButtons.forEach(btn => btn.classList.remove('active'));
      // Hide all tab contents
      tabContents.forEach(content => content.classList.add('hidden'));
      // Add active class to clicked button
      button.classList.add('active');
      // Show corresponding tab content
      const tab = button.getAttribute('data-tab');
      const tabContent = document.getElementById(tab);
      if (tabContent) {
        tabContent.classList.remove('hidden');
      }
      displaySegment();
      updatePaginationButtons();
      updateSegmentInfo();
    });
  });
}

// Setup process button event
function setupProcessButton() {
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

      // Check if the processedTranscript exists and is sufficient
      if (transcripts.processedTranscript) {
        const totalWords = transcripts.processedTranscript.split(/\s+/).length;
        // Define a threshold for "sufficient" processing
        const wordThreshold = 1000; // Example threshold
        if (totalWords >= wordThreshold) {
          alert('Processed transcript is already sufficient.');
          return;
        }
      }

      loader.classList.remove('hidden');

      let processedTranscript = transcripts.processedTranscript || '';

      // If processed transcript is missing or insufficient, process it
      if (!processedTranscript || processedTranscript.split(/\s+/).length < 1000) {
        const response = await llmUtils.call_llm(selectedModel, llmSystemRole, transcripts.rawTranscript);
        processedTranscript = response;
        await storageUtils.saveProcessedTranscriptById(videoId, processedTranscript);
        processedSegments = paginateProcessedTranscript(processedTranscript);
        alert('Processed transcript updated successfully!');
      }

      // Update the display
      processedSegments = paginateProcessedTranscript(processedTranscript);
      currentSegmentIndex = 0;
      displaySegment();
      updatePaginationButtons();
      updateSegmentInfo();
    } catch (error) {
      console.error('Error processing transcript:', error);
      alert('Failed to process the transcript.');
    } finally {
      loader.classList.add('hidden');
    }
  });
}


// Export the functions for testing purposes
export { initializePopup, parseTranscript, paginateTranscript };
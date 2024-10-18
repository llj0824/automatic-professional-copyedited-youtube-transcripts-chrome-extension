// popup/popup.js

import LLM_API_Utils from './llm_api_utils.js';
import StorageUtils from './storage_utils.js';

// Declare the variables in a higher scope
let transcriptDisplay, processedDisplay, prevBtn, nextBtn, segmentInfo, processBtn, loader, tabButtons, tabContents, openaiApiKeyInput, anthropicApiKeyInput, saveKeysBtn, modelSelect, transcriptInput, loadTranscriptBtn;

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
    setupPagination(prevBtn, nextBtn, segmentInfo);
    setupProcessButton(processBtn, modelSelect, storageUtils);
    setupSaveKeysButton(saveKeysBtn, openaiApiKeyInput, anthropicApiKeyInput);
    setupLoadTranscriptButton(loadTranscriptBtn, transcriptInput, storageUtils);

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
        displayRawOrProcessedSegment();
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
    displayRawOrProcessedSegment();
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
 */
function parseTranscript(rawTranscript) {
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
  return transcript;
}

// Paginate the transcript into segments based on SEGMENT_DURATION
function paginateTranscript() {
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

// Format time from seconds to mm:ss
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Display the current segment or processed segment
function displayRawOrProcessedSegment() {
  if (tabContents[0].classList.contains('hidden')) {
    transcriptDisplay.textContent = segments[currentSegmentIndex]  || "No transcript available.";
  } else {
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
function setupPagination(prevBtn, nextBtn) {
  prevBtn.addEventListener('click', () => {
    if (currentSegmentIndex > 0) {
      currentSegmentIndex--;
      displayRawOrProcessedSegment();
      updatePaginationButtons();
      updateSegmentInfo();
    }
  });

  nextBtn.addEventListener('click', () => {
    const currentSegments = getCurrentDisplaySegments();
    if (currentSegmentIndex < currentSegments.length - 1) {
      currentSegmentIndex++;
      displayRawOrProcessedSegment();
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
function setupTabs(doc, tabButtons, tabContents) {
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
      const tabContent = doc.getElementById(tab);
      if (tabContent) {
        tabContent.classList.remove('hidden');
      }
      displayRawOrProcessedSegment();
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

      const loader = document.getElementById('loader');
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
      displayRawOrProcessedSegment();
      updatePaginationButtons();
      updateSegmentInfo();
    } catch (error) {
      console.error('Error processing transcript:', error);
      alert('Failed to process the transcript.');
    } finally {
      const loader = document.getElementById('loader');
      loader.classList.add('hidden');
    }
  });
}

// Export the functions for testing purposes
export { initializePopup, parseTranscript, paginateTranscript };

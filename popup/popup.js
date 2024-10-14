// popup/popup.js

import { LLM_API_Utils } from './llm_api_utils.js';

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
let currentSegmentIndex = 0;
const SEGMENT_DURATION = 15 * 60; // mins

const llmSystemRole = `Take a raw video transcript and copyedit it into a world-class professionally copyedit transcript.  
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
- **Dialogue:** Starts on a new line beneath the speakers name. Ensure the dialogue is free of filler words and is professionally phrased.

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

// Initialize the popup
document.addEventListener('DOMContentLoaded', initializePopup);

async function initializePopup() {
  try {
    await llmUtils.loadApiKeys();
    loadApiKeysIntoUI();
    setupTabs();
    setupPagination();
    setupProcessButton();
    setupSaveKeysButton();
    setupLoadTranscriptButton();
  } catch (error) {
    console.error('Error initializing popup:', error);
    transcriptDisplay.textContent = 'Error initializing popup.';
  }
}

// Load API keys from storage and populate the UI
function loadApiKeysIntoUI() {
  openaiApiKeyInput.value = llmUtils.openai_api_key || '';
  anthropicApiKeyInput.value = llmUtils.anthropic_api_key || '';
}

// Save API keys to storage
function setupSaveKeysButton() {
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
function setupLoadTranscriptButton() {
  loadTranscriptBtn.addEventListener('click', () => {
    const rawTranscript = transcriptInput.value.trim();
    if (!rawTranscript) {
      alert('Please enter a transcript.');
      return;
    }
    parseTranscript(rawTranscript);
    paginateTranscript();
    displaySegment();
    updatePaginationButtons();
    alert('Transcript loaded successfully!');
  });
}

// Function to fetch and process the transcript (Removed automatic retrieval)

// Parse the raw transcript into an array of objects with timestamp and text
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
}

// Paginate the transcript into 20-minute segments
function paginateTranscript() {
  segments = [];
  let segmentStartIndex = 0;

  while (segmentStartIndex < transcript.length) {
    const segmentEndTime = transcript[segmentStartIndex].timestamp + SEGMENT_DURATION;
    let endIndex = transcript.findIndex(item => item.timestamp > segmentEndTime, segmentStartIndex);
    if (endIndex === -1) endIndex = transcript.length;

    const segment = transcript.slice(segmentStartIndex, endIndex)
      .map(item => `[${formatTime(item.timestamp)}] ${item.text}`)
      .join('\n');
    segments.push(segment);
    segmentStartIndex = endIndex;
  }

  if (segments.length === 0) {
    segments.push("No transcript available.");
  }

  currentSegmentIndex = 0;
  updateSegmentInfo();
}

// Format time from seconds to mm:ss
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Display the current segment
function displaySegment() {
  transcriptDisplay.textContent = segments[currentSegmentIndex];
  processedDisplay.textContent = "Processed output will appear here.";
}

// Update pagination buttons
function updatePaginationButtons() {
  prevBtn.disabled = currentSegmentIndex === 0;
  nextBtn.disabled = currentSegmentIndex === segments.length - 1;
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
    if (currentSegmentIndex < segments.length - 1) {
      currentSegmentIndex++;
      displaySegment();
      updatePaginationButtons();
      updateSegmentInfo();
    }
  });
}

// Update segment info display
function updateSegmentInfo() {
  segmentInfo.textContent = `Segment ${currentSegmentIndex + 1} of ${segments.length}`;
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
    });
  });
}

// Setup process button event
function setupProcessButton() {
  processBtn.addEventListener('click', async () => {
    const selectedModel = modelSelect.value;

    const currentSegment = segments[currentSegmentIndex];
    if (!currentSegment || currentSegment === "No transcript available.") {
      alert('No transcript segment to process.');
      return;
    }

    loader.classList.remove('hidden');
    processedDisplay.textContent = "Processing...";

    try {
      const processedOutput = await llmUtils.call_llm(selectedModel, llmSystemRole, currentSegment);
      processedDisplay.textContent = processedOutput;
    } catch (error) {
      processedDisplay.textContent = "Error processing with LLM.";
      console.error('LLM processing error:', error);
    } finally {
      loader.classList.add('hidden');
    }
  });
}

// Format timestamp in seconds to mm:ss
function formatTimestamp(startSeconds) {
  const mins = Math.floor(startSeconds / 60);
  const secs = Math.floor(startSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
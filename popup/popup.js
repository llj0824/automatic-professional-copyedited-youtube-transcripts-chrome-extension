// popup/popup.js

import LLM_API_Utils from './llm_api_utils.js';
import StorageUtils from './storage_utils.js';
import YoutubeTranscriptRetriever from './youtube_transcript_retrival.js';
import Logger from './logger.js';

// Instantiate utilities
const llmUtils = new LLM_API_Utils();
const storageUtils = new StorageUtils();
const youtubeTranscriptRetriever = new YoutubeTranscriptRetriever(); // Instantiate retriever
const logger = new Logger(storageUtils); 

// Global variables for DOM elements and state
let transcriptDisplay, processedDisplay, prevBtn, nextBtn, pageInfo, processBtn, loader, tabButtons, tabContents, modelSelect, transcriptInput, loadTranscriptBtn;
// Add clip buttons to global scope
let clipBtnRaw, clipBtnProcessed;
// Add status div
let clipStatusDiv;

// Max clip duration (e.g., 10 minutes)
const MAX_CLIP_DURATION_SECONDS = 10 * 60;

// Add this near other global variables
const TabState = {
  RAW: 'raw',
  PROCESSED: 'processed',
  HIGHLIGHTS: 'highlights'
};

// Replace the three boolean variables with a single state
let currentTab = TabState.RAW;

let isRawTranscriptVisible = true; // true for 'raw transcript', false for 'processed transcript'
let rawTranscript = ""; // loaded from youtube automatically 
let processedTranscript = ""; // loaded from storage
let rawTranscriptPages = []; // paginated from raw transcript
let processedTranscriptPages = []; // paginated from processed transcript
let currentPageIndex = 0;
let PAGE_DURATION = 30 * 60; // seconds (modifiable)

// Add these variables to the top-level declarations
let fontSizeDecrease, fontSizeIncrease;
let currentFontSize = 12; // Default font size in px

// Add these variables to the top-level declarations
let generateHighlightsBtn;
let highlightsPromptDisplay, highlightsProcessedDisplay, highlightsResultsDisplay;

// Add a variable to store highlights pages
let highlightsPages = [];

// Add to global variables section
let resetTranscriptBtn;

//==============================================================================
//                         INITIALIZATION FUNCTIONS 
//==============================================================================

// Call it immediately in browser environment
if (typeof document !== 'undefined') {
  setupPopup();
}

/**
 * Initialize the popup by loading API keys and any existing transcripts.
 * @param {Document} doc - The Document object to interact with the DOM.
 * @param {StorageUtils} storageUtils - The StorageUtils instance.
 * @param {YoutubeTranscriptRetriever} youtubeTranscriptRetriever - The YoutubeTranscriptRetriever instance.
 */
async function initializePopup(doc = document, storageUtils = new StorageUtils()) {
  try {
    // Initialize the variables within the function using dependency injection
    // this is allow for jest testing...lol
    transcriptDisplay = doc.getElementById('transcript-display');
    processedDisplay = doc.getElementById('processed-display');
    highlightsPromptDisplay = doc.getElementById('highlight-prompt');
    highlightsProcessedDisplay = doc.getElementById('highlight-processed');
    highlightsResultsDisplay = doc.getElementById('highlight-results');
    prevBtn = doc.getElementById('prev-btn');
    nextBtn = doc.getElementById('next-btn');
    pageInfo = doc.getElementById('page-info');
    processBtn = doc.getElementById('process-btn');
    generateHighlightsBtn = doc.getElementById('generate-highlights-btn');
    loader = doc.getElementById('loader');
    tabButtons = doc.querySelectorAll('.tab-button');
    tabContents = doc.querySelectorAll('.tab-content');
    modelSelect = doc.getElementById('model-select');
    transcriptInput = doc.getElementById('transcript-input');
    loadTranscriptBtn = doc.getElementById('load-transcript-btn');
    resetTranscriptBtn = doc.getElementById('reset-transcript-btn');

    // Add new element declarations
    fontSizeDecrease = doc.getElementById('font-size-decrease');
    fontSizeIncrease = doc.getElementById('font-size-increase');

    // Assign clip buttons
    clipBtnRaw = doc.getElementById('clip-btn-raw');
    clipBtnProcessed = doc.getElementById('clip-btn-processed');

    // Assign status div
    clipStatusDiv = doc.getElementById('clip-status-message');

    setupTabs(doc, tabButtons, tabContents);
    setupProcessButton(processBtn, modelSelect, storageUtils);
    setupLoadTranscriptButton(loadTranscriptBtn, transcriptInput, storageUtils);
    setupPagination(prevBtn, nextBtn, pageInfo);

    // Load existing transcripts if available
    const videoId = await storageUtils.getCurrentYouTubeVideoId();

    console.log(`Current YouTube Video ID: ${videoId}`);
    logger.logEvent(Logger.EVENTS.EXTENSION_OPENED, {
      [Logger.FIELDS.VIDEO_ID]: videoId
    });

    // First try to load from storage
    const savedTranscripts = await storageUtils.loadTranscriptsById(videoId);

    // Then try to load from YouTube if needed
    const { isCached, isLoadedFromYoutube } = await retrieveAndSetTranscripts(videoId, savedTranscripts, storageUtils);
    const { youtubeTranscriptStatus, youtubeTranscriptMessage, existingTranscriptStatus, existingTranscriptMessage } = getTranscriptStatus(isCached, isLoadedFromYoutube);

    // Load highlights for current page
    const highlightResultsTextarea = doc.getElementById('highlight-results');
    if (highlightResultsTextarea) {
      try {
        const savedHighlights = await storageUtils.loadHighlightsById(videoId, currentPageIndex);
        if (savedHighlights) {
          highlightsPages[currentPageIndex] = savedHighlights;
          highlightResultsTextarea.value = savedHighlights;
        }
      } catch (error) {
        console.error('Error loading highlights:', error);
      }
    }

    paginateBothTranscripts(rawTranscript, processedTranscript);

    // handle showing UI elements based on auto-load transcript success status
    handleTranscriptLoadingStatus(youtubeTranscriptStatus, youtubeTranscriptMessage, existingTranscriptStatus, existingTranscriptMessage);

    // Add copy button functionality
    setupCopyButtons(doc);

    // Add new setup call
    setupFontSizeControls(fontSizeDecrease, fontSizeIncrease, storageUtils);

    setupGenerateHighlightsButton(generateHighlightsBtn, storageUtils);

    setupClearTranscriptButton(resetTranscriptBtn, storageUtils,videoId);

    // Add setup for clip buttons
    setupClipButtons(doc, transcriptDisplay, processedDisplay, clipBtnRaw, clipBtnProcessed);

    // Initialize highlight prompt with default text from LLM API Utils
    const highlightPromptTextarea = doc.getElementById('highlight-prompt');
    if (highlightPromptTextarea) {
      highlightPromptTextarea.value = llmUtils.llm_highlights_system_role;
    }

    // Initialize highlight processed textarea with processed display content
    const highlightProcessedTextarea = doc.getElementById('highlight-processed');
    if (highlightProcessedTextarea && processedDisplay) {
      highlightProcessedTextarea.value = processedDisplay.textContent;
    }

    // Add message listener for feedback from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('Received message in popup:', message);
      if (message.type === 'CLIP_COMPLETE') {
        showClipStatusMessage(`Clip ready! Download started for ${message.payload.filename}.`, false);
        // Find the correct button to reset (assuming only one clip runs at a time)
        const buttonToReset = document.getElementById('clip-btn-raw') || document.getElementById('clip-btn-processed');
        if (buttonToReset) {
          buttonToReset.textContent = "Clip ▶︎";
          // Re-enable based on current selection state
          handleTextSelection(document.getElementById('transcript-display'), document.getElementById('processed-display'), document.getElementById('clip-btn-raw'), document.getElementById('clip-btn-processed'));
        }
        sendResponse({ status: 'Message received by popup' });
      } else if (message.type === 'CLIP_ERROR') {
        showClipStatusMessage(`Error creating clip: ${message.payload.error}`, true);
        const buttonToReset = document.getElementById('clip-btn-raw') || document.getElementById('clip-btn-processed');
        if (buttonToReset) {
          buttonToReset.textContent = "Clip ▶︎";
          // Re-enable based on current selection state
          handleTextSelection(document.getElementById('transcript-display'), document.getElementById('processed-display'), document.getElementById('clip-btn-raw'), document.getElementById('clip-btn-processed'));
        }
         sendResponse({ status: 'Error message received by popup' });
      } else if (message.type === 'CLIP_PROGRESS') { // Optional: Handle progress later
          showClipStatusMessage(`Clipping in progress: ${message.payload.status || 'Processing...'}`, false);
          // Keep button disabled during progress
           sendResponse({ status: 'Progress message received by popup' });
      }
      // Important: Return true to indicate you wish to send a response asynchronously
      // (if you were planning to sendResponse later)
      // However, for simple acknowledgements, sending synchronously is fine.
      return false; 
    });

  } catch (error) {
    console.error('Error initializing popup:', error);
    transcriptDisplay.textContent = 'Error initializing popup.';
  }
}

//==============================================================================
//                         SETUP FUNCTIONS
//==============================================================================

function setupPopup() {
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => initializePopup());
  }
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
      const tab = button.getAttribute('data-tab');
      logger.logEvent(Logger.EVENTS.TAB_SWITCH, {
        [Logger.FIELDS.TAB_NAME]: tab
      });

      // Remove active class from all buttons
      tabButtons.forEach(btn => btn.classList.remove('active'));
      // Add active class to clicked button
      button.classList.add('active');

      // Hide all tab contents
      tabContents.forEach(content => content.classList.add('hidden'));

      // Show corresponding tab content
      const tabContent = doc.getElementById(tab);
      if (tabContent) {
        tabContent.classList.remove('hidden');
      }
      // on processed tab show processBtn, on highlights tab show generateHighlightsBtn
      const processBtn = doc.getElementById('process-btn');
      const generateHighlightsBtn = doc.getElementById('generate-highlights-btn');

      // Update visibility state
      currentTab = tab;
      const isProcessedPageExists = Boolean(processedTranscriptPages[currentPageIndex])
      switch (currentTab) {
        case TabState.RAW:
          // Case 1: On Raw tab, show processBtn
          processBtn.classList.remove('hidden');
          generateHighlightsBtn.classList.add('hidden');
          break;
        case TabState.PROCESSED:
          // Case 2: On Processed tab, show generateHighlightsBtn only if there's a processed page
          processBtn.classList.remove('hidden');
          generateHighlightsBtn.classList.toggle('hidden', !isProcessedPageExists);
          break;
        case TabState.HIGHLIGHTS:
          // Case 3: on highlights tab, only show generateHighlightsBtn
          processBtn.classList.add('hidden');
          generateHighlightsBtn.classList.remove('hidden');
          break;
      }

      // Update the display based on the new state
      paginateBothTranscripts(); // Use existing pagination function to update display
      updatePaginationButtons();
      updatePageInfo();
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
  processBtn.addEventListener('click', () => handleProcessTranscriptClick(modelSelect, storageUtils));
}

// Setup load transcript button event
function setupLoadTranscriptButton(loadTranscriptBtn, transcriptInput, storageUtils) {
  loadTranscriptBtn.addEventListener('click', () => handleLoadTranscriptClick(transcriptInput, storageUtils)); // Fixed: Ensure handler exists
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

function setupCopyButtons(doc) {
  const copyButtons = doc.querySelectorAll('.copy-btn');
  copyButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const targetId = button.getAttribute('data-target');
      const targetElement = doc.getElementById(targetId);
      const textToCopy = targetElement.textContent;
      logger.logEvent(Logger.EVENTS.COPY_ATTEMPT, {
        [Logger.FIELDS.COPY_TARGET]: targetId,
        [Logger.FIELDS.TRANSCRIPT_LENGTH]: targetElement.textContent.length
      });

      try {
        await navigator.clipboard.writeText(textToCopy);
        logger.logEvent(Logger.EVENTS.COPY_SUCCESS, {
          [Logger.FIELDS.COPY_TARGET]: targetId
        });
        const originalText = button.textContent;
        button.textContent = '✅ Copied!';
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      } catch (err) {
        logger.logEvent(Logger.EVENTS.ERROR, {
          [Logger.FIELDS.ERROR_TYPE]: 'copy_failure',
          [Logger.FIELDS.ERROR_MESSAGE]: err.message,
          [Logger.FIELDS.COPY_TARGET]: targetId
        });
        console.error('Failed to copy text:', err);
        button.textContent = '❌ Failed';
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      }
    });
  });
}

function setupFontSizeControls(decreaseBtn, increaseBtn, storageUtils) {
  // Load saved font size when initializing
  (async () => {
    try {
      currentFontSize = await storageUtils.loadFontSize();
      updateFontSize();
    } catch (error) {
      console.error('Error loading font size:', error);
    }
  })();

  decreaseBtn.addEventListener('click', async () => {
    if (currentFontSize > 8) { // Minimum font size
      currentFontSize -= 2;
      updateFontSize();
      try {
        await storageUtils.saveFontSize(currentFontSize);
      } catch (error) {
        console.error('Error saving font size:', error);
      }
    }
  });

  increaseBtn.addEventListener('click', async () => {
    if (currentFontSize < 24) { // Maximum font size
      currentFontSize += 2;
      updateFontSize();
      try {
        await storageUtils.saveFontSize(currentFontSize);
      } catch (error) {
        console.error('Error saving font size:', error);
      }
    }
  });
}

function setupGenerateHighlightsButton(generateHighlightsBtn, storageUtils) {
  generateHighlightsBtn.addEventListener('click', () => handleGenerateHighlightsClick(storageUtils));
}

function setupClearTranscriptButton(resetTranscriptBtn, storageUtils, videoId) {
  resetTranscriptBtn.addEventListener('click', async () => {
    try {
      // Show loader
      loader.classList.remove('hidden');

      // Remove existing transcripts from storage
      await storageUtils.removeTranscriptsById(videoId);

      // Fetch fresh transcript from YouTube
      const freshTranscript = await YoutubeTranscriptRetriever.fetchParsedTranscript(videoId);
      
      // Save new transcript
      await storageUtils.saveRawTranscriptById(videoId, freshTranscript);

      // Update UI
      rawTranscript = freshTranscript;
      processedTranscript = ""; // Reset processed transcript
      
      // Re-paginate and update display
      paginateBothTranscripts(rawTranscript, processedTranscript);
      setRawAndProcessedTranscriptText();
      updatePaginationButtons();
      updatePageInfo();

      alert('Transcript refreshed successfully!');
    } catch (error) {
      console.error('Error refreshing transcript:', error);
      alert(`Failed to refresh transcript: ${error.message}`);
    } finally {
      loader.classList.add('hidden');
    }
  });
}

/**
 * Sets up clip button event listeners and initial state.
 * @param {Document} doc - The Document object.
 * @param {HTMLElement} rawDisplay - The raw transcript display element.
 * @param {HTMLElement} processedDisplay - The processed transcript display element.
 * @param {HTMLElement} rawBtn - The raw transcript clip button.
 * @param {HTMLElement} processedBtn - The processed transcript clip button.
 */
function setupClipButtons(doc, rawDisplay, processedDisplay, rawBtn, processedBtn) {
  const storageUtils = new StorageUtils(); // Need storage utils for video ID

  // Initial check
  handleTextSelection(rawDisplay, processedDisplay, rawBtn, processedBtn);

  // Check selection on mouseup within the popup
  doc.addEventListener('mouseup', () => {
    handleTextSelection(rawDisplay, processedDisplay, rawBtn, processedBtn);
  });

  // Also check when switching tabs, as selection might persist but apply to the newly visible tab
  doc.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
      // Use a small delay to allow tab switch to complete
      setTimeout(() => handleTextSelection(rawDisplay, processedDisplay, rawBtn, processedBtn), 50);
    });
  });

  // Add click listener for the raw clip button
  if (rawBtn) {
    rawBtn.addEventListener('click', () => handleClipButtonClick(rawBtn, storageUtils));
  }

  // Placeholder for processed button click listener (if needed later)
  // if (processedBtn) {
  //   processedBtn.addEventListener('click', () => { /* ... */ });
  // }
}

/**
 * Handles enabling/disabling clip buttons based on text selection within transcript areas.
 * Refines logic for raw transcript to check duration.
 * @param {HTMLElement} rawDisplay - The raw transcript display element.
 * @param {HTMLElement} processedDisplay - The processed transcript display element.
 * @param {HTMLElement} rawBtn - The raw transcript clip button.
 * @param {HTMLElement} processedBtn - The processed transcript clip button.
 */
function handleTextSelection(rawDisplay, processedDisplay, rawBtn, processedBtn) {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  let isSelectionInRaw = false;
  let isSelectionInProcessed = false;
  let startTime = null;
  let endTime = null;
  let durationOk = false;
  let errorMessage = "Select text in the transcript to enable clipping"; // Default title

  if (selectedText.length > 0 && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);

    // Check if selection is within the raw transcript display
    if (rawDisplay.contains(range.startContainer) && rawDisplay.contains(range.endContainer)) {
      isSelectionInRaw = true;

      // Attempt to find start and end timestamps within the raw display's *current* page content
      const pageContent = rawDisplay.textContent;
      const selectionStartIndex = pageContent.indexOf(selectedText);
      const selectionEndIndex = selectionStartIndex + selectedText.length;

      if (selectionStartIndex !== -1) {
         // Find the last timestamp *before* or *at* the start of the selection
         const textBeforeSelection = pageContent.substring(0, selectionStartIndex);
         const startMatches = [...textBeforeSelection.matchAll(/\[(\d{1,2}:)?\d{1,2}:\d{2}\]/g)];
         if (startMatches.length > 0) {
            startTime = parseTimeToSeconds(startMatches[startMatches.length - 1][0]);
         }

         // Find the last timestamp *before* or *at* the end of the selection
         const textUpToEndOfSelection = pageContent.substring(0, selectionEndIndex);
         const endMatches = [...textUpToEndOfSelection.matchAll(/\[(\d{1,2}:)?\d{1,2}:\d{2}\]/g)];
         if (endMatches.length > 0) {
            endTime = parseTimeToSeconds(endMatches[endMatches.length - 1][0]);
         }

         // If timestamps are valid, check duration
         if (startTime !== null && endTime !== null && endTime >= startTime) {
            const duration = endTime - startTime;
            if (duration <= MAX_CLIP_DURATION_SECONDS) {
               durationOk = true;
               errorMessage = `Clip selection (${formatTime(startTime)} - ${formatTime(endTime)})`;
            } else {
               errorMessage = `Clip duration (${formatTime(duration)}) exceeds maximum (${formatTime(MAX_CLIP_DURATION_SECONDS)})`;
            }
         } else {
            errorMessage = "Could not determine valid start/end times for selection";
         }
      } else {
        errorMessage = "Error finding selection within transcript content";
      }

    } else if (processedDisplay.contains(range.startContainer) && processedDisplay.contains(range.endContainer)) {
      // Keep processed transcript logic simple for now
      isSelectionInProcessed = true;
    }
  }

  // Enable/disable raw clip button
  if (rawBtn) {
    rawBtn.disabled = !(isSelectionInRaw && durationOk);
    rawBtn.title = isSelectionInRaw ? errorMessage : "Select text in the raw transcript to enable clipping";

    // Store valid start/end times in dataset if duration is ok
    if (isSelectionInRaw && durationOk) {
      rawBtn.dataset.startTime = startTime;
      rawBtn.dataset.endTime = endTime;
    } else {
      delete rawBtn.dataset.startTime;
      delete rawBtn.dataset.endTime;
    }
  }

  // Enable/disable processed clip button
  if (processedBtn) {
     // Currently, just checks if selection is within processed display
    processedBtn.disabled = !(isSelectionInProcessed && selectedText.length > 0);
    processedBtn.title = isSelectionInProcessed && selectedText.length > 0 ? "Clip ▶︎" : "Select text in the processed transcript to enable clipping"; // Basic title
  }
}

/**
 * Handles the click event for the Clip button.
 * @param {HTMLElement} button - The button element that was clicked.
 * @param {StorageUtils} storageUtils - Instance of StorageUtils.
 */
async function handleClipButtonClick(button, storageUtils) {
  const videoId = await storageUtils.getCurrentYouTubeVideoId();
  const startTime = button.dataset.startTime;
  const endTime = button.dataset.endTime;

  if (!videoId) {
    console.error("Clip Error: Could not get video ID.");
    alert("Error: Could not determine the video ID for clipping.");
    return;
  }

  if (startTime === undefined || endTime === undefined) {
    console.error("Clip Error: Start or end time not found in button dataset.");
    alert("Error: Could not retrieve start/end times for clipping. Please reselect text.");
    return;
  }

  // Basic feedback: Disable button and change text
  button.disabled = true;
  button.textContent = "Clipping...";
  showClipStatusMessage("Clipping started...", false); // Show initial status

  console.log(`Sending MAKE_CLIP: videoId=${videoId}, start=${startTime}, end=${endTime}`);
  logger.logEvent(Logger.EVENTS.CLIP_START, {
    [Logger.FIELDS.VIDEO_ID]: videoId,
    [Logger.FIELDS.CLIP_START_TIME]: startTime,
    [Logger.FIELDS.CLIP_END_TIME]: endTime
  });

  // Send message to background script
  chrome.runtime.sendMessage(
    { 
      type: 'MAKE_CLIP', 
      payload: { 
        videoId: videoId, 
        start: parseFloat(startTime),
        end: parseFloat(endTime)
      }
    },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error sending MAKE_CLIP message:', chrome.runtime.lastError);
        logger.logEvent(Logger.EVENTS.CLIP_ERROR, {
            [Logger.FIELDS.VIDEO_ID]: videoId,
            [Logger.FIELDS.ERROR_TYPE]: 'sendMessage',
            [Logger.FIELDS.ERROR_MESSAGE]: chrome.runtime.lastError.message
        });
        alert(`Error initiating clip: ${chrome.runtime.lastError.message}`);
        // Reset button state on error
        button.textContent = "Clip ▶︎";
        // Re-enable based on current selection state (might need re-evaluation)
        handleTextSelection(document.getElementById('transcript-display'), document.getElementById('processed-display'), document.getElementById('clip-btn-raw'), document.getElementById('clip-btn-processed'));
      } else {
        console.log('MAKE_CLIP message sent successfully, response:', response);
        // Background script will handle further feedback (CLIP_COMPLETE/CLIP_ERROR)
        // Button state will be reset by feedback handling later
      }
    }
  );
}

/**
 * Displays a status message related to the clipping process.
 * @param {string} message - The message to display.
 * @param {boolean} isError - True if the message represents an error.
 */
function showClipStatusMessage(message, isError) {
  if (clipStatusDiv) {
    clipStatusDiv.textContent = message;
    clipStatusDiv.className = isError ? 'status-message error' : 'status-message success'; // Use classes for styling
    clipStatusDiv.classList.remove('hidden'); // Make sure it's visible

    // Optional: Auto-hide after a delay for non-error messages
    if (!isError) {
      setTimeout(() => {
        if (clipStatusDiv.textContent === message) { // Only hide if message hasn't changed
           clipStatusDiv.classList.add('hidden');
           clipStatusDiv.textContent = '';
        }
      }, 5000); // Hide after 5 seconds
    }
  }
}

//==============================================================================
//                            GETTERS & UTILITIES
//==============================================================================

/**
 * Parses time string HH:MM:SS or MM:SS into seconds.
 * @param {string} timeString - The time string (e.g., "[1:23:45]" or "[59:10]").
 * @returns {number|null} Total seconds or null if invalid format.
 */
function parseTimeToSeconds(timeString) {
  if (!timeString) return null;
  // Remove brackets
  const cleanedTimeString = timeString.replace(/\[|\]/g, '');
  const parts = cleanedTimeString.split(':').map(Number);

  try {
    if (parts.length === 3) {
      // HH:MM:SS
      const [h, m, s] = parts;
      if (isNaN(h) || isNaN(m) || isNaN(s)) return null;
      return h * 3600 + m * 60 + s;
    } else if (parts.length === 2) {
      // MM:SS
      const [m, s] = parts;
       if (isNaN(m) || isNaN(s)) return null;
      return m * 60 + s;
    } else {
      return null; // Invalid format
    }
  } catch (error) {
    console.error(`Error parsing time string "${timeString}":`, error);
    return null;
  }
}

/**
 * Formats time in seconds to a string in the format MM:SS or HH:MM:SS.
 * @param {number} seconds - The time in seconds.
 * @returns {string} The formatted time string.
 */
function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00";
  }
  const totalSeconds = Math.round(seconds);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  const paddedS = String(s).padStart(2, '0');
  const paddedM = String(m).padStart(2, '0');

  if (h > 0) {
    const paddedH = String(h).padStart(2, '0');
    return `${paddedH}:${paddedM}:${paddedS}`;
  }
  return `${paddedM}:${paddedS}`;
}



//==============================================================================
//                            TRANSCRIPT PROCESSING
//==============================================================================

/**
 * Splits the transcript into pages based on a time duration.
 * Very basic implementation: Assumes lines start with timestamps like [HH:MM:SS].
 * Needs refinement for accurate time parsing and handling lines without timestamps.
 * @param {string} transcriptText - The full transcript text.
 * @returns {string[]} An array of strings, each representing a page.
 */
function splitTranscriptIntoPages(transcriptText) {
    if (!transcriptText) return [];

    const lines = transcriptText.trim().split('\n');
    const pages = [];
    let currentPageLines = [];
    let currentPageStartTime = -1;
    const timeRegex = /\[(\d{1,2}):(\d{1,2}):(\d{1,2})\.?\d*\]/; // Basic HH:MM:SS format - Correctly escaped

    for (const line of lines) {
        const match = line.match(timeRegex);
        let lineTime = -1;

        if (match) {
            const hours = parseInt(match[1], 10);
            const minutes = parseInt(match[2], 10);
            const seconds = parseInt(match[3], 10);
            lineTime = hours * 3600 + minutes * 60 + seconds;
        }

        // Start a new page if this line has a timestamp and either:
        // 1. It's the first line with a timestamp.
        // 2. It exceeds the page duration relative to the page's start time.
        if (lineTime !== -1) {
            if (currentPageStartTime === -1) {
                currentPageStartTime = lineTime;
                currentPageLines.push(line);
            } else if (lineTime >= currentPageStartTime + PAGE_DURATION) {
                // Finalize the current page
                pages.push(currentPageLines.join('\n'));
                // Start a new page
                currentPageLines = [line];
                currentPageStartTime = lineTime;
            } else {
                currentPageLines.push(line);
            }
        } else {
            // Add lines without timestamps to the current page if one has started
            if (currentPageStartTime !== -1) {
                 currentPageLines.push(line);
            }
            // Handle lines before the first timestamp if necessary
        }
    }

    // Add the last page if it has content
    if (currentPageLines.length > 0) {
        pages.push(currentPageLines.join('\n'));
    }
    
    // If no timestamps were found, return the whole transcript as one page
    if (pages.length === 0 && lines.length > 0) {
        return [transcriptText];
    }

    return pages;
}

/**
 * Retrieves transcripts from storage or YouTube, updates global state, and saves if fetched.
 * @param {string} videoId - The YouTube video ID.
 * @param {object|null} savedTranscripts - Transcripts loaded from storage ({ rawTranscript, processedTranscript }).
 * @param {StorageUtils} storageUtils - The StorageUtils instance.
 * @returns {Promise<{isCached: boolean, isLoadedFromYoutube: boolean}>} Status indicators.
 */
async function retrieveAndSetTranscripts(videoId, savedTranscripts, storageUtils) {
  let isCached = false;
  let isLoadedFromYoutube = false;

  if (savedTranscripts && savedTranscripts.rawTranscript) {
    console.log('Loading transcript from cache for video ID:', videoId);
    rawTranscript = savedTranscripts.rawTranscript;
    processedTranscript = savedTranscripts.processedTranscript || ''; // Use saved processed or empty
    isCached = true;
    logger.logEvent(Logger.EVENTS.TRANSCRIPT_LOADED_FROM_CACHE, { [Logger.FIELDS.VIDEO_ID]: videoId });
  } else {
    console.log('No cached transcript found, attempting to fetch from YouTube for video ID:', videoId);
    try {
      rawTranscript = await youtubeTranscriptRetriever.getTranscript(videoId);
      if (rawTranscript) {
        console.log('Successfully fetched transcript from YouTube.');
        isLoadedFromYoutube = true;
        processedTranscript = ''; // Reset processed transcript when fetching new raw one
        // Save the fetched transcript
        await storageUtils.saveTranscript(videoId, rawTranscript, processedTranscript);
        logger.logEvent(Logger.EVENTS.TRANSCRIPT_FETCHED_FROM_YOUTUBE, { [Logger.FIELDS.VIDEO_ID]: videoId });
      } else {
        console.log('Transcript not available from YouTube.');
        rawTranscript = 'Transcript not available for this video.';
        processedTranscript = '';
        logger.logEvent(Logger.EVENTS.TRANSCRIPT_FETCH_FAILED, { 
            [Logger.FIELDS.VIDEO_ID]: videoId,
            [Logger.FIELDS.REASON]: 'Not available from YouTube API'
        });
      }
    } catch (error) {
      console.error('Error fetching transcript from YouTube:', error);
      rawTranscript = `Error fetching transcript: ${error.message}`;
      processedTranscript = '';
      logger.logEvent(Logger.EVENTS.ERROR, { 
          [Logger.FIELDS.ERROR_TYPE]: 'youtube_fetch_error',
          [Logger.FIELDS.ERROR_MESSAGE]: error.message,
          [Logger.FIELDS.VIDEO_ID]: videoId
      });
      // Optionally, re-throw or handle differently if needed
    }
  }

  // Update global page arrays (important to do AFTER setting rawTranscript/processedTranscript)
  rawTranscriptPages = rawTranscript ? splitTranscriptIntoPages(rawTranscript) : [];
  processedTranscriptPages = processedTranscript ? splitTranscriptIntoPages(processedTranscript) : [];

  return { isCached, isLoadedFromYoutube };
}

/**
 * Handles the click event for the load transcript button.
 * Fetches transcript based on user input (URL or Video ID).
 * @param {HTMLInputElement} transcriptInput - The input element for URL/ID.
 * @param {StorageUtils} storageUtils - The StorageUtils instance.
 */
async function handleLoadTranscriptClick(transcriptInput, storageUtils) {
  const inputValue = transcriptInput.value.trim();
  if (!inputValue) {
    alert('Please enter a YouTube Video ID or URL.');
    return;
  }

  let videoId = null;
  try {
    // Try parsing as URL
    if (inputValue.includes('youtube.com') || inputValue.includes('youtu.be')) {
      const url = new URL(inputValue);
      if (url.hostname === 'youtu.be') {
        videoId = url.pathname.substring(1);
      } else if (url.hostname.includes('youtube.com')) {
        videoId = url.searchParams.get('v');
      }
    } else {
      // Assume it's a video ID if not a recognizable URL
      // Basic validation: YT IDs are typically 11 chars, but let's be lenient
      if (inputValue.length > 5 && !inputValue.includes(' ')) { 
        videoId = inputValue;
      }
    }
  } catch (error) {
    console.error('Error parsing video ID/URL:', error);
    alert('Invalid YouTube URL or Video ID provided.');
    return;
  }

  if (!videoId) {
    alert('Could not extract Video ID from the input.');
    return;
  }

  console.log(`Attempting to load transcript for manually entered Video ID: ${videoId}`);
  logger.logEvent(Logger.EVENTS.MANUAL_TRANSCRIPT_LOAD_ATTEMPT, { [Logger.FIELDS.VIDEO_ID]: videoId });

  // Show loader or processing state
  const loader = document.getElementById('loader');
  if (loader) loader.classList.remove('hidden');
  transcriptDisplay.textContent = 'Loading transcript...';
  processedDisplay.textContent = '';
  if (clipStatusDiv) clipStatusDiv.classList.add('hidden'); // Hide clip status

  try {
    // Reset current state before loading new transcript
    rawTranscript = '';
    processedTranscript = '';
    rawTranscriptPages = [];
    processedTranscriptPages = [];
    currentPageIndex = 0;

    // Try loading from storage first
    const savedTranscripts = await storageUtils.loadTranscriptsById(videoId);

    // Then try loading from YouTube
    const { isCached, isLoadedFromYoutube } = await retrieveAndSetTranscripts(videoId, savedTranscripts, storageUtils);
    const { youtubeTranscriptStatus, youtubeTranscriptMessage, existingTranscriptStatus, existingTranscriptMessage } = getTranscriptStatus(isCached, isLoadedFromYoutube);

    // Update UI after loading
    paginateBothTranscripts();
    handleTranscriptLoadingStatus(youtubeTranscriptStatus, youtubeTranscriptMessage, existingTranscriptStatus, existingTranscriptMessage);
    updatePaginationButtons();
    updatePageInfo();

    logger.logEvent(Logger.EVENTS.MANUAL_TRANSCRIPT_LOAD_SUCCESS, { [Logger.FIELDS.VIDEO_ID]: videoId });

  } catch (error) {
    console.error('Error loading transcript manually:', error);
    transcriptDisplay.textContent = `Error loading transcript: ${error.message}`;
    processedDisplay.textContent = '';
    handleTranscriptLoadingStatus(false, `Error: ${error.message}`, false, ''); // Show error status
    logger.logEvent(Logger.EVENTS.MANUAL_TRANSCRIPT_LOAD_ERROR, { 
        [Logger.FIELDS.VIDEO_ID]: videoId,
        [Logger.FIELDS.ERROR_MESSAGE]: error.message
    });
  } finally {
    if (loader) loader.classList.add('hidden');
  }
}

//==============================================================================
//                            EVENT HANDLERS
//==============================================================================

/**
 * Handles the click event for the 'Previous' pagination button.
 */
function handlePrevClick() {
  if (currentPageIndex > 0) {
    currentPageIndex--;
    paginateBothTranscripts();
    updatePaginationButtons();
    updatePageInfo();
    logger.logEvent(Logger.EVENTS.PAGINATION_PREV, { [Logger.FIELDS.PAGE_NUMBER]: currentPageIndex + 1 });
  }
}

/**
 * Handles the click event for the 'Next' pagination button.
 */
function handleNextClick() {
  // Determine the total number of pages based on the currently active tab
  let totalPages = 0;
  if (currentTab === TabState.RAW || currentTab === TabState.PROCESSED) {
    totalPages = Math.max(rawTranscriptPages.length, processedTranscriptPages.length);
  } else if (currentTab === TabState.HIGHLIGHTS) {
    totalPages = highlightsPages.length;
    // Note: If highlights are not yet generated, totalPages will be 0.
    // The updatePaginationButtons function should handle disabling 'Next' correctly.
  }

  if (currentPageIndex < totalPages - 1) {
    currentPageIndex++;
    paginateBothTranscripts(); // Handles raw/processed display
    // If on highlights tab, might need specific update logic if paginateBothTranscripts isn't sufficient
    // For now, assume highlights display updates are handled elsewhere or within paginateBothTranscripts implicitly
    updatePaginationButtons();
    updatePageInfo();
    logger.logEvent(Logger.EVENTS.PAGINATION_NEXT, { [Logger.FIELDS.PAGE_NUMBER]: currentPageIndex + 1 });
  }
}

/**
 * Determines status messages based on how transcripts were loaded.
 * @param {boolean} isCached - Was the transcript loaded from storage?
 * @param {boolean} isLoadedFromYoutube - Was the transcript fetched from YouTube?
 * @returns {object} Status messages for UI.
 */
function getTranscriptStatus(isCached, isLoadedFromYoutube) {
    let youtubeTranscriptStatus = false;
    let youtubeTranscriptMessage = '';
    let existingTranscriptStatus = false;
    let existingTranscriptMessage = '';

    if (isLoadedFromYoutube) {
        youtubeTranscriptStatus = true;
        youtubeTranscriptMessage = 'Transcript fetched from YouTube.';
    } else if (!isCached && !isLoadedFromYoutube) {
         // Case where fetch failed or no transcript available
         youtubeTranscriptStatus = false;
         // Use the actual transcript content if it indicates an error/status
         if (rawTranscript && (rawTranscript.startsWith('Error') || rawTranscript.includes('not available'))) {
            youtubeTranscriptMessage = rawTranscript;
         } else {
            youtubeTranscriptMessage = 'Could not fetch transcript from YouTube.';
         }
    }

    if (isCached) {
        existingTranscriptStatus = true;
        existingTranscriptMessage = 'Transcript loaded from cache.';
    }

    return { youtubeTranscriptStatus, youtubeTranscriptMessage, existingTranscriptStatus, existingTranscriptMessage };
}

/**
 * Updates the UI based on the transcript loading status.
 * @param {boolean} youtubeStatus - Success status of YouTube fetch.
 * @param {string} youtubeMessage - Message related to YouTube fetch.
 * @param {boolean} existingStatus - Success status of loading from cache.
 * @param {string} existingMessage - Message related to cache load.
 */
function handleTranscriptLoadingStatus(youtubeStatus, youtubeMessage, existingStatus, existingMessage) {
    const statusElement = document.getElementById('transcript-status');
    if (!statusElement) return;

    let finalMessage = '';
    if (existingStatus) {
        finalMessage = existingMessage;
    } else if (youtubeStatus) {
        finalMessage = youtubeMessage;
    } else {
        finalMessage = youtubeMessage || 'Transcript status unknown.'; // Fallback message
    }

    statusElement.textContent = finalMessage;
    statusElement.className = (existingStatus || youtubeStatus) ? 'status-message status-success' : 'status-message status-error'; 
    statusElement.classList.remove('hidden');

    // Show/hide buttons based on whether a valid transcript is loaded
    const transcriptAvailable = (existingStatus || youtubeStatus) && rawTranscript && !rawTranscript.startsWith('Error') && !rawTranscript.includes('not available');
    if (processBtn) processBtn.style.display = transcriptAvailable ? 'inline-block' : 'none';
    // Only show highlights button if processed transcript exists
    if (generateHighlightsBtn) generateHighlightsBtn.style.display = transcriptAvailable && processedTranscript ? 'inline-block' : 'none'; 
    if (resetTranscriptBtn) resetTranscriptBtn.style.display = transcriptAvailable ? 'inline-block' : 'none';
    // Hide manual load elements if transcript is available
    if (transcriptInput) transcriptInput.style.display = transcriptAvailable ? 'none' : 'inline-block'; 
    if (loadTranscriptBtn) loadTranscriptBtn.style.display = transcriptAvailable ? 'none' : 'inline-block';
    // Show pagination if transcript available and paginated
    const paginationControls = document.getElementById('pagination-controls');
    if (paginationControls) {
        paginationControls.classList.toggle('hidden', !(transcriptAvailable && Math.max(rawTranscriptPages.length, processedTranscriptPages.length) > 1));
    }
}

/**
 * Updates the text content of the transcript display areas based on the current page.
 */
function paginateBothTranscripts() {
    const rawPageContent = rawTranscriptPages[currentPageIndex] || '';
    const processedPageContent = processedTranscriptPages[currentPageIndex] || '';

    if (transcriptDisplay) {
        transcriptDisplay.textContent = rawPageContent;
    }
    if (processedDisplay) {
        processedDisplay.textContent = processedPageContent;
    }
    // Handle highlights pagination 
    const highlightResultsTextarea = document.getElementById('highlight-results');
    if (highlightResultsTextarea && currentTab === TabState.HIGHLIGHTS) {
       highlightResultsTextarea.value = highlightsPages[currentPageIndex] || '';
    }
    // Update other UI elements dependent on pagination
    updatePaginationButtons();
    updatePageInfo();
    updateFontSize(); // Apply font size to new content
}

/**
 * Updates the enabled/disabled state of pagination buttons.
 */
function updatePaginationButtons() {
  if (!prevBtn || !nextBtn) return;

  let totalPages = 0;
   if (currentTab === TabState.RAW || currentTab === TabState.PROCESSED) {
        totalPages = Math.max(rawTranscriptPages.length, processedTranscriptPages.length);
   } else if (currentTab === TabState.HIGHLIGHTS) {
        totalPages = highlightsPages.length;
   }

  prevBtn.disabled = currentPageIndex <= 0;
  nextBtn.disabled = currentPageIndex >= totalPages - 1;

   // Hide controls entirely if only one page or zero pages
   const paginationControls = document.getElementById('pagination-controls');
   if (paginationControls) {
       paginationControls.classList.toggle('hidden', totalPages <= 1);
   }
}


/**
 * Updates the page information display (e.g., "Page 1 of 3").
 */
function updatePageInfo() {
  if (!pageInfo) return;

  let totalPages = 0;
   if (currentTab === TabState.RAW || currentTab === TabState.PROCESSED) {
        totalPages = Math.max(rawTranscriptPages.length, processedTranscriptPages.length);
   } else if (currentTab === TabState.HIGHLIGHTS) {
        totalPages = highlightsPages.length;
   }

  if (totalPages > 0) {
    pageInfo.textContent = `Page ${currentPageIndex + 1} of ${totalPages}`;
    pageInfo.classList.remove('hidden'); 
  } else {
    pageInfo.textContent = ''; 
    pageInfo.classList.add('hidden');
  }
}

//==============================================================================
//                            EVENT HANDLERS
//==============================================================================


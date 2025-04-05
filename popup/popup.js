// popup/popup.js

import LLM_API_Utils from './llm_api_utils.js';
import StorageUtils from './storage_utils.js';
import YoutubeTranscriptRetriever from './youtube_transcript_retrival.js';
import Logger from './logger.js';
import TwitterClient from './twitterClient.js';


//==============================================================================
//                              GLOBAL VARIABLES
//==============================================================================

// Declare the variables in a higher scope
let transcriptDisplay, processedDisplay, prevBtn, nextBtn, pageInfo, processBtn, loader, tabButtons, tabContents, modelSelect, transcriptInput, loadTranscriptBtn;
let pushToTwitterBtn;

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

const llmUtils = new LLM_API_Utils();
const logger = new Logger();

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

const twitterClient = new TwitterClient();

// Add Twitter Login UI elements
let twitterLoginSection, twitterUsernameInput, twitterPasswordInput, twitterLoginBtn, twitterLoginStatus;


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
    await twitterClient.initialize(); // Initialize Twitter client and load session

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
    pushToTwitterBtn = doc.getElementById('push-to-twitter-btn');
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

    // Initialize Twitter Login UI elements
    twitterLoginSection = doc.getElementById('twitter-login-section');
    twitterUsernameInput = doc.getElementById('twitter-username');
    twitterPasswordInput = doc.getElementById('twitter-password');
    twitterLoginBtn = doc.getElementById('twitter-login-btn');
    twitterLoginStatus = doc.getElementById('twitter-login-status');

    setupTabs(doc, tabButtons, tabContents);
    setupProcessButton(processBtn, modelSelect, storageUtils);
    setupLoadTranscriptButton(loadTranscriptBtn, transcriptInput, storageUtils);
    setupPagination(prevBtn, nextBtn, pageInfo);
    setupPushToTwitterButton(pushToTwitterBtn, storageUtils);
    setupTwitterLoginButton(twitterLoginBtn);

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

    // First paginate the raw transcript
    paginateRawTranscript(rawTranscript);

    // Load processed pages individually
    processedTranscriptPages = new Array(rawTranscriptPages.length).fill(""); // Initialize array
    for (let i = 0; i < rawTranscriptPages.length; i++) {
      try {
        const page = await storageUtils.loadProcessedPageById(videoId, i);
        if (page) {
          processedTranscriptPages[i] = page;
        }
      } catch (error) {
        console.error(`Error loading processed page ${i}:`, error);
      }
    }

    // Load highlights for the initial current page (index 0)
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

    // handle showing UI elements based on auto-load transcript success status
    handleTranscriptLoadingStatus(youtubeTranscriptStatus, youtubeTranscriptMessage, existingTranscriptStatus, existingTranscriptMessage);

    // Add copy button functionality
    setupCopyButtons(doc);

    // Add new setup call
    setupFontSizeControls(fontSizeDecrease, fontSizeIncrease, storageUtils);

    setupGenerateHighlightsButton(generateHighlightsBtn, storageUtils);

    setupClearTranscriptButton(resetTranscriptBtn, storageUtils,videoId);

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

  } catch (error) {
    console.error('Error initializing popup:', error);
    transcriptDisplay.textContent = 'Error initializing popup.';
  }
}

//==============================================================================
//                             SETUP FUNCTIONS
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
      setRawAndProcessedTranscriptText();
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
  loadTranscriptBtn.addEventListener('click', handleLoadTranscriptClick.bind(null, transcriptInput, storageUtils));
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

function setupPushToTwitterButton(button, storageUtils) {
  if (button) {
    button.addEventListener('click', () => handlePushToTwitterClick(storageUtils));
  } else {
    console.warn('Push to Twitter button not found during setup.');
  }
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
      paginateRawTranscript(rawTranscript);
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

// Add setup function for Twitter login button
function setupTwitterLoginButton(button) {
   if (button) {
       button.addEventListener('click', handleTwitterLoginClick);
   } else {
       console.warn('Twitter login button not found during setup.');
   }
}

//==============================================================================
//                            EVENT HANDLERS
//==============================================================================


function handleTranscriptLoadingStatus(youtubeStatus, youtubeMessage, existingStatus, existingMessage) {
  const statusMessage = `YouTube Transcript: ${youtubeStatus} ${youtubeMessage}\nExisting Transcript: ${existingStatus} ${existingMessage}`;
  window.alert(statusMessage);

  if (youtubeStatus === '✅' || existingStatus === '✅') {
    // Hide manual load transcript section
    document.getElementById('transcript-input-section').classList.add('hidden');

    // Show other sections
    document.getElementById('transcript-section').classList.remove('hidden');
    document.getElementById('content-section').classList.remove('hidden');
    document.getElementById('actions').classList.remove('hidden'); // TODO: if processed transcripts is avaliable, hide process button

    // update UI
    setRawAndProcessedTranscriptText();
    updatePaginationButtons();
    updatePageInfo();
  } else {
    // Show manual load transcript section only if both auto-load methods failed
    document.getElementById('transcript-input-section').classList.remove('hidden');
    window.alert("Unable to auto-load transcript. Please load manually.");
  }
}

// Update handleLoadTranscriptClick to remove formatting step
async function handleLoadTranscriptClick(transcriptInput, storageUtils) {
  rawTranscript = transcriptInput.value.trim();
  if (!rawTranscript) {
    console.warn('No transcript entered.');
    alert('Please enter a transcript.');
    return;
  }

  paginateRawTranscript(rawTranscript);
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
  if (currentPageIndex > 0) {
    logger.logEvent(Logger.EVENTS.PAGE_NAVIGATION, {
      [Logger.FIELDS.NAVIGATION_DIRECTION]: 'prev',
      [Logger.FIELDS.PAGE_INDEX]: currentPageIndex - 1
    });
    currentPageIndex--;
    setRawAndProcessedTranscriptText();
    updatePaginationButtons();
    updatePageInfo();
    loadHighlightsForCurrentPage();
  }
}

// Event handler for next button click
function handleNextClick() {
  const currentPages = getCurrentDisplayPagesNumbers();
  if (currentPageIndex < currentPages.length - 1) {
    logger.logEvent(Logger.EVENTS.PAGE_NAVIGATION, {
      [Logger.FIELDS.NAVIGATION_DIRECTION]: 'next',
      [Logger.FIELDS.PAGE_INDEX]: currentPageIndex + 1
    });
    currentPageIndex++;
    setRawAndProcessedTranscriptText();
    updatePaginationButtons();
    updatePageInfo();
    loadHighlightsForCurrentPage();
  }
}


/**
 * Handles processing the transcript when the process button is clicked.
 * @param {HTMLElement} modelSelect - The model selection element.
 * @param {StorageUtils} storageUtils - The StorageUtils instance.
 */
async function handleProcessTranscriptClick(modelSelect, storageUtils) {
  const selectedModel = modelSelect.value;

  const currentRawPage = rawTranscriptPages[currentPageIndex];
  const videoTitle = extractVideoTitle(currentRawPage);
  const videoId = await storageUtils.getCurrentYouTubeVideoId();

  // Log process attempt
  logger.logEvent(Logger.EVENTS.PROCESS_TRANSCRIPT_START, {
    [Logger.FIELDS.VIDEO_TITLE]: videoTitle,
    [Logger.FIELDS.VIDEO_ID]: videoId,
    [Logger.FIELDS.MODEL]: selectedModel,
    [Logger.FIELDS.PAGE_INDEX]: currentPageIndex,
    [Logger.FIELDS.TRANSCRIPT_LENGTH]: rawTranscriptPages[currentPageIndex].length
  });

  if (!videoId) {
    logger.logEvent(Logger.EVENTS.ERROR, {
      [Logger.FIELDS.ERROR_TYPE]: 'missing_video_id',
      [Logger.FIELDS.ERROR_MESSAGE]: 'Unable to determine YouTube Video ID'
    });
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

    // Get the current raw page
    const currentRawPage = rawTranscriptPages[currentPageIndex];

    const startTime = Date.now();
    const processedPage = await llmUtils.processTranscriptInParallel({
      transcript: currentRawPage,
      model_name: selectedModel,
      partitions: llmUtils.DEFAULT_PARTITIONS
    });
    const processingTime = Date.now() - startTime;

    // Log successful processing
    logger.logEvent(Logger.EVENTS.PROCESS_TRANSCRIPT_SUCCESS, {
      [Logger.FIELDS.VIDEO_TITLE]: videoTitle,
      [Logger.FIELDS.VIDEO_ID]: videoId,
      [Logger.FIELDS.MODEL]: selectedModel,
      [Logger.FIELDS.PROCESSING_TIME]: processingTime,
      [Logger.FIELDS.TRANSCRIPT_LENGTH]: currentRawPage.length,
      [Logger.FIELDS.RESPONSE_LENGTH]: processedPage.length,
    });

    // Log processed transcript result
    logger.logEvent(Logger.EVENTS.PROCESS_TRANSCRIPT_RESULT, {
      [Logger.FIELDS.VIDEO_TITLE]: videoTitle,
      [Logger.FIELDS.VIDEO_ID]: videoId,
      [Logger.FIELDS.PAGE_INDEX]: currentPageIndex,
      [Logger.FIELDS.PROCESSED_TRANSCRIPT]: processedPage
    });

    // Update the processed page in memory
    processedTranscriptPages[currentPageIndex] = processedPage;
    // Update the display directly with the new page content
    // processedDisplay.textContent = processedPage; // This happens in setRawAndProcessedTranscriptText

    // Save the current processed page individually
    await storageUtils.saveProcessedPageById(videoId, currentPageIndex, processedPage);

    alert('Current page processed successfully!');

    // Update the display
    setRawAndProcessedTranscriptText();
    updatePaginationButtons();
    updatePageInfo();
  } catch (error) {
    logger.logEvent(Logger.EVENTS.PROCESS_TRANSCRIPT_FAILURE, {
      [Logger.FIELDS.ERROR_TYPE]: error.name,
      [Logger.FIELDS.ERROR_MESSAGE]: error.message,
      [Logger.FIELDS.MODEL]: selectedModel,
      [Logger.FIELDS.VIDEO_TITLE]: videoTitle,
      [Logger.FIELDS.VIDEO_ID]: videoId,
    });
    console.error('Error processing transcript:', error);
    alert('Failed to process the current page.');
  } finally {
    loader.classList.add('hidden');
  }
}
async function handleGenerateHighlightsClick(storageUtils) {
  const currentRawPage = rawTranscriptPages[currentPageIndex];
  const videoTitle = extractVideoTitle(currentRawPage);
  const videoId = await storageUtils.getCurrentYouTubeVideoId();

  if (!videoId) {
    alert('Unable to determine YouTube Video ID.');
    return;
  }

  const selectedModel = modelSelect.value;
  const highlightPrompt = document.getElementById('highlight-prompt').value;
  const highlightProcessed = document.getElementById('highlight-processed').value;

  if (!highlightProcessed || highlightProcessed.trim() === "") {
    alert('No processed transcript available to generate highlights.');
    return;
  }

  logger.logEvent(Logger.EVENTS.HIGHLIGHTS_GENERATION_START, {
    [Logger.FIELDS.VIDEO_ID]: videoId,
    [Logger.FIELDS.PAGE_INDEX]: currentPageIndex,
    [Logger.FIELDS.TRANSCRIPT_LENGTH]: highlightProcessed.length,
  });

  try {
    loader.classList.remove('hidden');

    const highlightForPage = await llmUtils.generateHighlights({
      processedTranscript: highlightProcessed,
      customPrompt: highlightPrompt
    });

    // Save highlights for current page
    highlightsPages[currentPageIndex] = highlightForPage;
    
    // Update both the processed textarea and results textarea
    const highlightProcessedTextarea = document.getElementById('highlight-processed');
    const highlightResultsTextarea = document.getElementById('highlight-results');
    if (highlightResultsTextarea) {
      highlightResultsTextarea.value = highlightForPage;
    }

    // Save the highlights for this specific page
    await storageUtils.saveHighlightsById(videoId, currentPageIndex, highlightForPage);

    logger.logEvent(Logger.EVENTS.HIGHLIGHTS_GENERATION_SUCCESS, {
      [Logger.FIELDS.VIDEO_ID]: videoId,
      [Logger.FIELDS.VIDEO_TITLE]: videoTitle,
      [Logger.FIELDS.HIGHLIGHTS_GENERATION_RESULT]: highlightForPage,
      [Logger.FIELDS.PAGE_INDEX]: currentPageIndex,
      [Logger.FIELDS.HIGHLIGHTS_LENGTH]: highlightForPage.length,
    });

    alert('Highlights generated successfully!');
  } catch (error) {
    logger.logEvent(Logger.EVENTS.HIGHLIGHTS_GENERATION_FAILURE, {
      [Logger.FIELDS.ERROR_TYPE]: error.name,
      [Logger.FIELDS.ERROR_MESSAGE]: error.message,
      [Logger.FIELDS.MODEL]: selectedModel,
      [Logger.FIELDS.VIDEO_ID]: videoId,
    });
    console.error('Error generating highlights:', error);
    alert('Failed to generate highlights for the current page.');
  } finally {
    loader.classList.add('hidden');
  }
}

// Update loadHighlightsForCurrentPage to properly set the textarea value
async function loadHighlightsForCurrentPage() {
  const videoId = await storageUtils.getCurrentYouTubeVideoId();
  if (!videoId) return;

  const highlightResultsTextarea = document.getElementById('highlight-results');
  if (!highlightResultsTextarea) {
    console.warn('Highlight results textarea not found.');
    return;
  }

  // Clear current highlights before loading new ones
  highlightResultsTextarea.value = "";
  // Clear memory as well
  // highlightsPages[currentPageIndex] = ""; // Let's load first, then update

  try {
    console.log(`Loading highlights for video ${videoId}, page ${currentPageIndex}`);
    const savedHighlights = await storageUtils.loadHighlightsById(videoId, currentPageIndex);
    if (savedHighlights) {
      console.log(`Highlights found for page ${currentPageIndex}, updating display.`);
      highlightsPages[currentPageIndex] = savedHighlights; // Update memory
      highlightResultsTextarea.value = savedHighlights; // Update UI
    } else {
      console.log(`No highlights found in storage for page ${currentPageIndex}.`);
       highlightsPages[currentPageIndex] = ""; // Ensure memory is cleared if nothing found
       highlightResultsTextarea.value = ""; // Ensure UI is cleared
    }
  } catch (error) {
    console.error('Error loading highlights for current page:', error);
    // Optionally clear UI/memory on error too
     highlightsPages[currentPageIndex] = "";
     highlightResultsTextarea.value = "";
  }
}

//==============================================================================
//                            GETTERS & UTILITIES
//==============================================================================

/**
 * Retrieves the current set of pages based on the active tab.
 * @returns {Array} Array of current display pages.
 */
function getCurrentDisplayPagesNumbers() {
  // note: let's always use number of raw pages.
  return rawTranscriptPages
}


function getTranscriptStatus(isCached, isLoadedFromYoutube) {
  let youtubeTranscriptStatus = '⏭️';
  let youtubeTranscriptMessage = 'Skipped YouTube retrieval (found in storage)';
  let existingTranscriptStatus = '❌';
  let existingTranscriptMessage = 'No existing transcript found.';

  if (isCached) {
    existingTranscriptStatus = '✅';
    existingTranscriptMessage = 'Existing transcript loaded from storage.';
  } else if (isLoadedFromYoutube) {
    youtubeTranscriptStatus = '✅';
    youtubeTranscriptMessage = 'Transcript automatically retrieved from YouTube.';
  } else {
    youtubeTranscriptStatus = '❌';
    youtubeTranscriptMessage = 'Failed to automatically retrieve transcript from YouTube.';
  }

  return {
    youtubeTranscriptStatus,
    youtubeTranscriptMessage,
    existingTranscriptStatus,
    existingTranscriptMessage
  };
}


/**
 * Extracts the video title from a transcript page's context block
 * @param {string} rawTranscriptPage - The transcript page containing the context block
 * @returns {string} The extracted title or an error message
 */
function extractVideoTitle(rawTranscriptPage) {
  try {
    if (!rawTranscriptPage || typeof rawTranscriptPage !== 'string') {
      throw new Error(`Invalid transcript page: ${typeof rawTranscriptPage}`);
    }

    // The regex pattern breakdown:
    // Title:          - Matches the literal text "Title:"
    // \s*            - Matches zero or more whitespace characters (spaces, tabs, newlines)
    // ([^*\n]+)      - Capture group that matches:
    //                  [^*\n] = any character that is NOT an asterisk or newline
    //                  + = one or more of these characters
    //                  This ensures we stop at the next section (marked by ***) or next line
    const titleMatch = rawTranscriptPage.match(/Title:\s*([^*\n]+)/);
    if (!titleMatch) {
      throw new Error('No title pattern found in context block');
    }

    return titleMatch[1];
  } catch (error) {
    return `Failed to retrieve title - ${error.message}`;
  }
}

// Format time from seconds to mm:ss or hh:mm:ss with two digits for each unit
function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');

  return hrs > 0 ? `${hrs}:${mins}:${secs}` : `${mins}:${secs}`;
}

//==============================================================================
//                            TRANSCRIPT PROCESSING
//==============================================================================



async function retrieveAndSetTranscripts(videoId, savedTranscripts, storageUtils) {
  // Inner function to handle all transcript cleaning/decoding html verbage
  const decodeTranscript = (text) => {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ');
  };

  // First check if we have saved transcripts
  if (savedTranscripts.rawTranscript) {
    rawTranscript = savedTranscripts.rawTranscript;
    // processedTranscript = savedTranscripts.processedTranscript || ""; // REMOVED - will load per page
    return { isCached: true, isLoadedFromYoutube: false };
  }

  // If no saved transcript, try to fetch from YouTube
  try {
    const fetchedRawTranscript = await YoutubeTranscriptRetriever.fetchParsedTranscript(videoId);
    rawTranscript = decodeTranscript(fetchedRawTranscript);
    if (rawTranscript) {
      await storageUtils.saveRawTranscriptById(videoId, rawTranscript);
      // processedTranscript = ""; // Reset processed transcript // REMOVED - will load per page
      return { isCached: false, isLoadedFromYoutube: true };
    }
  } catch (ytError) {
    console.error('Error automatically retrieving transcript from YouTube:', ytError);
  }

  return { isCached: false, isLoadedFromYoutube: false };
}


/**
 * Paginate the transcript into pages based on PAGE_DURATION.
 * 
 * This function divides both raw and processed transcripts into smaller pages based on a predefined duration.
 * It updates the global rawTranscriptPages and processedTranscriptPages arrays, ensuring each page is 
 * properly formatted with timestamps and text.
 * 
 * @param {Array} rawTranscript - Array of objects with timestamp and text for raw transcript
 * @param {string} processedTranscript - Full processed transcript string
 * @returns {Object} An object containing rawTranscriptPages and processedTranscriptPages
 */
function paginateBothTranscripts(rawTranscript, processedTranscript) {
  rawTranscriptPages = paginateRawTranscript(rawTranscript);
  processedTranscriptPages = paginateProcessedTranscript(processedTranscript);

  // If no pages were created, add a default message
  if (rawTranscriptPages.length === 0) {
    rawTranscriptPages.push("No raw transcript available.");
  }
  if (processedTranscriptPages.length === 0) {
    processedTranscriptPages.push("No processed transcript available.");
  }

  // Reset the current page index and update UI
  currentPageIndex = 0;
  updatePageInfo();
  setRawAndProcessedTranscriptText();
  updatePaginationButtons();

  return { rawTranscriptPages, processedTranscriptPages };
}

/**
 * Helper function to paginate a raw transcript
 * 
 * @param {string} transcript - String transcript with timestamps [MM:SS]
 * @returns {Array} Array of paginated transcript pages
 */
function paginateRawTranscript(transcript) {
  // Then handle pagination logic with clean text
  const [contextBlock = "", transcriptContent = transcript] =
    transcript.split(YoutubeTranscriptRetriever.TRANSCRIPT_BEGINS_DELIMITER);

  // Parse the transcript content into array of objects with timestamp and text
  const parsedTranscript = (function parseTranscript(rawTranscript) {
    return rawTranscript.split('\n').map(line => {
      // Handle timestamps in format [mm:ss] or [hh:mm:ss]
      const match = line.match(/\[(?:(\d+):)?(\d+):(\d+)\]\s*(.*)/);
      if (match) {
        const hours = parseInt(match[1] || '0', 10);
        const minutes = parseInt(match[2], 10);
        const seconds = parseInt(match[3], 10);
        return {
          timestamp: hours * 3600 + minutes * 60 + seconds,
          text: match[4]
        };
      }
      return null;
    }).filter(item => item !== null);
  })(transcriptContent);

  // Paginate into pages based on PAGE_DURATION
  const pages = [];
  let currentPage = '';
  let pageStartTime = 0;
  let pageEndTime = PAGE_DURATION;

  parsedTranscript.forEach(item => {
    if (item.timestamp < pageEndTime) {
      currentPage += `[${formatTime(item.timestamp)}] ${item.text}\n`;
    } else {
      if (currentPage) {
        // Add context block to each page
        pages.push(`${contextBlock}\n${YoutubeTranscriptRetriever.TRANSCRIPT_BEGINS_DELIMITER}\n${currentPage.trim()}`);
      }
      pageStartTime = Math.floor(item.timestamp / PAGE_DURATION) * PAGE_DURATION;
      pageEndTime = pageStartTime + PAGE_DURATION;
      currentPage = `[${formatTime(item.timestamp)}] ${item.text}\n`;
    }
  });

  if (currentPage) {
    // Add context block to final page
    pages.push(`${contextBlock}\n${YoutubeTranscriptRetriever.TRANSCRIPT_BEGINS_DELIMITER}\n${currentPage.trim()}`);
  }

  return pages;
}

/**
 * Helper function to paginate a processed transcript
 * 
 * @param {string} processedTranscript - Full processed transcript string
 * @returns {Array} Array of paginated processed transcript pages
 */
function paginateProcessedTranscript(processedTranscript) {
  const lines = processedTranscript.split('\n');
  const paginated = [];
  let currentPage = '';
  let segmentStartTime = 0;
  let segmentEndTime = PAGE_DURATION;

  lines.forEach(line => {
    const match = line.match(/\[(\d+):(\d+) -> (\d+):(\d+)\]/);
    if (match) {
      const startMinutes = parseInt(match[1], 10);
      const startSeconds = parseInt(match[2], 10);
      const startTime = startMinutes * 60 + startSeconds;

      if (startTime >= segmentEndTime) {
        if (currentPage) {
          paginated.push(currentPage.trim());
        }
        // Update the segment window
        segmentStartTime = Math.floor(startTime / PAGE_DURATION) * PAGE_DURATION;
        segmentEndTime = segmentStartTime + PAGE_DURATION;
        currentPage = '';
      }

      currentPage += `${line}\n`;
    } else {
      currentPage += `${line}\n`;
    }
  });

  if (currentPage.trim().length > 0) {
    paginated.push(currentPage.trim());
  }

  return paginated;
}


/**
 * TODO: parameterize number of  partitions, n
 * Splits a transcript page into two roughly equal parts, ensuring timestamps are not split.
 * @param {string} page - The transcript page to split
 * @returns {{firstHalf: string, secondHalf: string}} The split pages
 */
function splitTranscriptPage(page) {
  // Split the page into lines
  const lines = page.split('\n');

  // Find the context section and transcript delimiter
  const contextStartIndex = lines.findIndex(line =>
    line.includes(YoutubeTranscriptRetriever.CONTEXT_BEGINS_DELIMITER)
  );
  const transcriptStartIndex = lines.findIndex(line =>
    line.includes(YoutubeTranscriptRetriever.TRANSCRIPT_BEGINS_DELIMITER)
  );

  // Extract context section
  const contextSection = lines.slice(contextStartIndex, transcriptStartIndex + 1).join('\n');

  // Get just the transcript lines
  const transcriptLines = lines.slice(transcriptStartIndex + 1);

  // Find the middle timestamp
  const timestamps = transcriptLines
    .map(line => {
      const match = line.match(/\[(\d+):(\d+)\]/);
      if (match) {
        return parseInt(match[1]) * 60 + parseInt(match[2]);
      }
      return null;
    })
    .filter(time => time !== null);

  const totalDuration = Math.max(...timestamps);
  const midPoint = totalDuration / 2;

  // Find the line index closest to the midpoint
  let splitIndex = transcriptLines.findIndex(line => {
    const match = line.match(/\[(\d+):(\d+)\]/);
    if (match) {
      const time = parseInt(match[1]) * 60 + parseInt(match[2]);
      return time >= midPoint;
    }
    return false;
  });

  // Create the two halves, including context in both
  const firstHalf = contextSection + '\n' +
    transcriptLines.slice(0, splitIndex).join('\n');

  const secondHalf = contextSection + '\n' +
    transcriptLines.slice(splitIndex).join('\n');

  return { firstHalf, secondHalf };
}

//==============================================================================
//                            UI UPDATES
//==============================================================================


/**
 * Displays the current page based on visibility state.
 */
function setRawAndProcessedTranscriptText() {
  if (!transcriptDisplay || !processedDisplay) return;

  transcriptDisplay.textContent = rawTranscriptPages[currentPageIndex] || '';

  // Set processed text from the loaded page, or empty if not available
  processedDisplay.textContent = processedTranscriptPages[currentPageIndex] || '';

  // Update highlights based on current tab visibility and processed content
  const highlightProcessedTextarea = document.getElementById('highlight-processed');
  if (highlightProcessedTextarea) {
    highlightProcessedTextarea.value = processedDisplay.textContent;
  }
  
  // Potentially update highlights results view if needed, though loadHighlightsForCurrentPage handles it
  // const highlightResultsTextarea = document.getElementById('highlight-results');
  // if (highlightResultsTextarea) {
  //   highlightResultsTextarea.value = highlightsPages[currentPageIndex] || '';
  // }
}

/**
 * Updates the state of pagination buttons.
 */
function updatePaginationButtons() {
  prevBtn.disabled = currentPageIndex === 0;
  nextBtn.disabled = currentPageIndex === (getCurrentDisplayPagesNumbers().length - 1);
}
/**
 * Updates the page information display.
 */
function updatePageInfo() {
  if (!pageInfo) return;
  const totalPages = rawTranscriptPages.length; // Base pagination on raw pages
  if (totalPages > 0) {
    pageInfo.textContent = `Page ${currentPageIndex + 1} of ${totalPages}`;
  } else {
    pageInfo.textContent = 'Page 0 of 0';
  }
}

function updateFontSize() {
  transcriptDisplay.style.fontSize = `${currentFontSize}px`;
  processedDisplay.style.fontSize = `${currentFontSize}px`;
  highlightsPromptDisplay.style.fontSize  = `${currentFontSize}px`;
  highlightsProcessedDisplay.style.fontSize  = `${currentFontSize}px`;
  highlightsResultsDisplay.style.fontSize  = `${currentFontSize}px`;
}


//==============================================================================
//                            EVENT HANDLERS
//==============================================================================

// Add event handler for Push to Twitter button click
async function handlePushToTwitterClick(storageUtils) {
  logger.logEvent(Logger.EVENTS.TWITTER_SHARE_START, { [Logger.FIELDS.PAGE_INDEX]: currentPageIndex });
  
  try {
      const authenticated = await twitterClient.isAuthenticated();
      if (!authenticated) {
          // Show login form instead of proceeding
          alert('Please log in to Twitter to post.');
          if (twitterLoginSection) {
              twitterLoginSection.classList.remove('hidden');
          } else {
              console.error("Twitter login section not found in the DOM.");
              alert("Error: Could not display Twitter login form.");
          }
          return; // Stop processing the push action
      }

      // --- User is authenticated, proceed with posting --- 
      loader.classList.remove('hidden'); // Show loader

      // 2. Get Highlights and Context
      const highlightsText = highlightsPages[currentPageIndex] || document.getElementById('highlight-results').value;
      if (!highlightsText || highlightsText.trim() === "") {
          logger.logEvent(Logger.EVENTS.TWITTER_SHARE_FAILURE, { [Logger.FIELDS.ERROR_TYPE]: 'no_highlights' });
          alert('No highlights available for the current page to share.');
          loader.classList.add('hidden');
          return;
      }

      const currentRawPage = rawTranscriptPages[currentPageIndex];
      const videoTitle = extractVideoTitle(currentRawPage) || "this video";
      const videoId = await storageUtils.getCurrentYouTubeVideoId();
      const videoUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : "";

      // 3. Summarize Highlights for Twitter using LLM
      alert('Summarizing highlights for Twitter... This may take a moment.');
      const tweetSummary = await llmUtils.summarizeHighlightsForTwitter({
          highlightsText,
          videoTitle,
          videoUrl,
          // model_name: // Optional: specify model if needed
      });

      // 4. Post Tweet
      const userConfirmed = confirm(`Ready to post this to Twitter?\n\n${tweetSummary}`);
      if (!userConfirmed) {
          logger.logEvent(Logger.EVENTS.TWITTER_SHARE_CANCELLED);
          alert('Tweet posting cancelled.');
          loader.classList.add('hidden');
          return;
      }

      const postResult = await twitterClient.postTweet(tweetSummary);
      logger.logEvent(Logger.EVENTS.TWITTER_SHARE_SUCCESS, { [Logger.FIELDS.TWEET_ID]: postResult?.data?.id });
      alert('Tweet posted successfully!');

  } catch (error) {
      console.error('Error during Push to Twitter:', error);
      logger.logEvent(Logger.EVENTS.TWITTER_SHARE_FAILURE, { [Logger.FIELDS.ERROR_TYPE]: 'post_error', [Logger.FIELDS.ERROR_MESSAGE]: error.message });
      alert(`Failed to push to Twitter: ${error.message}`);
  } finally {
      // Ensure loader is hidden regardless of outcome (unless login form is shown)
      if (loader && !twitterLoginSection?.classList.contains('hidden')) {
           // Don't hide loader if login form became visible
      } else if (loader) {
           loader.classList.add('hidden'); // Hide loader
      }
  }
}

// Add event handler for Twitter Login button click
async function handleTwitterLoginClick() {
    const username = twitterUsernameInput.value.trim();
    const password = twitterPasswordInput.value;

    if (!username || !password) {
        twitterLoginStatus.textContent = 'Username and Password are required.';
        return;
    }

    twitterLoginStatus.textContent = 'Logging in...';
    loader.classList.remove('hidden'); // Show loader

    try {
        const success = await twitterClient.authenticate(username, password);
        if (success) {
            twitterLoginStatus.textContent = 'Login successful!';
            twitterLoginSection.classList.add('hidden'); // Hide login form on success
            // Optionally, trigger the post action again or notify user
            alert('Login successful. You can now push to Twitter.');
        } else {
            // Error message is usually shown via alert in twitterClient.authenticate
            twitterLoginStatus.textContent = 'Login failed. See alert message.';
        }
    } catch (error) { // Should be caught within authenticate, but just in case
        console.error("Unexpected error during login handling:", error);
        twitterLoginStatus.textContent = 'Login failed. An unexpected error occurred.';
        alert(`Login failed: ${error.message}`);
    } finally {
        loader.classList.add('hidden'); // Hide loader
    }
}

// Export the functions for testing purposes
export {
  initializePopup,
  paginateBothTranscripts,
  paginateRawTranscript,
  paginateProcessedTranscript,
  handlePrevClick,
  handleNextClick,
  handleProcessTranscriptClick,
  handleGenerateHighlightsClick,
  handlePushToTwitterClick,
  setupProcessButton,
  setupLoadTranscriptButton,
  setupGenerateHighlightsButton,
  setupPushToTwitterButton,
  splitTranscriptPage,
  setupPopup
};


// popup/popup.js

import LLM_API_Utils from './llm_api_utils.js';
import StorageUtils from './storage_utils.js';
import Logger from './logger.js';
import { 
  ClipRequestHandler, 
  CLIP_SERVICE_BASE_URL,
  CLIP_API_KEY
} from './clipServiceUtils.js';

// Constants from YoutubeTranscriptRetriever
const TRANSCRIPT_BEGINS_DELIMITER = "*** Transcript ***";
const CONTEXT_BEGINS_DELIMITER = "*** Background Context ***";

//==============================================================================
//                              GLOBAL VARIABLES
//==============================================================================

// Constants are now imported from clipServiceUtils.js

// Declare the variables in a higher scope
let transcriptDisplay, processedDisplay, prevBtn, nextBtn, pageInfo, processBtn, loader, tabButtons, tabContents, modelSelect, languageSelect;

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

// State management
const AppState = {
  GUIDE: 'guide',
  LOADING: 'loading',
  READY: 'ready'
};

let currentState = null;

function setState(state) {
  currentState = state;
  
  // Hide all states
  const stateContainers = document.querySelectorAll('.state-container, #ready-state');
  stateContainers.forEach(el => el.classList.add('hidden'));
  
  // Hide other UI elements based on state
  if (state !== AppState.READY) {
    document.getElementById('transcript-section')?.classList.add('hidden');
    document.getElementById('content-section')?.classList.add('hidden');
    document.getElementById('actions')?.classList.add('hidden');
  }
  
  // Show current state
  switch(state) {
    case AppState.GUIDE:
      document.getElementById('guide-state')?.classList.remove('hidden');
      break;
    case AppState.LOADING:
      document.getElementById('loading-state')?.classList.remove('hidden');
      break;
    case AppState.READY:
      document.getElementById('ready-state')?.classList.remove('hidden');
      document.getElementById('transcript-section')?.classList.remove('hidden');
      document.getElementById('content-section')?.classList.remove('hidden');
      document.getElementById('actions')?.classList.remove('hidden');
      break;
  }
}

//==============================================================================
//                         INITIALIZATION FUNCTIONS 
//==============================================================================

// Call it immediately in browser environment
if (typeof document !== 'undefined') {
  setupPopup();
}

// Setup Clip button/form functionality
function setupClipService(storageUtils) {
  const clipBtn = document.getElementById('clip-btn');
  const clipForm = document.getElementById('clip-form');
  const clipStartInput = document.getElementById('clip-start');
  const clipEndInput = document.getElementById('clip-end');
  const clipSubmit = document.getElementById('clip-submit');
  const clipError = document.getElementById('clip-error');
  const clipLoader = document.getElementById('clip-loader');
  
  // Find or create the status text element
  let clipStatusText = document.getElementById('clip-status-text');
  if (!clipStatusText && clipLoader && clipLoader.parentNode) {
      clipStatusText = document.createElement('span');
      clipStatusText.id = 'clip-status-text';
      clipStatusText.style.marginLeft = '10px';
      clipLoader.parentNode.insertBefore(clipStatusText, clipLoader.nextSibling);
  } else if (!clipStatusText) {
       // Fallback if loader isn't ready/found - status won't display
      console.warn('Clip loader element not found when creating status text.');
  }

  console.log('[ClipService Setup] Found UI elements:', { clipBtn, clipForm, clipStartInput, clipEndInput, clipSubmit, clipError, clipLoader });

  let videoId = null;
  let currentTabUrl = null;
  let clipHandler = null; // To hold the handler instance

  // Instantiate the handler, ensuring required elements exist
  if (clipLoader && clipStatusText && clipError && clipSubmit) {
    clipHandler = new ClipRequestHandler(
      { 
        loader: clipLoader,
        statusText: clipStatusText,
        errorDisplay: clipError,
        submitButton: clipSubmit
      },
      { 
        baseUrl: CLIP_SERVICE_BASE_URL,
        apiKey: CLIP_API_KEY
      }
    );
    console.log('[ClipService Setup] ClipRequestHandler instantiated.');
  } else {
      console.error("ClipRequestHandler Init Failed: Missing UI elements.");
      // Disable clip feature if setup fails
      if(clipBtn) { 
        clipBtn.disabled = true; 
        clipBtn.title = "Clip feature disabled.";
      }
      if(clipError) {
        clipError.textContent = "Clip feature error. Reload.";
        clipError.classList.remove('hidden');
      }
      return; // Stop setup 
  }

  // Show clip button and get videoId/URL if on a YouTube video
  storageUtils.getCurrentYouTubeVideoId().then(id => {
    if (id) {
      videoId = id;
      // Get the current tab's URL directly
      return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (chrome.runtime.lastError) {
            console.error('Error querying tabs for URL:', chrome.runtime.lastError);
            return reject(chrome.runtime.lastError);
          }
          if (tabs.length > 0 && tabs[0].url) {
            resolve(tabs[0].url); // Resolve with the URL
          } else {
            resolve(null); // Resolve with null if no URL
          }
        });
      });
    } else {
      // If no ID, resolve immediately with null URL
    return Promise.resolve(null); 
    }
  }).then(url => {
    if (videoId && url && url.includes('youtube.com/watch')) {
        currentTabUrl = url;
        if(clipBtn) clipBtn.classList.remove('hidden'); // Show button only if ID and valid URL
    } else {
        // Hide button if no ID or URL isn't a watch page
        if(clipBtn) clipBtn.classList.add('hidden');
        currentTabUrl = null; 
        videoId = null; 
        if (url) console.warn("URL is not a YouTube watch page:", url);
    }
  }).catch(err => {
    console.error("Error getting video info for clip service:", err);
    if(clipBtn) clipBtn.classList.add('hidden');
  });

  // Listener for the main Clip button to toggle the form
  if (clipBtn) {
    clipBtn.addEventListener('click', () => {
      console.log('[ClipService Button] Clip button clicked.');
      if(clipForm) clipForm.classList.toggle('hidden');
      // Reset UI state via handler when form is shown/hidden
      if (clipHandler) clipHandler._updateStatus('', false, false); 
    });
  }

  // Listener for the Submit button within the form
  if (clipSubmit) {
    clipSubmit.addEventListener('click', () => {
      console.log('[ClipService Button] Clip submit button clicked.');
      if (!clipHandler) {
          console.error("Clip handler not ready.");
          if(clipError) {
              clipError.textContent = "Error. Please reload.";
              clipError.classList.remove('hidden');
          }
          return;
      }
      let startStr = clipStartInput ? clipStartInput.value.trim() : '';
      let endStr = clipEndInput ? clipEndInput.value.trim() : '';

      // 2. Dynamic Filename - Extract Title
      let videoTitle = 'video_clip'; // Default title
      if (rawTranscriptPages && rawTranscriptPages.length > 0) {
        try {
          videoTitle = extractVideoTitle(rawTranscriptPages[0]); // Use the title extracted from the first page
          console.log('[ClipService Filename] Extracted video title:', videoTitle);
        } catch (err) {
          console.error('[ClipService Filename] Error extracting video title:', err);
          // Keep the default title if extraction fails
        } 
      } else {
        console.warn('[ClipService Filename] Raw transcript pages not available for title extraction.');
      }
      
      // Delegate the request process to the handler, now including the title
      clipHandler.requestClip(currentTabUrl, startStr, endStr, videoId, videoTitle);
    });
  }
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
    languageSelect = doc.getElementById('language-select');
    resetTranscriptBtn = doc.getElementById('reset-transcript-btn');

    // Add new element declarations
    fontSizeDecrease = doc.getElementById('font-size-decrease');
    fontSizeIncrease = doc.getElementById('font-size-increase');

    setupTabs(doc, tabButtons, tabContents);
    setupProcessButton(processBtn, modelSelect, storageUtils);
    setupPagination(prevBtn, nextBtn, pageInfo);

    // Load existing transcripts if available
    const videoId = await storageUtils.getCurrentYouTubeVideoId();

    console.log(`Current YouTube Video ID: ${videoId}`);
    logger.logEvent(Logger.EVENTS.EXTENSION_OPENED, {
      [Logger.FIELDS.VIDEO_ID]: videoId
    });

    // First try to load from storage
    const savedTranscripts = await storageUtils.loadTranscriptsById(videoId);

    // Set initial state based on whether we have transcripts
    if (savedTranscripts.rawTranscript) {
      // Have saved transcript
      rawTranscript = savedTranscripts.rawTranscript;
      processedTranscript = savedTranscripts.processedTranscript || "";
      setState(AppState.READY);
      paginateBothTranscripts(rawTranscript, processedTranscript);
      displayCurrentPage();
      updatePaginationUI();
    } else {
      // No saved transcript - check if transcript panel is open
      setState(AppState.GUIDE);
      const result = await checkTranscriptViaContentScript();
      
      if (result?.success && result.transcript) {
        // Transcript panel is open - load it
        setState(AppState.LOADING);
        rawTranscript = result.transcript;
        await storageUtils.saveRawTranscriptById(videoId, rawTranscript);
        processedTranscript = "";
        setState(AppState.READY);
        paginateBothTranscripts(rawTranscript, processedTranscript);
        displayCurrentPage();
        updatePaginationUI();
      } else {
        // Start polling
        startTranscriptPolling(videoId, storageUtils);
      }
    }

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

    // Add copy button functionality
    setupCopyButtons(doc);

    // Add new setup call
    setupFontSizeControls(fontSizeDecrease, fontSizeIncrease, storageUtils);
    setupLanguageSelection(languageSelect, storageUtils);

    setupGenerateHighlightsButton(generateHighlightsBtn, storageUtils);

    setupClearTranscriptButton(resetTranscriptBtn, storageUtils, videoId);
    // Setup clip button and form functionality
    setupClipService(storageUtils);

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

function setupLanguageSelection(languageSelect, storageUtils) {
  // Load saved language preference when initializing
  (async () => {
    try {
      const savedLanguage = await storageUtils.loadLanguagePreference();
      languageSelect.value = savedLanguage;
    } catch (error) {
      console.error('Error loading language preference:', error);
    }
  })();

  // Save language preference when changed
  languageSelect.addEventListener('change', async () => {
    try {
      await storageUtils.saveLanguagePreference(languageSelect.value);
      console.log('Language preference saved:', languageSelect.value);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  });
}

function setupGenerateHighlightsButton(generateHighlightsBtn, storageUtils) {
  generateHighlightsBtn.addEventListener('click', () => handleGenerateHighlightsClick(storageUtils));
}

function setupClearTranscriptButton(resetTranscriptBtn, storageUtils, videoId) {
  resetTranscriptBtn.addEventListener('click', async () => {
    try {
      // Remove existing transcripts from storage
      await storageUtils.removeTranscriptsById(videoId);

      // Reset global variables
      rawTranscript = "";
      processedTranscript = "";
      rawTranscriptPages = [];
      processedTranscriptPages = [];
      currentPageIndex = 0;

      // Check if transcript panel is open
      const result = await checkTranscriptViaContentScript();
      
      if (result?.success && result.transcript) {
        // Transcript available - load it
        await handleTranscriptFound(result.transcript, videoId, storageUtils);
      } else {
        // No transcript available - show guide and start polling
        setState(AppState.GUIDE);
        startTranscriptPolling(videoId, storageUtils);
      }
    } catch (error) {
      console.error('Error refreshing transcript:', error);
      alert(`Failed to refresh transcript: ${error.message}`);
    } finally {
      loader.classList.add('hidden');
    }
  });
}

//==============================================================================
//                            EVENT HANDLERS
//==============================================================================



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
  const selectedLanguage = languageSelect.value;

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
    // Get the language name from the dropdown option text
    const languageOption = languageSelect.options[languageSelect.selectedIndex];
    const languageName = languageOption.text.split(' (')[0]; // Extract just the language name
    
    const processedPage = await llmUtils.processTranscriptInParallel({
      transcript: currentRawPage,
      model_name: selectedModel,
      partitions: llmUtils.DEFAULT_PARTITIONS,
      targetLanguage: languageName
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

    // Update the processed page
    processedTranscriptPages[currentPageIndex] = processedPage;
    processedDisplay.textContent = processedPage;

    // Combine all processed pages into a single text block
    processedTranscript = processedTranscriptPages.join('\n\n--- Page Break ---\n\n');

    // Save the full processed transcript
    await storageUtils.saveProcessedTranscriptById(videoId, processedTranscript);

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
  const selectedLanguage = languageSelect.value;
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

    // Get the language name from the dropdown option text
    const languageOption = languageSelect.options[languageSelect.selectedIndex];
    const languageName = languageOption.text.split(' (')[0]; // Extract just the language name
    
    const highlightForPage = await llmUtils.generateHighlights({
      processedTranscript: highlightProcessed,
      customPrompt: highlightPrompt,
      targetLanguage: languageName
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

  try {
    const savedHighlights = await storageUtils.loadHighlightsById(videoId, currentPageIndex);
    if (savedHighlights) {
      highlightsPages[currentPageIndex] = savedHighlights;
      const highlightResultsTextarea = document.getElementById('highlight-results');
      if (highlightResultsTextarea) {
        highlightResultsTextarea.value = savedHighlights;
      }
    }
  } catch (error) {
    console.error('Error loading highlights for current page:', error);
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



// New function to check transcript via content script
async function checkTranscriptViaContentScript() {
  try {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    if (!tab?.id) throw new Error('No active tab found');
    
    console.log('Sending CHECK_TRANSCRIPT to tab:', tab.id, tab.url);

    // First try to send message
    let result = await chrome.tabs.sendMessage(
      tab.id,
      {type: 'CHECK_TRANSCRIPT'},
      {frameId: 0}
    ).catch(async (error) => {
      console.error('Message send error:', error);
      
      // If content script not loaded, try to inject it
      if (error.message?.includes('Receiving end does not exist')) {
        console.log('Content script not found, injecting...');
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });
          console.log('Content script injected, retrying...');
          
          // Wait a bit for script to initialize
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Retry sending message
          return await chrome.tabs.sendMessage(
            tab.id,
            {type: 'CHECK_TRANSCRIPT'},
            {frameId: 0}
          );
        } catch (injectError) {
          console.error('Failed to inject content script:', injectError);
          return {success: false};
        }
      }
      return {success: false};
    });

    console.log('Received result:', result);
    return result || {success: false};
  } catch (error) {
    console.error('Error checking transcript:', error);
    return {success: false};
  }
}

// Animated dots for the checking indicator
let dotsInterval = null;
function animateDots() {
  const dotsElement = document.querySelector('.dots');
  if (!dotsElement) return;
  
  let count = 0;
  dotsInterval = setInterval(() => {
    count = (count + 1) % 4;
    dotsElement.textContent = '.'.repeat(count || 1);
  }, 500);
}

function stopDotsAnimation() {
  if (dotsInterval) {
    clearInterval(dotsInterval);
    dotsInterval = null;
  }
}

// Polling function to check for transcript availability
let pollingInterval = null;
async function startTranscriptPolling(videoId, storageUtils) {
  // Clear any existing polling
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
  stopDotsAnimation();

  // Ensure we're in guide state
  setState(AppState.GUIDE);
  
  // Start dots animation
  animateDots();
  
  // Set up check again button
  const checkAgainBtn = document.getElementById('check-again-btn');
  if (checkAgainBtn) {
    checkAgainBtn.onclick = async () => {
      const result = await checkTranscriptViaContentScript();
      if (result?.success && result.transcript) {
        handleTranscriptFound(result.transcript, videoId, storageUtils);
      }
    };
  }

  pollingInterval = setInterval(async () => {
    const result = await checkTranscriptViaContentScript();
    if (result?.success && result.transcript) {
      handleTranscriptFound(result.transcript, videoId, storageUtils);
    }
  }, 2000); // Check every 2 seconds
}

async function handleTranscriptFound(transcript, videoId, storageUtils) {
  // Stop polling and animations
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
  stopDotsAnimation();

  // Show loading state
  setState(AppState.LOADING);

  // Save and display transcript
  rawTranscript = transcript;
  await storageUtils.saveRawTranscriptById(videoId, rawTranscript);
  processedTranscript = "";
  
  // Update to ready state
  setState(AppState.READY);
  paginateBothTranscripts(rawTranscript, processedTranscript);
  displayCurrentPage();
  updatePaginationUI();
  updateTabStates();
}

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
    processedTranscript = savedTranscripts.processedTranscript || "";
    return { isCached: true, isLoadedFromYoutube: false };
  }

  // If no saved transcript, try to fetch via content script
  const result = await checkTranscriptViaContentScript();
  if (result?.success && result.transcript) {
    rawTranscript = decodeTranscript(result.transcript);
    if (rawTranscript) {
      await storageUtils.saveRawTranscriptById(videoId, rawTranscript);
      processedTranscript = ""; // Reset processed transcript
      return { isCached: false, isLoadedFromYoutube: true };
    }
  }

  // If content script doesn't have transcript, show waiting message
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
    transcript.split(TRANSCRIPT_BEGINS_DELIMITER);

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
        pages.push(`${contextBlock}\n${TRANSCRIPT_BEGINS_DELIMITER}\n${currentPage.trim()}`);
      }
      pageStartTime = Math.floor(item.timestamp / PAGE_DURATION) * PAGE_DURATION;
      pageEndTime = pageStartTime + PAGE_DURATION;
      currentPage = `[${formatTime(item.timestamp)}] ${item.text}\n`;
    }
  });

  if (currentPage) {
    // Add context block to final page
    pages.push(`${contextBlock}\n${TRANSCRIPT_BEGINS_DELIMITER}\n${currentPage.trim()}`);
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
  if (!processedTranscript || processedTranscript.trim() === "") {
    return []; // Return empty array if no processed transcript
  }
  // Directly split by the page break delimiter used during saving
  const pages = processedTranscript.split('\n\n--- Page Break ---\n\n');
  // Ensure each page is trimmed of any leading/trailing whitespace
  return pages.map(page => page.trim());
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
    line.includes(CONTEXT_BEGINS_DELIMITER)
  );
  const transcriptStartIndex = lines.findIndex(line =>
    line.includes(TRANSCRIPT_BEGINS_DELIMITER)
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
 * Displays the current page content
 */
function displayCurrentPage() {
  setRawAndProcessedTranscriptText();
}

/**
 * Updates all pagination UI elements
 */
function updatePaginationUI() {
  updatePaginationButtons();
  updatePageInfo();
}

/**
 * Displays the current page based on visibility state.
 */
function setRawAndProcessedTranscriptText() {
  // Ensure elements exist before using them
  if (!transcriptDisplay || !processedDisplay) return;
  
  // Visibility is handled separately via CSS classes
  transcriptDisplay.textContent = rawTranscriptPages[currentPageIndex] || "No transcript available.";
  processedDisplay.textContent = processedTranscriptPages[currentPageIndex] || "Processed output will appear here.";
  
  // Add this line to sync the highlight's processed textarea
  const highlightProcessedTextarea = document.getElementById('highlight-processed');
  if (highlightProcessedTextarea) {
    highlightProcessedTextarea.value = processedDisplay.textContent;
  }
}

/**
 * Updates the state of pagination buttons.
 */
function updatePaginationButtons() {
  if (!prevBtn || !nextBtn) return;
  prevBtn.disabled = currentPageIndex === 0;
  nextBtn.disabled = currentPageIndex === (getCurrentDisplayPagesNumbers().length - 1);
}

/**
 * Updates the page information display.
 */
function updatePageInfo() {
  if (!pageInfo) return;
  const currentPages = getCurrentDisplayPagesNumbers();
  pageInfo.textContent = `Page ${currentPageIndex + 1} of ${currentPages.length}`;
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

// Export the functions for testing purposes
export {
  initializePopup,
  paginateBothTranscripts,
  paginateRawTranscript,
  paginateProcessedTranscript,
  handlePrevClick,
  handleNextClick,
  setupProcessButton,
  splitTranscriptPage,
  setupPopup
};

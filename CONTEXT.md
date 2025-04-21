# Automatic Professional Copyedited YouTube Transcripts Chrome Extension - Context

**Last Updated:** 2025-04-19

## 1. Project Goal & Status
- High-level objective: Provide users with high-quality, professionally copyedited transcripts of YouTube videos, either automatically retrieved or manually uploaded. Integrate LLM capabilities for processing and analysis.
- Current Phase: Active Development / Maintenance (addressing bugs, adding features).
- Key Stakeholders: Leo Jiang (llj0824)
- Next Major Milestone: Addressing key bugs (e.g., transcript storage) and potentially submitting an updated version to the Chrome Web Store.

## 2. Core Architecture
- Frontend: Chrome Extension Popup/Side Panel (HTML, CSS, JavaScript in `popup/`). Uses `youtube-transcript` library.
- Backend: N/A (Browser extension architecture). Logic resides in service worker and content scripts.
- LLM Integration: Uses external LLM APIs (likely OpenAI GPT-4o-mini based on readme notes) via `popup/llm_api_utils.js` for transcript processing (e.g., copyediting, highlighting). API key likely stored in `.env`.
- Deployment Environment: Chrome Web Store. Manual build and upload process.

## 3. Key File Structure Overview & Interactions

This section details the main components, their roles, and how they communicate.

-   **`manifest.json` (Root):**
    -   **Responsibility:** The core configuration file for the Chrome extension. Defines permissions, declares background scripts, content scripts, popup/side panel UI, icons, and other essential metadata.
    -   **Interactions:** Dictates which scripts run and when, which websites the extension can access, and what capabilities it has. It's the entry point for the browser loading the extension.

-   **`/popup` (Directory):** Contains the UI (`popup.html`, `popup.css`) and the main logic (`popup.js`) for the extension's user-facing panel.
    -   **Files:**
        -   `popup.html`: Structure of the popup/side panel UI.
        -   `popup.css`: Styling for the UI.
        -   `popup.js`: Core script handling UI events (button clicks, tab switching), orchestrating transcript retrieval, processing, display, and interactions with other modules. Manages application state (e.g., current video ID, transcript content, loading status).
        -   `youtube_transcript_retrival.js`: Contains the `YoutubeTranscriptRetriever` class responsible for fetching the raw transcript and initial video metadata (title, description) directly from YouTube pages by scraping HTML and parsing JSON data. Includes logic for extracting video ID, finding caption tracks, and formatting the raw transcript with timestamps and context.
        -   `llm_api_utils.js`: Contains the `LLM_API_Utils` class. Handles communication with external LLM APIs (OpenAI and Anthropic). Encapsulates API endpoint URLs, key decryption (simple XOR obfuscation from `keys.js`), system prompts for copyediting and highlight generation, logic for splitting transcripts into partitions for parallel processing, and functions to call specific models (`call_openai`, `call_claude`).
        -   `storage_utils.js`: Contains the `StorageUtils` class. Provides methods to interact with `chrome.storage.local` for saving and loading raw transcripts, processed transcripts, highlights, and user settings (like font size), keyed by video ID (and page number for highlights). Includes logic to get the current video ID from the active tab.
        -   `keys.js`: Exports obfuscated API keys (OpenAI, Anthropic) as constants.
        -   `logger.js`: Contains a `Logger` class for sending structured event logs (e.g., transcript retrieval attempts, LLM processing success/failure, errors) to an external endpoint (Google Apps Script). Includes logic for local storage fallback and retrying failed logs.
    -   **Interactions:**
        -   `popup.js` drives the workflow:
            -   Uses `storage_utils.js` to get the current video ID and load/save transcripts/settings from/to `chrome.storage.local`.
            -   Uses `youtube_transcript_retrival.js` to fetch the raw transcript if not found in storage.
            -   Uses `llm_api_utils.js` to send the raw transcript (potentially partitioned) to the selected LLM for copyediting or highlight generation.
            -   Updates `popup.html` elements to display status, transcripts, highlights, and handle user input.
            -   Uses `logger.js` to log significant events and errors.
        -   Relies heavily on utility classes within the same directory (`storage_utils.js`, `llm_api_utils.js`, `youtube_transcript_retrival.js`, `logger.js`).
        -   Likely communicates with the service worker (`/background/service_worker.js`) via `chrome.runtime.sendMessage` for tasks requiring background persistence or specific permissions (though the primary logic seems self-contained in `popup.js` based on the provided files).
        -   Makes direct `fetch` calls to YouTube (via `youtube_transcript_retrival.js`), LLM APIs (via `llm_api_utils.js`), and the logging endpoint (via `logger.js`).

-   **`/background` (Directory):**
    -   **Responsibility:** Houses the service worker (`service_worker.js`). This script runs in the background, independent of any specific web page or popup window. It handles long-running tasks, manages extension state, listens for browser events (like tab updates or messages from other parts of the extension), and coordinates communication. It likely orchestrates transcript fetching logic using `youtube-transcript` library and manages API key access.
    -   **Interactions:**
        -   Receives messages from the popup UI and content scripts.
        -   Sends messages back to the popup UI and content scripts.
        -   Can inject content scripts (`/content.js`) into web pages.
        -   Manages access to privileged Chrome APIs (e.g., `chrome.storage`, `chrome.tabs`).
        -   May make network requests itself or delegate them (like LLM calls delegated to `popup`).

-   **`/content.js` (File, potentially in `/src` or root):**
    -   **Responsibility:** A content script that runs in the context of specific web pages (defined in `manifest.json`, likely YouTube video pages). It can directly access and manipulate the DOM of the web page. Its primary role is often to extract information from the page (like the video ID) or potentially inject UI elements directly onto the page.
    -   **Interactions:**
        -   Reads information from the YouTube page's DOM.
        -   Sends messages to the service worker (`/background/service_worker.js`) containing extracted information (e.g., video ID) or requesting actions.
        -   Receives messages from the service worker to perform actions on the page if needed.

-   **`/icons` (Directory):**
    -   **Responsibility:** Stores the various icon sizes required by the Chrome extension (e.g., for the toolbar, extensions page).
    -   **Interactions:** Referenced by `manifest.json`.

-   **`/dist` (Directory):**
    -   **Responsibility:** The output directory generated by the build process (e.g., using Webpack/Babel configured in `webpack.config.js`/`babel.config.cjs`). Contains the optimized, bundled, and possibly transpiled code ready for loading into Chrome or packaging.
    -   **Interactions:** This directory is what gets loaded as an "unpacked extension" during development or zipped for production deployment.

-   **`package.json` (Root):**
    -   **Responsibility:** Defines Node.js project metadata, lists dependencies (`dependencies`, `devDependencies`), and specifies scripts (`scripts` section) for common tasks like installing, testing, and building.
    -   **Interactions:** Used by `npm` or `yarn` package managers. Build tools and test runners rely on the defined dependencies and scripts.

-   **`webpack.config.js` / `babel.config.cjs` (Root):**
    -   **Responsibility:** Configuration files for the build tools (Webpack for bundling modules, Babel for transpiling modern JavaScript). Define how source code is processed and packaged into the `/dist` directory.
    -   **Interactions:** Read by Webpack and Babel when build commands (defined in `package.json`) are executed.

-   **`build_chrome_publication.sh` (Root):**
    -   **Responsibility:** A shell script that automates the process of creating a production-ready `.zip` file of the extension, likely by running build commands and then archiving the appropriate files (from `/dist`, `manifest.json`, `/icons`, etc.).
    -   **Interactions:** Executes commands defined in `package.json` (like build scripts) and uses system commands (like `zip`).

-   **`readme.md` (Root):**
    -   **Responsibility:** The main documentation file for the project. Contains setup instructions, usage guides, project goals, TODO lists, known bugs, etc.

-   **`CONTEXT.md` (Root):**
    -   **Responsibility:** This file! Provides a high-level overview and context about the project's architecture, status, key files, and common procedures.

## 4. Common Commands & Setup
- **Install Dependencies:** `npm install`
- **Run All Tests:** `npm test`
- **Run Specific Tests:** e.g., `npm run test:youtube_transcript_retrieval`, `npm run test:llm_response_tests`
- **Build for Development/Testing:** Load the unpacked extension directory (`/Users/leojiang/Desktop/workspace/automatic-professional-copyedited-youtube-transcripts-chrome-extension`) via `chrome://extensions/` (Developer Mode enabled).
- **Build for Production (Chrome Store):** `./build_chrome_publication.sh` (creates a `.zip` file in the root).
- **Debugging:** Use Chrome DevTools (Inspect Popup/Side Panel, Inspect Service Worker via `chrome://extensions`, Inspect Content Script via YouTube page DevTools). Use VSCode/Cursor debugger with `launch.json` configurations for Node.js tests.

## 5. Key Dependencies & Gotchas
- **Key Libs:** `youtube-transcript` (core functionality), `node-fetch` (for API calls), `jest`/`puppeteer` (testing).
- **API Keys:** Requires an LLM API key, likely configured via a `.env` file (check `llm_api_utils.js`).
- **Transcript Retrieval:** Can sometimes fail initially; requires page refresh (mentioned in `readme.md` bugs). Needs YouTube captions to be available.
- **Debugging Complexity:** Different components (popup, service worker, content script) require different debugging approaches in Chrome DevTools.
- **Chrome Store Updates:** Requires manual version bump in `manifest.json`, running the build script, and uploading via the Developer Dashboard.

## 6. Recent Major Changes / Current Focus Area
- Refactoring "segments" to "pages".
- Optimizing LLM prompts (e.g., for highlights).
- Adding LLM-as-judge tests (`llm_partition_optimization.test.js`).
- Current focus seems to be on fixing bugs related to transcript storage/loading (see `readme.md` Bugs section) and adding features like remaining balance indication and a feedback mechanism.

## 7. Roadmap / Backlog (High Level Links)
- See TODOs/Bugs section in `readme.md`.

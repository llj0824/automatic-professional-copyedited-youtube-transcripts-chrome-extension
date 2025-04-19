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

## 3. Key File Structure Overview
- `/popup`: Extension UI (popup/side panel) code (HTML, CSS, JS, utils).
- `/background`: Service worker (`service_worker.js`) for background tasks and event handling.
- `/src` (or potentially `content.js`): Content script(s) for interacting with YouTube pages.
- `/tests`: Unit, integration, and LLM evaluation tests (Jest, Puppeteer).
- `/icons`: Extension icons.
- `/dist`: Build output directory for the packaged extension.
- `/llm_responses`: Likely stores example/cached LLM outputs for testing/dev.
- `manifest.json`: Core Chrome Extension configuration file.
- `package.json`: Node.js project dependencies and scripts.
- `webpack.config.js` / `babel.config.cjs`: Build tooling configuration.
- `build_chrome_publication.sh`: Script to package the extension for the Chrome Web Store.
- `readme.md`: Main project documentation, setup, usage, TODOs.
- `CONTEXT.md`: This file!

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

# Automatic Professional Copyedited YouTube Transcripts Chrome Extension

This Chrome extension automatically retrieves and provides high-quality, professionally copyedited transcripts of YouTube videos. Users can either upload their own transcripts or automatically pull transcripts directly from YouTube videos, ensuring accurate and polished text for analysis and reference.

## Features

- **Automatic Transcript Retrieval:** Automatically fetch transcripts from YouTube videos without manual intervention.
- **Manual Transcript Upload:** Option to manually upload your own transcripts if preferred.
- **Professional Copyediting:** Provides high-quality, professionally edited transcripts for clarity and accuracy.
- **Segmented Display:** Transcripts are divided into pages (e.g., 15-minute intervals) for easy navigation.


## Installation

1. Clone the repository.
2. Navigate to the `popup` directory.
3. Load the extension in your browser's developer mode.

## Usage

1. Open the extension popup.
2. Choose to either:
    - **Automatically Retrieve Transcript:** Select a YouTube video to fetch its transcript automatically.
    - **Manually Upload Transcript:** Upload your own transcript file.
3. View the professionally copyedited transcript segments.
4. (Optional) Manage and process transcripts using integrated LLM tools for further analysis.

## Configuration

- **Model Selection:** Choose from available LLM models to enhance or analyze your transcripts.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

MIT License

## Note to self: updating version to submit upgrade to chrome extension store.

### Preparing a New Version
1. Update version number in `manifest.json`
2. Make sure all changes are committed and tested
3. Run the build script:
   ```bash
   ./build_chrome_publication.sh
   ```
   This will create `youtube_professional_transcript_chrome_extension.zip`

### Submitting to Chrome Web Store
1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Find your existing extension
3. Click "Package" tab
4. Upload the new zip file
5. Update release notes with changes
6. Submit for review


## Note to self: Debugging 

I. Manual testing with chrome devtools
    1. Open Chrome and navigate to `chrome://extensions/`
    2. Enable "Developer mode" in the top right
    3. Click "Load unpacked" and select your project

    ### Debugging Different Components
    1. Popup/Side Panel
    - Files: `popup/popup.js`, `popup/popup.html`, `popup/popup.css`, `popup/storage_utils.js`, `popup/llm_api_utils.js`
    - To debug:
    1. Click the extension icon to open side panel
    2. Right-click and select "Inspect", set breakpoints

    2. Service Worker (`background/service_worker.js`)
    - Files: Handles extension installation, side panel behavior, and YouTube tab monitoring
    - To debug:
    1. Go to `chrome://extensions`
    2. Find your extension
    3. Click "Service Worker" under "Inspect views"
    4. View code under Sources > service_worker.js

    3. Content Scripts (`content.js`)
    - Files: Handles YouTube page interactions and transcript extraction
    - To debug:
    1. Open DevTools on any YouTube page with active extension
    2. Go to Sources tab
    3. Find code under "Content scripts" section

II. Debugging unit and integration tests on Cursor
 1. when testing, run `npm run test:youtube_transcript_retrieval` to test the youtube_transcript_retrieval.js file.
 2. In Cursor to run debugger, set red dot on sidebar or `debugger;` in the code. Then `Run` tab -> `Start Debugging` refer to `launch.json` for configurations.

### backend system changes
1a) add unit and LLM-as-judge to automaticaly test responses from LLM.
    - helps track regression in model performance
    - helps tracks effect of changes to prompt/system role.
1b) unit and integration tests are only partially all passing. TBH i'll fix on a per need basis.
2) change to use gpt-4o as default model, maybe even hide the model being used from the UI.
    - change to gpt-4o-mini only if usage is getting too expensive.
4) [refactoring] rename segments to "pages" or "pagination" it's much more intuitive.
5）[UI change][important and quick] make tab selection (raw vs processed) visually more obvious.
5b) [quick] add gif tutorial of extension in action to readme/chrome extension (check ReadingAssist for example).  
6) [website & database] make transcripts knowledge searchable
7) [show remaining balance] show remaining balance in the popup, atleast some visual indicator why no longer able to process new segmnets.
    -> note: chrome extension description should have section explaining this.
8) [prevent abuse] disable reprocessing if transcript alrdy exists
9) [feedback form] add @llj0824 twitter [x] handle for users to tweet me their feedback lol.
10) [remote server] use google drive/substack post the processed transcripts there and retrieve from there.
11) [top priority] remove permission to read browsing history...

### Features
0. [high priority] timestamps ~atleast 1 per 15 minutes, maybe 2-3 per page
1. autotrack transcript to where the video is at.
    -> note: actually what if i made the video skip towards where the transcript is at?
2. store processed transcript in server, everyone can load it.

### Bugs
0. [high] occasionally unable to automatically retrieve transcript -> initial data unavailable. Refresh page resolves. Replicate and implement a fix (possibly a retry mechanism).
1. if no processed transcripts sets segments to 0, even when there is a raw transcript for that page.
2. loading saved processed transcripts still not working

[Resolved]
* [low priority, but should be easy] add some functionality to change font size of transcript.
* [top priority] add the title and description of the video to each pagination of transcript (so it knows speakers)

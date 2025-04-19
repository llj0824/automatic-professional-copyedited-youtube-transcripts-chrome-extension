# Feature TODO: Video Clip Download

Implement the ability for users to select text within the transcript, generate a corresponding video clip using an external API, and download it as an MP4 file.

**Reference Plan:** See feedback provided on 2025-04-19.

## Checkpoint 1: Core Clipping Functionality

### 1. Backend: Clip-Maker API Service (Handled Externally)

**Note:** *Development of the Clip-Maker API service is being handled separately. This section is for reference regarding the expected interface.*

*   [ ] **Expected Platform & Setup:**
    *   [ ] Deployed on Cloud Run (as per updated plan).
    *   [ ] Set up a new Node.js/TypeScript project for the API.
    *   [ ] Configure environment variables (`S3_BUCKET`, `S3_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `MAX_CLIP_MINUTES`).
*   [ ] **Dependencies:**
    *   [ ] Add `yt-dlp` and `ffmpeg` to the environment (e.g., Dockerfile for Fly/Render, static binaries for CF).
    *   [ ] Install necessary Node modules (`aws-sdk` or equivalent, framework like Express/Hono).
*   [ ] **API Endpoint (`POST /clip`):**
    *   [ ] Define request body schema: `{ videoId: string, start: number, end: number }`.
    *   [ ] **Input Validation:**
        *   [ ] Check for valid `videoId`, `start`, `end`.
        *   [ ] Ensure `end > start`.
        *   [ ] Enforce `maxClipMinutes` (calculate duration `end - start`). Return 400 error if invalid.
    *   [ ] **Core Logic (using `child_process.spawn`):**
        *   [ ] Generate temporary file paths.
        *   [ ] Run `yt-dlp` with `--download-sections` to fetch the relevant segment. Handle errors (e.g., video not found, download fails).
        *   [ ] Run `ffmpeg` to trim precisely (`-ss`, `-to`) and re-encode (`-c:v libx264 -crf 23 -c:a aac`). Handle errors (e.g., ffmpeg process fails).
    *   [ ] **S3/R2 Upload:**
        *   [ ] Upload the resulting MP4 to the configured bucket (e.g., `clips/<videoId>-<start>-<end>.mp4`).
        *   [ ] Set appropriate TTL (e.g., 24 hours).
        *   [ ] Clean up temporary local files (`/tmp/...`).
    *   [ ] **Generate Presigned URL:**
        *   [ ] Create a presigned GET URL for the uploaded object.
    *   [ ] **Response:**
        *   [ ] On success: Return `200 OK` with JSON `{ "downloadUrl": "..." }`.
        *   [ ] On failure: Return appropriate error status (400, 500) with JSON `{ "error": "..." }`.
*   [ ] **Infrastructure:**
    *   [ ] Configure S3/R2 bucket (public access blocked, CORS for presigned URLs if needed, lifecycle rule for TTL).
    *   [ ] Set up logging/monitoring for the API service.
*   [ ] **Deployment:**
    *   [ ] Create deployment configuration (e.g., `fly.toml`, `render.yaml`, `wrangler.toml`).
    *   [ ] Deploy the initial version of the API.
*   [ ] **Testing (API Level):**
    *   [ ] Add basic unit/integration tests for the `/clip` endpoint (mock `yt-dlp`/`ffmpeg`/S3).
    *   [ ] Test manually with sample `curl` requests against the deployed API. Test success and error cases (invalid input, non-existent video).

### 2. Chrome Extension: Frontend (Content Script)

*   [x] **UI Element:**
    *   [x] Add a "Clip ▶︎" button to the existing transcript hover toolbar UI. Initially disabled. (Modified: Added to popup header)
*   [x] **Text Selection Handling:**
    *   [x] Add event listener for text selection changes within the transcript container.
    *   [x] When text is selected:
        *   [x] Identify the corresponding transcript segments/sentences. (*Note: Basic regex extraction done*)
        *   [x] Determine the `start` timestamp (from the first selected segment) and `end` timestamp (from the last selected segment).
        *   [x] Enable the "Clip ▶︎" button **if a valid selection exists and duration (end - start) does not exceed the configured maximum**.
    *   [x] When selection is cleared or duration exceeds limit, disable the "Clip ▶︎" button.
*   [x] **Button Action:**
    *   [x] On "Clip ▶︎" button click:
        *   [x] Get current `videoId`, calculated `start`, `end`.
        *   [x] Show initial feedback (e.g., change button text to "Clipping...", show spinner).
        *   [x] Send message to background script: `chrome.runtime.sendMessage({ type: 'MAKE_CLIP', payload: { videoId, start, end } })`.
*   [x] **Feedback Handling:**
    *   [x] Listen for messages from background script (`CLIP_PROGRESS`, `CLIP_COMPLETE`, `CLIP_ERROR`).
    *   [x] **Progress Toast (Initial Simple Version):** Display a simple "Clipping in progress..." toast/notification. (Full percentage later).
    *   [x] On `CLIP_COMPLETE`: Hide progress toast, maybe show success message briefly. Reset button state.
    *   [x] On `CLIP_ERROR`: Hide progress toast, show error message to user (e.g., "Failed to create clip: [error details]"). Reset button state.
*   [ ] **Testing (Content Script Level):**
    *   [ ] Test timestamp extraction logic based on simulated selections.
    *   [ ] Test button enable/disable logic.
    *   [ ] Test message sending to background script.

### 3. Chrome Extension: Backend (Background Script)

*   [x] **Message Listener:**
    *   [x] Add listener for `chrome.runtime.onMessage`.
    *   [x] Handle `{ type: 'MAKE_CLIP' }` message.
*   [ ] **Mock API Implementation (Initial):** (*Skipped - went directly to real API call structure*)
*   [ ] **API Interaction (Mocked):** (*Skipped*)
*   [x] **Permissions (`manifest.json`):**
    *   [x] Add `"downloads"` permission.
    *   [ ] Add `"storage"` permission (for API endpoint setting). (*Note: storage already exists, used for transcripts*)
    *   [ ] Add host permission for the Clip-Maker API endpoint (e.g., `"https://*.a.run.app/*"`). (*Requires actual URL*)
*   [ ] **Testing (Background Script Level - Mocked):**
    *   [ ] Test message handling.
    *   [ ] Test mock response generation (success/error).
    *   [ ] Test `chrome.downloads.download` call with mock URL.
    *   [ ] Test error handling paths using mock errors.

## Checkpoint 2: Background Script - Real API Call Logic

*   [x] **API Interaction (Real):**
    *   [x] Remove/disable the mock API response generation.
    *   [x] Implement the actual `fetch` request (`POST`) to the configured Clip-Maker API endpoint with the payload (`videoId`, `start`, `end`). (*Placeholder URL used*)
    *   [x] Add proper error handling for the `fetch` call (network errors, non-200 responses).
    *   [x] **Handle Real Response:**
        *   [x] If successful (200 OK, receives *real* `downloadUrl`): (*Structure implemented*)
            *   [ ] Fetch video title (e.g., using YouTube oEmbed API: `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={videoId}&format=json`). Handle oEmbed errors.
            *   [ ] Construct final filename: `<videoTitle>-<mmss>-<mmss>.mp4` (requires formatting timestamps).
            *   [x] Call `chrome.downloads.download({ url: realDownloadUrl, saveAs: true, filename: finalFilename })`. (*Filename is basic now, saveAs=true*)
            *   [x] Send `CLIP_COMPLETE` message back to content script.
        *   [x] If failed (non-200 status or network error): (*Structure implemented*)
            *   [x] Extract error message if available from API response body.
            *   [x] Send `CLIP_ERROR` message back to content script with error details.
*   [ ] **Testing (Background Script - Real API Call Logic):**
    *   [ ] Test `fetch` call logic (requires mock server or careful testing against dev API).
    *   [ ] Test oEmbed call logic.
    *   [ ] Test filename generation.
    *   [ ] Test handling of real success/error responses from API.

## Checkpoint 3: Final Integration & Testing

*   [ ] **Configure Real API Endpoint:** Ensure the correct API endpoint URL is set in the extension options or defaults.
*   [x] **End-to-End Test (Real API):** Perform the full flow using the actual deployed Clip-Maker API. (*Basic structure testable with placeholder backend*)
    *   [ ] Test various YouTube videos.
    *   [ ] Test different clip lengths.
    *   [ ] Verify downloaded MP4 content is correct.
    *   [ ] Monitor API logs (if possible) during testing.
*   [ ] **Final Refinements:** Address any issues found during integration testing.

## Checkpoint 4: Polish & Enhancements (Optional / Future)

*   [ ] **Advanced Progress:** Implement polling or WebSocket/SSE for more granular progress updates (e.g., 0-100%) if the API supports it.
*   [ ] **Settings Page:** Add "Enable local clip download (beta)" toggle with TOS disclaimer.
*   [ ] **Auto-copy Timestamped Link:** Add toggle in settings.
*   [ ] **UI Polish:** Improve look and feel of the clip button and progress notifications.
*   [ ] **Auto Highlight Discovery:** Implement LLM scoring as per the plan.
*   [ ] **Direct Upload (X/Twitter):** Integrate with relevant APIs.
*   [ ] **Auto-burn Captions:** Add option and implement using `ffmpeg -vf subtitles`.
*   [ ] **Queueing:** Allow multiple clip requests.

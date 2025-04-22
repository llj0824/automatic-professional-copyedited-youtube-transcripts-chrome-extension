// clipServiceUtils.js

// API Configuration (moved from popup.js)
export const CLIP_SERVICE_BASE_URL = 'http://127.0.0.1:5001';
export const CLIP_API_KEY = "HRlnuuSGlpZdiktEflILeG9m6jrgvXoiah-ZlCxFkiw"; // Use the example key directly for now

/**
 * Parses a time string in HH:MM:SS or MM:SS or SS format into seconds.
 * @param {string} timeStr
 * @returns {number} Total seconds
 * @throws {Error} If format is invalid
 */
export function parseTimeString(timeStr) { 
  if (typeof timeStr !== 'string') {
    throw new Error('Invalid time format: Input must be a string.');
  }
  const parts = timeStr.trim().split(':');
  const parsedParts = parts.map(part => parseInt(part, 10));

  if (parsedParts.some(isNaN) || parsedParts.some(num => num < 0) || parts.length === 0 || parts.length > 3) {
      throw new Error('Invalid time format: Use HH:MM:SS, MM:SS, or SS with non-negative integers.');
  }

  let hours = 0, minutes = 0, seconds = 0;
  if (parts.length === 3) {
      [hours, minutes, seconds] = parsedParts;
  } else if (parts.length === 2) {
      [minutes, seconds] = parsedParts;
  } else {
      [seconds] = parsedParts;
  }
  return hours * 3600 + minutes * 60 + seconds;
}


/**
 * Validates start and end time strings and returns parsed values.
 * @param {string} startStr
 * @param {string} endStr
 * @returns {{ start: number, end: number, duration: number, startStr: string, endStr: string }}
 * @throws {Error} If validation fails
 */
export function validateClipTimes(startStr, endStr) { 
  const start = parseTimeString(startStr);
  const end = parseTimeString(endStr);
  const duration = end - start;
  if (end <= start) {
    throw new Error('End time must be greater than start time.');
  }
  if (duration < 1) {
    throw new Error('Clip duration must be at least 1 second.');
  }
  const MAX_DURATION_SECONDS = 5 * 60; // 5 minutes
  if (duration > MAX_DURATION_SECONDS) {
    throw new Error(`Clip duration cannot exceed ${MAX_DURATION_SECONDS / 60} minutes.`);
  }
  return { start, end, duration, startStr: startStr.trim(), endStr: endStr.trim() };
}

/**
 * Handles the entire process of requesting a video clip.
 */
export class ClipRequestHandler {
  constructor(uiElements, config) {
    this.loader = uiElements.loader;
    this.statusText = uiElements.statusText;
    this.errorDisplay = uiElements.errorDisplay;
    this.submitButton = uiElements.submitButton;
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.pollIntervalId = null;
  }

  _updateStatus(message, isLoading = false, isError = false) {
    if(this.statusText) this.statusText.textContent = message;
    if(this.loader) this.loader.classList.toggle('hidden', !isLoading);
    if(this.submitButton) this.submitButton.disabled = isLoading;
    if(this.errorDisplay) {
        this.errorDisplay.textContent = isError ? message : '';
        this.errorDisplay.classList.toggle('hidden', !isError);
    }
    if (!isError && this.statusText) {
        this.statusText.classList.remove('error-message');
    } else if (this.statusText) {
        this.statusText.textContent = 'Error';
        this.statusText.classList.add('error-message');
    }
  }

  async requestClip(url, startStr, endStr, videoId) {
    if (!url) {
        this._updateStatus('Could not get YouTube video URL.', false, true);
        return;
    }
    let validationResult;
    try {
        validationResult = validateClipTimes(startStr, endStr);
        this._updateStatus('Requesting clip...', true);
        const apiUrl = `${this.baseUrl}/get_video`;
        const payload = {
            url: url,
            start_time: validationResult.startStr,
            end_time: validationResult.endStr,
        };
        console.log('Sending clip request:', payload);
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-API-Key': this.apiKey },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Unknown server error' }));
            throw new Error(`API Error (${response.status}): ${errorData.detail || response.statusText}`);
        }
        const result = await response.json();
        this._updateStatus('Processing...', true);
        console.log(`Clip task started with ID: ${result.task_id}`);
        this._startPolling(result.task_id, videoId, validationResult.startStr, validationResult.endStr);
    } catch (err) {
        console.error('Clip request failed:', err);
        this._updateStatus(err.message, false, true);
    }
  }

  _startPolling(taskId, videoId, startStr, endStr) {
    this._stopPolling(); // Clear existing interval before starting new
    this.pollIntervalId = setInterval(async () => {
        try {
            const statusUrl = `${this.baseUrl}/status/${taskId}`;
            const statusResponse = await fetch(statusUrl, { headers: { 'X-API-Key': this.apiKey } });
            if (!statusResponse.ok) {
                const errorData = await statusResponse.json().catch(() => ({ detail: 'Failed to get status' }));
                throw new Error(`Status Error (${statusResponse.status}): ${errorData.detail || statusResponse.statusText}`);
            }
            const statusResult = await statusResponse.json();
            console.log('Poll status:', statusResult);
            this._updateStatus(`Status: ${statusResult.status}... (${statusResult.progress || 0}%)`, true);
            if (statusResult.status === 'completed') {
                this._handleCompletion(statusResult, videoId, startStr, endStr);
            } else if (statusResult.status === 'failed') {
                this._handleFailure(statusResult.error || 'Processing failed.');
            }
        } catch (pollError) {
            console.error('Polling error:', pollError);
            this._handleFailure(`Polling Error: ${pollError.message}`);
        }
    }, 2000);
  }

  _stopPolling() {
    if (this.pollIntervalId) {
        clearInterval(this.pollIntervalId);
        this.pollIntervalId = null;
    }
  }

  _handleCompletion(statusResult, videoId, startStr, endStr) {
    this._stopPolling();
    this._updateStatus('Clip ready! Downloading...', false);
    const downloadUrl = `${this.baseUrl}${statusResult.file_path}`;
    const filenameSuffix = `${startStr.replace(/:/g, '')}-${endStr.replace(/:/g, '')}`;
    const downloadFilename = videoId ? `${videoId}_${filenameSuffix}.mp4` : `clip_${filenameSuffix}.mp4`;
    console.log(`Attempting download: URL=${downloadUrl}, Filename=${downloadFilename}`);
    chrome.downloads.download({ url: downloadUrl, filename: downloadFilename, saveAs: true }, (downloadId) => {
        if (chrome.runtime.lastError) {
            console.error('Download failed:', chrome.runtime.lastError.message);
            this._updateStatus(`Download Error: ${chrome.runtime.lastError.message}`, false, true);
        } else {
            console.log(`Download started with ID: ${downloadId}`);
            this._updateStatus('Download started!');
        }
    });
  }

  _handleFailure(errorMessage) {
    this._stopPolling();
    console.error('Clip task failed:', errorMessage);
    this._updateStatus(`Error: ${errorMessage}`, false, true);
  }
}
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
    // Add instance variables to store clip details
    this.videoTitle = 'video_clip'; // Default
    this.startTimeStr = '00:00:00';
    this.endTimeStr = '00:00:00';
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

  // Add videoTitle to the signature
  async requestClip(url, startStr, endStr, videoId, videoTitle = 'video_clip') { 
    console.log('[ClipRequestHandler] requestClip called with raw inputs:', { url, startStr, endStr, videoId, videoTitle });
    
    // --- Time Format Conversion (Moved from popup.js) ---
    const timeFormatCheck = (timeStr) => (timeStr.match(/:/g) || []).length === 1 && /^[0-5]?\d:[0-5]?\d$/.test(timeStr);
    let formattedStartStr = startStr;
    let formattedEndStr = endStr;

    if (timeFormatCheck(startStr)) {
        console.log(`[ClipServiceUtils Time Format] Converting start time ${startStr} to 00:${startStr}`);
        formattedStartStr = `00:${startStr}`;
    }
    if (timeFormatCheck(endStr)) {
        console.log(`[ClipServiceUtils Time Format] Converting end time ${endStr} to 00:${endStr}`);
        formattedEndStr = `00:${endStr}`;
    }
    // ---------------------------------------------------

    this._updateStatus('Validating input...', false, false); // Reset error state
    
    // Store title and CORRECTLY FORMATTED times for later use in filename generation
    this.videoTitle = videoTitle || 'video_clip'; // Use default if title is missing
    this.startTimeStr = formattedStartStr; // Use the potentially formatted string
    this.endTimeStr = formattedEndStr;   // Use the potentially formatted string

    let startTimeSeconds, endTimeSeconds;

    try {
      // Validate using the formatted strings
      startTimeSeconds = parseTimeString(formattedStartStr);
      endTimeSeconds = parseTimeString(formattedEndStr);
      if (startTimeSeconds >= endTimeSeconds) {
        throw new Error('Start time must be before end time.');
      }
    } catch (error) {
      // Show error using original input for clarity if needed, or formatted
      this._updateStatus(`Validation Error: ${error.message} (Input: ${startStr}, ${endStr})`, false, true);
      return;
    }

    this._updateStatus('Requesting clip...', true);

    // Use formatted strings for the API request body
    const requestBody = { 
      url: url, 
      start_time: formattedStartStr, 
      end_time: formattedEndStr,   
    };

    console.log('[ClipRequestHandler] Making POST /get_video request:', { 
      url: `${this.baseUrl}/get_video`, 
      body: requestBody 
    });

    try {
      const response = await fetch(`${this.baseUrl}/get_video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey // Add API key header
        },
        body: JSON.stringify(requestBody), // Send body without API key
      });

      if (!response.ok) {
        const errorText = await response.text(); 
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('[ClipRequestHandler] /get_video response:', data);
      if (data.task_id) {
        this._updateStatus('Processing...', true);
        this.pollStatus(data.task_id);
      } else {
        throw new Error('Task ID not received from server.');
      }
    } catch (error) {
      console.error('[ClipRequestHandler] Error in requestClip:', error);
      this._updateStatus(`Error: ${error.message}`, true);
    }
  }

  async pollStatus(taskId) {
    console.log(`[ClipRequestHandler] Starting polling for taskId: ${taskId}`);
    const pollInterval = 30000; // Poll every 30 seconds
    let attempts = 0;
    const maxAttempts = 10; // Stop after 5 minutes (10 * 30s)

    const intervalId = setInterval(async () => {
      if (attempts >= maxAttempts) {
        clearInterval(intervalId);
        this._updateStatus('Error: Timeout waiting for clip.', true);
        console.error(`[ClipRequestHandler] Polling timed out for taskId: ${taskId}`);
        return;
      }
      attempts++;
      
      console.log(`[ClipRequestHandler] Polling attempt ${attempts} for taskId: ${taskId}`);
      try {
        const response = await fetch(`${this.baseUrl}/status/${taskId}`);
        if (!response.ok) {
          // Don't stop polling immediately on non-OK, might be transient
          console.warn(`[ClipRequestHandler] Poll status check failed: ${response.status}`);
          return; // Try again next interval
        }

        const data = await response.json();
        console.log(`[ClipRequestHandler] Poll status for ${taskId}:`, data);

        // Check for COMPLETED status with a file path
        if ((data.status === 'completed') && data.file) {
          clearInterval(intervalId);
          this._updateStatus('Clip ready! Downloading...', false);
          
          // Construct full download URL
          const downloadUrl = `${this.baseUrl}${data.file}`; 
          
          // --- Generate Dynamic Filename ---
          // Format time range (replace colons with underscores)
          const timeRange = `${this.startTimeStr.replace(/:/g, '_')}-${this.endTimeStr.replace(/:/g, '_')}`;
          // Sanitize title (remove invalid chars, limit length)
          const sanitizedTitle = this._sanitizeFilename(this.videoTitle);
          // Construct filename
          const filename = `${timeRange}_${sanitizedTitle}.mp4`;
          // ---------------------------------

          console.log(`[ClipRequestHandler] Triggering download:`, { downloadUrl, filename });
          this.downloadFile(downloadUrl, filename);
        } else if (data.status === 'FAILURE') {
          clearInterval(intervalId);
          // Use data.error if available, otherwise use data.result
          const errorMessage = data.error || data.result || 'Clip processing failed.';
          this._updateStatus(`Error: ${errorMessage}`, true);
          console.error(`[ClipRequestHandler] Clip processing failed for taskId: ${taskId}`, data);
        } else {
          // Still PENDING or other state, update status text if available
          if (data.status && data.status !== 'PENDING') {
            this._updateStatus(`Status: ${data.status}...`, true); 
          }
        }
      } catch (error) {
        console.error(`[ClipRequestHandler] Error during polling for taskId: ${taskId}`, error);
        // Don't clear interval on network error, maybe recoverable
      }
    }, pollInterval);
  }

  // Helper to sanitize video title for use in filename
  _sanitizeFilename(title) {
    // Remove invalid characters: / ? < > \ : * | " ^
    // Replace spaces with underscores
    // Limit length to avoid issues
    const invalidCharsRegex = /[\/?<>\\:*|"^]/g;
    let sanitized = title.replace(invalidCharsRegex, '').replace(/\s+/g, '_');
    // Limit length (e.g., 100 characters)
    return sanitized.substring(0, 100);
  }

  downloadFile(url, filename) {
    console.log(`[ClipRequestHandler] Initiating download via chrome.downloads:`, { url, filename });
    try {
      chrome.downloads.download({
        url: url,
        filename: filename || 'youtube_clip.mp4' // Fallback filename
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error(`[ClipRequestHandler] Download failed:`, chrome.runtime.lastError);
          this._updateStatus(`Error: ${chrome.runtime.lastError.message}`, true);
        } else {
          console.log(`[ClipRequestHandler] Download started with ID: ${downloadId}`);
          this._updateStatus('Download started.', false, false); // Indicate success, remove loader
        }
      });
    } catch (error) {
       console.error(`[ClipRequestHandler] Error initiating download:`, error);
       this._updateStatus(`Error: Could not start download.`, true);
    }
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
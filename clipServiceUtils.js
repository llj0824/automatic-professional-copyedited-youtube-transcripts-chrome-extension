// clipServiceUtils.js
// Utility functions for parsing and validating clip times
/**
 * Parses a time string in HH:MM:SS or MM:SS or SS format into seconds.
 * @param {string} timeStr
 * @returns {number} Total seconds
 * @throws {Error} If format is invalid
 */
function parseTimeString(timeStr) {
  if (typeof timeStr !== 'string') {
    throw new Error('Invalid time format');
  }
  const parts = timeStr.trim().split(':');
  if (parts.length < 1 || parts.length > 3) {
    throw new Error('Invalid time format');
  }
  let hours = 0, minutes = 0, seconds = 0;
  if (parts.length === 3) {
    hours = Number(parts[0]);
    minutes = Number(parts[1]);
    seconds = Number(parts[2]);
  } else if (parts.length === 2) {
    minutes = Number(parts[0]);
    seconds = Number(parts[1]);
  } else {
    seconds = Number(parts[0]);
  }
  [hours, minutes, seconds].forEach((val) => {
    if (!Number.isInteger(val) || val < 0) {
      throw new Error('Invalid time format');
    }
  });
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Validates start and end time strings and returns parsed values.
 * @param {string} startStr
 * @param {string} endStr
 * @returns {{ start: number, end: number, duration: number }}
 * @throws {Error} If validation fails
 */
function validateClipTimes(startStr, endStr) {
  const start = parseTimeString(startStr);
  const end = parseTimeString(endStr);
  const duration = end - start;
  if (end <= start) {
    throw new Error('End time must be greater than start time');
  }
  if (duration < 1) {
    throw new Error('Clip duration must be at least 1 second');
  }
  if (duration > 300) {
    throw new Error('Clip duration must be at most 5 minutes');
  }
  return { start, end, duration };
}

module.exports = { parseTimeString, validateClipTimes };
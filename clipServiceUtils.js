// clipServiceUtils.js
// Utility functions for parsing and validating clip times
/**
 * Parses a time string in HH:MM:SS or MM:SS or SS format into seconds.
 * @param {string} timeStr
 * @returns {number} Total seconds
 * @throws {Error} If format is invalid
 */
function parseTimeString(timeStr) {
  throw new Error('Not implemented');
}

/**
 * Validates start and end time strings and returns parsed values.
 * @param {string} startStr
 * @param {string} endStr
 * @returns {{ start: number, end: number, duration: number }}
 * @throws {Error} If validation fails
 */
function validateClipTimes(startStr, endStr) {
  throw new Error('Not implemented');
}

module.exports = { parseTimeString, validateClipTimes };
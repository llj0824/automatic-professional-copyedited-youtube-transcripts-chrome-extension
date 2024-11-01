import { paginateTranscript } from '../popup/popup.js';

import raw from '../llm_responses/raw_transcript';
const sampleRawTranscript = raw;

describe('paginateTranscript', () => {
  it('should parse timestamps and text correctly', () => {
    const input = '[00:00] Hello\n[00:05] World';
    const expected = [
      { timestamp: 0, text: 'Hello' },
      { timestamp: 5, text: 'World' }
    ];
    expect(paginateTranscript(input)).toEqual(expected);
  });

  it('should handle empty input', () => {
    expect(paginateTranscript('')).toEqual([]);
  });

  it('should handle malformed input', () => {
    const cases = [
      'Invalid transcript',
      '[00:00] Only timestamp',
      'No timestamp: Hello',
      '[invalid] Hello',
      '[99:99] Invalid time'
    ];

    cases.forEach(input => {
      expect(paginateTranscript(input)).toEqual([]);
    });
  });

  it('should handle multiple line formats', () => {
    const input = `[00:00] First line
[00:05] Second line
[00:10] Third line`;
    
    const expected = [
      { timestamp: 0, text: 'First line' },
      { timestamp: 5, text: 'Second line' },
      { timestamp: 10, text: 'Third line' }
    ];
    
    expect(paginateTranscript(input)).toEqual(expected);
  });

  it('should convert timestamps to seconds correctly', () => {
    const input = `[01:30] One minute thirty
[02:00] Two minutes
[00:45] Forty five seconds`;
    
    const expected = [
      { timestamp: 90, text: 'One minute thirty' },
      { timestamp: 120, text: 'Two minutes' },
      { timestamp: 45, text: 'Forty five seconds' }
    ];
    
    expect(paginateTranscript(input)).toEqual(expected);
  });
});
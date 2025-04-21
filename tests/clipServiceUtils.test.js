// tests/clipServiceUtils.test.js
const { parseTimeString, validateClipTimes } = require('../clipServiceUtils');

describe('parseTimeString', () => {
  test('parses "00:00:10" to 10 seconds', () => {
    expect(parseTimeString('00:00:10')).toBe(10);
  });

  test('parses "1:23" to 83 seconds', () => {
    expect(parseTimeString('1:23')).toBe(83);
  });

  test('parses "2:03:04" to 7384 seconds', () => {
    expect(parseTimeString('2:03:04')).toBe(2 * 3600 + 3 * 60 + 4);
  });

  test('throws error for invalid format', () => {
    expect(() => parseTimeString('invalid')).toThrow();
  });
});

describe('validateClipTimes', () => {
  test('valid times within range pass', () => {
    const { start, end, duration } = validateClipTimes('00:00:10', '00:04:00');
    expect(start).toBe(10);
    expect(end).toBe(240);
    expect(duration).toBe(230);
  });

  test('throws error if end <= start', () => {
    expect(() => validateClipTimes('00:01:00', '00:01:00')).toThrow();
    expect(() => validateClipTimes('00:02:00', '00:01:00')).toThrow();
  });

  test('throws error if duration < 1 second', () => {
    expect(() => validateClipTimes('00:00:01', '00:00:01')).toThrow();
  });

  test('throws error if duration > 5 minutes', () => {
    const start = '00:00:00';
    const end = '00:06:00'; // 6 minutes
    expect(() => validateClipTimes(start, end)).toThrow();
  });

  test('validates boundary durations correctly', () => {
    // 1 second duration passes
    const res1 = validateClipTimes('00:00:00', '00:00:01');
    expect(res1.duration).toBe(1);
    // 5 minute duration passes
    const res2 = validateClipTimes('00:00:00', '00:05:00');
    expect(res2.duration).toBe(300);
  });
});
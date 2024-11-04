const { paginateRawTranscript, paginateProcessedTranscript } = require('../popup/popup.js');
const fs = require('fs');
const path = require('path');


// Get current file's directory in CommonJS
const __dirname = path.dirname(__filename); // __dirname is already available in CommonJS

// Read test data files using path.join
const raw = fs.readFileSync(path.join(__dirname, '../llm_responses/raw_transcript.txt'), 'utf8');
const processed = fs.readFileSync(path.join(__dirname, '../llm_responses/gpt-40-mini_processed_transcript.txt'), 'utf8');

describe('Transcript Parsing', () => {
  describe('paginateRawTranscript', () => {
    it('should handle sample raw transcript data', () => {
      const pages = paginateRawTranscript(raw);
      expect(pages).toBeInstanceOf(Array);
      expect(pages.length).toBeGreaterThan(0);

      // Check first page format
      const firstPage = pages[0];
      expect(firstPage).toContain('[00:01]');
      expect(firstPage).toContain('Joe Rogan');
    });

    it('should split pages at PAGE_DURATION intervals', () => {
      const input = `[00:01] First page
[14:59] End of First Page 
[15:00] Start of Second Page
[29:59] End of Second Page`;

      const pages = paginateRawTranscript(input);
      expect(pages.length).toBe(2);
      const firstPage = pages[0];
      expect(firstPage).toContain('[00:01]');
      expect(firstPage).toContain('[14:59]');
      const secondPage = pages[1];
      expect(secondPage).toContain('[15:00]');
      expect(secondPage).toContain('[29:59]');
    });

    it('should handle empty input', () => {
      const pages = paginateRawTranscript('');
      expect(pages).toEqual([]);
    });
  });

  describe.only('paginateProcessedTranscript', () => {
    it('should handle sample processed transcript data', () => {
      const pages = paginateProcessedTranscript(processed);
      expect(pages).toBeInstanceOf(Array);
      expect(pages.length).toBeGreaterThan(0);

      // Check first page format
      const firstPage = pages[0];
      // Would match: [00:00 -> 12:34], [99:99 -> 00:00]
      // Would not match: [0:00 -> 12:34], [00:0 -> 00:00], [00:00->12:34], [00:00 - 12:34]
      expect(firstPage).toMatch(/\[\d{2}:\d{2} -> \d{2}:\d{2}\]/);
    });

    // Test basic timestamp range splitting
    it('should split pages based on timestamp ranges', () => {
      const input = `[00:00 -> 07:30] First page
[07:31 -> 14:59] First Page Continued
[15:00 -> 22:30] Second page
[30:01 -> 44:30] Third page`;

      const pages = paginateProcessedTranscript(input);
      expect(pages.length).toBe(3); // Split at 15 minute mark
      expect(pages[0]).toMatch(/\[00:00 -> 07:30\]/);
      expect(pages[0]).not.toMatch(/\[00:01\]/);
      expect(pages[1]).toMatch(/\[15:00 -> 22:30]/);
      expect(pages[2]).toMatch(/\[30:01 -> 44:30\]/);
    });

    // Test handling of timestamp ranges that span across page boundaries
    it('should handle ranges spanning multiple pages, by using start time of range', () => {
      const input = `[00:00 -> 07:30] First page
[07:31 -> 10:30] First Page Continued
[10:30 -> 20:30] Cross-page page`;

      const pages = paginateProcessedTranscript(input);
      expect(pages.length).toBe(1);

      // Cross-page content (10:30->20:30) should appear on first page
      // since it starts before the page boundary
      expect(pages[0]).toContain('[10:30 -> 20:30]');
      expect(pages[0]).toContain('[10:30 -> 20:30] Cross-page page');
    });

    it('should handle empty input', () => {
      const pages = paginateProcessedTranscript('');
      expect(pages).toEqual([]);
    });
  });

  describe('Combined Functionality', () => {
    it('should handle both raw and processed transcripts independently', () => {
      const rawPages = paginateRawTranscript(raw);
      const processedPages = paginateProcessedTranscript(processed);

      expect(rawPages).toBeInstanceOf(Array);
      expect(processedPages).toBeInstanceOf(Array);
      expect(rawPages.length).toBeGreaterThan(0);
      expect(processedPages.length).toBeGreaterThan(0);
    });

    it('should maintain timestamp format integrity', () => {
      const rawPages = paginateRawTranscript(raw);
      const processedPages = paginateProcessedTranscript(processed);

      // Check raw transcript timestamp format
      expect(rawPages[0]).toMatch(/\[\d{2}:\d{2}\]/);

      // Check processed transcript timestamp format
      expect(processedPages[0]).toMatch(/\[\d{2}:\d{2} -> \d{2}:\d{2}\]/);
    });
  });
});
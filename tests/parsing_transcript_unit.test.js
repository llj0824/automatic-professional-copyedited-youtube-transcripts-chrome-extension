const { paginateRawTranscript, paginateProcessedTranscript } = require('../popup/popup.js');
const fs = require('fs');
const path = require('path');


// Get current file's directory in CommonJS
const __dirname = path.dirname(__filename); // __dirname is already available in CommonJS

// Read test data files using path.join
const raw = fs.readFileSync(path.join(__dirname, '../llm_responses/raw_transcript.txt'), 'utf8');
const processed = fs.readFileSync(path.join(__dirname, '../llm_responses/gpt-40-mini_processed_transcript.txt'), 'utf8');

describe('Transcript Parsing', () => {
  describe.only('paginateRawTranscript', () => {
    it('should handle sample raw transcript data', () => {
      const pages = paginateRawTranscript(raw);
      expect(pages).toBeInstanceOf(Array);
      expect(pages.length).toBeGreaterThan(0);
      
      // Check first page format
      const firstPage = pages[0];
      expect(firstPage).toContain('[00:01]');
      expect(firstPage).toContain('Joe Rogan:');
    });

    it('should split pages at PAGE_DURATION intervals', () => {
      const input = `[00:00] First line
[14:59] Before split
[15:00] After split
[29:59] Last line`;
      
      const pages = paginateRawTranscript(input);
      expect(pages.length).toBe(2);
      expect(pages[0]).toContain('[00:00]');
      expect(pages[0]).toContain('[14:59]');
      expect(pages[1]).toContain('[15:00]');
      expect(pages[1]).toContain('[29:59]');
    });

    it('should handle empty input', () => {
      const pages = paginateRawTranscript('');
      expect(pages).toEqual(['No raw transcript available.']);
    });
  });

  describe('paginateProcessedTranscript', () => {
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

    it('should split pages based on timestamp ranges', () => {
      const input = `[00:00 -> 07:30] First page
[07:31 -> 14:59] First Page Continued
[15:00 -> 22:30] Third page`;
      
      const pages = paginateProcessedTranscript(input);
      expect(pages.length).toBe(2); // Split at 15 minute mark
      expect(pages[0]).toContain('[00:00 -> 07:30]');
      expect(pages[0]).toContain('[07:31 -> 14:59]');
      expect(pages[1]).toContain('[15:00 -> 22:30]');
    });

    it('should handle empty input', () => {
      const pages = paginateProcessedTranscript('');
      expect(pages).toEqual(['No processed transcript available.']);
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
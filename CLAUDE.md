# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Setup
```bash
npm install
```

### Testing
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:popup                    # Test popup functionality
npm run test:popup_unit               # Test popup unit tests
npm run test:parsing_tests            # Test transcript parsing
npm run test:llm_response_tests       # Test LLM response handling
npm run test:llm_highlight_optimization  # Test highlight prompt optimization
npm run test:llm_api_tests           # Test LLM API integration
npm run test:youtube_transcript_retrieval  # Test YouTube transcript retrieval
npm run test:integration             # Run integration tests
```

### Building
```bash
# Build for development (creates dist/ directory)
npm run build:extension

# Build for Chrome Web Store submission (creates .zip file)
./build_chrome_publication.sh
```

### Local Development
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the project directory
4. The extension will appear with a red head icon

## Architecture Overview

This is a Chrome extension that provides professionally copyedited YouTube transcripts using LLM processing. The architecture consists of:

### Core Components

1. **Service Worker** (`background/service_worker.js`)
   - Manages side panel visibility based on active tab
   - Only shows panel on YouTube.com pages
   - Handles extension lifecycle events

2. **Popup/Side Panel UI** (`popup/`)
   - `popup.js`: Main orchestrator that handles:
     - Tab switching between Raw, Processed, and Highlights views
     - Transcript retrieval from YouTube
     - LLM processing coordination
     - Storage management
     - Pagination (30-minute segments)
   - `youtube_transcript_retrival.js`: Scrapes YouTube pages for:
     - Video metadata (title, description)
     - Caption tracks and raw transcripts
     - Video ID extraction
   - `llm_api_utils.js`: Manages LLM interactions:
     - Supports OpenAI and Anthropic APIs
     - Handles transcript copyediting and highlight generation
     - Implements parallel processing for transcript partitions
   - `storage_utils.js`: Chrome storage abstraction for:
     - Raw/processed transcripts by video ID
     - Highlights by video ID and page
     - User settings (font size)
   - `logger.js`: Event logging to external Google Apps Script endpoint
   - `clipServiceUtils.js`: Integration with external clip service

3. **Build System**
   - Webpack configuration for bundling (though not actively used)
   - Bash script for production builds with minification
   - Creates optimized Chrome extension packages

### Data Flow

1. User opens extension on YouTube video page
2. Extension extracts video ID from current tab
3. Attempts to load existing transcript from storage
4. If not found, retrieves transcript from YouTube using scraping
5. User can process transcript with LLM (OpenAI GPT-4o-mini by default)
6. Processed transcripts are paginated (30-minute segments)
7. Results are stored in Chrome local storage

### Key Implementation Details

- **Transcript Pagination**: 30-minute segments for readability
- **LLM Processing**: Splits transcripts into smaller partitions for parallel processing
- **Storage Keys**: Format `transcript_${videoId}` for raw, `processed_transcript_${videoId}` for processed
- **API Keys**: Obfuscated in `keys.js` using XOR encryption
- **Logging**: Structured events sent to Google Apps Script for monitoring

## Common Issues & Solutions

1. **Transcript Retrieval Failures**
   - Often requires page refresh if captions aren't immediately available
   - Check if YouTube video has captions enabled

2. **Storage Persistence**
   - Known bug: Pages 3+ sometimes don't persist properly
   - Check Chrome storage limits if issues occur

3. **LLM Processing**
   - Default model is GPT-4o-mini (optimized prompts)
   - Anthropic Claude also supported but requires API key

## Testing Strategy

- Unit tests for parsing and utility functions
- Integration tests using Puppeteer for browser automation
- LLM response validation tests for quality assurance
- Test individual components with specific npm scripts
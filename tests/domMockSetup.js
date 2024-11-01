// tests/domMockSetup.js
import { JSDOM } from 'jsdom';

export function domMockSetup() {
  // Create a new JSDOM instance first
  const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);

  // Set up global objects
  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = { userAgent: 'node.js' };

  // Now set the innerHTML
  document.body.innerHTML = `
      <div class="container">
        <h2>YouTube Transcript Manager</h2>
        <div id="transcript-section">
          <button id="prev-btn" disabled>&larr; Previous</button>
          <span id="segment-info">Segment 1</span>
          <button id="next-btn" disabled>Next &rarr;</button>
        </div>
        <div id="content-section">
          <div class="tabs">
            <button class="tab-button active" data-tab="raw">Raw Transcript</button>
            <button class="tab-button" data-tab="processed">Processed Output</button>
          </div>
          <div class="tab-content" id="raw">
            <pre id="transcript-display">Loading transcript...</pre>
          </div>
          <div class="tab-content hidden" id="processed">
            <pre id="processed-display">Processed output will appear here.</pre>
          </div>
        </div>
        <div id="actions">
          <button id="process-btn">Process with LLM</button>
          <div id="loader" class="hidden"></div>
        </div>
        <div id="api-section">
          <h3>LLM Configuration</h3>
          <div id="api-key-inputs">
            <div class="api-key-group">
              <label for="openai-api-key">OpenAI API Key:</label>
              <input type="password" id="openai-api-key" placeholder="Enter your OpenAI API key" value="mockOpenAIKey">
            </div>
            <div class="api-key-group">
              <label for="anthropic-api-key">Anthropic Claude API Key:</label>
              <input type="password" id="anthropic-api-key" placeholder="Enter your Anthropic API key" value="mockAnthropicKey">
            </div>
            <button id="save-keys-btn">Save API Keys</button>
          </div>
          <div id="model-selection">
            <label for="model-select">Select LLM Model:</label>
            <select id="model-select">
              <option value="gpt-4o">OpenAI GPT-4o</option>
              <option value="claude-3-5-sonnet-20240620">Anthropic Claude 3.5 Sonnet</option>
            </select>
          </div>
        </div>
        <div id="transcript-input-section">
          <h3>Load Transcript</h3>
          <textarea id="transcript-input" placeholder="Paste your transcript here..." rows="5" cols="50"></textarea>
          <button id="load-transcript-btn">Load Transcript</button>
        </div>
      </div>
    `;

  // Add any required DOM methods that might be missing
  dom.window.document.getElementsByClassName = function (className) {
    return this.querySelectorAll('.' + className);
  };

  // Setup classList methods for elements
  const elements = dom.window.document.querySelectorAll('*');
  elements.forEach(element => {
    element.classList = {
      add: jest.fn(),
      remove: jest.fn(),
      toggle: jest.fn(),
      contains: jest.fn()
    };
  });

  // Return both window and document objects
  return document;
}
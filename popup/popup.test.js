/**
 * @jest-environment jsdom
 */

import fs from 'fs';
import path from 'path';
import { LLM_API_Utils } from './llm_api_utils.js';

// Mock LLM_API_Utils
jest.mock('./llm_api_utils.js', () => {
  return {
    LLM_API_Utils: jest.fn().mockImplementation(() => {
      return {
        loadApiKeys: jest.fn().mockResolvedValue(),
        call_llm: jest.fn().mockResolvedValue('Processed output'),
        openai_api_key: 'test-openai-key',
        anthropic_api_key: 'test-anthropic-key',
        saveApiKeys: jest.fn().mockResolvedValue(),
      };
    }),
  };
});

describe('popup.js', () => {
  let dom;
  let document;
  let window;

  beforeEach(() => {
    const html = fs.readFileSync(path.resolve(__dirname, 'popup.html'), 'utf8');
    dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable' });
    window = dom.window;
    document = window.document;

    // Mock global variables
    global.document = document;
    global.window = window;

    // Set up the DOM elements required by popup.js
    document.body.innerHTML = `
      <div id="transcript-display"></div>
      <div id="processed-display"></div>
      <button id="prev-btn"></button>
      <button id="next-btn"></button>
      <div id="segment-info"></div>
      <button id="process-btn"></button>
      <div id="loader" class="hidden"></div>
      <button class="tab-button" data-tab="tab1">Tab 1</button>
      <button class="tab-button" data-tab="tab2">Tab 2</button>
      <div id="tab1" class="tab-content hidden"></div>
      <div id="tab2" class="tab-content hidden"></div>
      <input id="openai-api-key" type="text" />
      <input id="anthropic-api-key" type="text" />
      <button id="save-keys-btn"></button>
      <select id="model-select">
        <option value="model1">Model 1</option>
        <option value="model2">Model 2</option>
      </select>
      <textarea id="transcript-input"></textarea>
      <button id="load-transcript-btn"></button>
    `;

    // Load the popup.js script
    const scriptContent = fs.readFileSync(path.resolve(__dirname, 'popup.js'), 'utf8');
    const scriptEl = document.createElement('script');
    scriptEl.textContent = scriptContent;
    document.body.appendChild(scriptEl);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should load API keys into UI on initialization', async () => {
    const llmUtilsInstance = LLM_API_Utils.mock.instances[0];
    await window.initializePopup();

    expect(llmUtilsInstance.loadApiKeys).toHaveBeenCalled();
    expect(document.getElementById('openai-api-key').value).toBe('test-openai-key');
    expect(document.getElementById('anthropic-api-key').value).toBe('test-anthropic-key');
  });

  test('should save API keys when save button is clicked', async () => {
    const llmUtilsInstance = LLM_API_Utils.mock.instances[0];
    window.initializePopup();

    const openaiInput = document.getElementById('openai-api-key');
    const anthropicInput = document.getElementById('anthropic-api-key');
    const saveBtn = document.getElementById('save-keys-btn');

    openaiInput.value = 'new-openai-key';
    anthropicInput.value = 'new-anthropic-key';

    // Mock alert
    window.alert = jest.fn();

    // Simulate click
    saveBtn.click();

    // Wait for async operations
    await Promise.resolve();

    expect(llmUtilsInstance.saveApiKeys).toHaveBeenCalledWith('new-openai-key', 'new-anthropic-key');
    expect(window.alert).toHaveBeenCalledWith('API Keys saved successfully!');
  });

  test('should handle empty API keys when saving', async () => {
    const llmUtilsInstance = LLM_API_Utils.mock.instances[0];
    window.initializePopup();

    const openaiInput = document.getElementById('openai-api-key');
    const anthropicInput = document.getElementById('anthropic-api-key');
    const saveBtn = document.getElementById('save-keys-btn');

    openaiInput.value = '';
    anthropicInput.value = '';

    // Mock alert
    window.alert = jest.fn();

    // Simulate click
    saveBtn.click();

    // Wait for async operations
    await Promise.resolve();

    expect(llmUtilsInstance.saveApiKeys).toHaveBeenCalledWith('', '');
    expect(window.alert).toHaveBeenCalledWith('API Keys saved successfully!');
  });

  test('should load and parse a valid transcript', async () => {
    window.initializePopup();

    const loadTranscriptBtn = document.getElementById('load-transcript-btn');
    const transcriptInput = document.getElementById('transcript-input');

    const rawTranscript = `
    [0:30] Hello, this is a test transcript.
    [15:00] Continuing the transcript here.
    [30:30] Another segment of the transcript.
    `;

    transcriptInput.value = rawTranscript;

    // Mock alert
    window.alert = jest.fn();

    // Simulate click
    loadTranscriptBtn.click();

    // Wait for async operations
    await Promise.resolve();

    // Verify that transcript is split into segments correctly
    expect(document.getElementById('transcript-display').textContent).toContain('Hello, this is a test transcript.');
    expect(document.getElementById('segment-info').textContent).toBe('Segment 1 of 2');
    expect(document.getElementById('processed-display').textContent).toBe('Processed output will appear here.');

    expect(window.alert).toHaveBeenCalledWith('Transcript loaded successfully!');
  });

  test('should handle empty transcript input', async () => {
    window.initializePopup();

    const loadTranscriptBtn = document.getElementById('load-transcript-btn');
    const transcriptInput = document.getElementById('transcript-input');

    transcriptInput.value = '';

    // Mock alert
    window.alert = jest.fn();

    // Simulate click
    loadTranscriptBtn.click();

    // Wait for async operations
    await Promise.resolve();

    expect(window.alert).toHaveBeenCalledWith('Please enter a transcript.');
  });

  test('should paginate transcript segments correctly', async () => {
    window.initializePopup();

    const loadTranscriptBtn = document.getElementById('load-transcript-btn');
    const transcriptInput = document.getElementById('transcript-input');

    // Create a transcript with multiple segments
    const rawTranscript = `
    [0:00] Segment 1.
    [15:00] Segment 2.
    [30:00] Segment 3.
    [45:00] Segment 4.
    `;

    transcriptInput.value = rawTranscript;

    // Mock alert
    window.alert = jest.fn();

    // Simulate click
    loadTranscriptBtn.click();

    // Wait for async operations
    await Promise.resolve();

    expect(document.getElementById('segment-info').textContent).toBe('Segment 1 of 3');
    expect(document.getElementById('transcript-display').textContent).toContain('Segment 1.');
  });

  test('should navigate to next segment on next button click', async () => {
    window.initializePopup();

    const loadTranscriptBtn = document.getElementById('load-transcript-btn');
    const transcriptInput = document.getElementById('transcript-input');
    const nextBtn = document.getElementById('next-btn');

    const rawTranscript = `
    [0:00] Segment 1.
    [15:00] Segment 2.
    `;

    transcriptInput.value = rawTranscript;

    // Mock alert
    window.alert = jest.fn();

    // Simulate click
    loadTranscriptBtn.click();
    await Promise.resolve();

    // Initially on first segment
    expect(document.getElementById('segment-info').textContent).toBe('Segment 1 of 2');
    expect(nextBtn.disabled).toBe(false);

    // Click next
    nextBtn.click();
    await Promise.resolve();

    expect(document.getElementById('segment-info').textContent).toBe('Segment 2 of 2');
    expect(nextBtn.disabled).toBe(true);

    // Previous button should be enabled
    const prevBtn = document.getElementById('prev-btn');
    expect(prevBtn.disabled).toBe(false);
  });

  test('should switch tabs correctly', () => {
    window.initializePopup();

    const tabButtons = document.querySelectorAll('.tab-button');
    const tab1 = document.getElementById('tab1');
    const tab2 = document.getElementById('tab2');

    // Initially, all tabs are hidden
    expect(tab1.classList.contains('hidden')).toBe(true);
    expect(tab2.classList.contains('hidden')).toBe(true);

    // Click on first tab
    const firstTabButton = tabButtons[0];
    firstTabButton.click();

    // First tab content should be visible
    expect(tab1.classList.contains('hidden')).toBe(false);
    expect(tab2.classList.contains('hidden')).toBe(true);
    expect(firstTabButton.classList.contains('active')).toBe(true);

    // Click on second tab
    const secondTabButton = tabButtons[1];
    secondTabButton.click();

    // Second tab content should be visible
    expect(tab1.classList.contains('hidden')).toBe(true);
    expect(tab2.classList.contains('hidden')).toBe(false);
    expect(secondTabButton.classList.contains('active')).toBe(true);
  });

  test('should process a transcript segment with LLM', async () => {
    window.initializePopup();

    const loadTranscriptBtn = document.getElementById('load-transcript-btn');
    const transcriptInput = document.getElementById('transcript-input');
    const processBtn = document.getElementById('process-btn');
    const modelSelect = document.getElementById('model-select');
    const loader = document.getElementById('loader');
    const processedDisplay = document.getElementById('processed-display');

    const rawTranscript = `
    [0:00] Segment to process.
    `;

    transcriptInput.value = rawTranscript;

    // Mock alert
    window.alert = jest.fn();

    // Simulate transcript loading
    loadTranscriptBtn.click();
    await Promise.resolve();

    // Select model
    modelSelect.value = 'model1';

    // Simulate click on process
    processBtn.click();

    // Loader should be visible
    expect(loader.classList.contains('hidden')).toBe(false);
    expect(processedDisplay.textContent).toBe('Processing...');

    // Wait for async operations
    await Promise.resolve();

    // Processed display should be updated
    expect(processedDisplay.textContent).toBe('Processed output');
    // Loader should be hidden
    expect(loader.classList.contains('hidden')).toBe(true);

    const llmUtilsInstance = LLM_API_Utils.mock.instances[0];
    expect(llmUtilsInstance.call_llm).toHaveBeenCalledWith(
      'model1',
      'You are an assistant that summarizes and analyzes YouTube video transcripts.',
      expect.stringContaining('Segment to process.')
    );
  });

  test('should handle LLM processing errors gracefully', async () => {
    const mockCallLlm = jest.fn().mockRejectedValue(new Error('LLM Error'));
    LLM_API_Utils.mockImplementation(() => {
      return {
        loadApiKeys: jest.fn().mockResolvedValue(),
        call_llm: mockCallLlm,
        openai_api_key: 'test-openai-key',
        anthropic_api_key: 'test-anthropic-key',
        saveApiKeys: jest.fn().mockResolvedValue(),
      };
    });

    window.initializePopup();

    const loadTranscriptBtn = document.getElementById('load-transcript-btn');
    const transcriptInput = document.getElementById('transcript-input');
    const processBtn = document.getElementById('process-btn');
    const modelSelect = document.getElementById('model-select');
    const loader = document.getElementById('loader');
    const processedDisplay = document.getElementById('processed-display');

    const rawTranscript = `
    [0:00] Segment to process.
    `;

    transcriptInput.value = rawTranscript;

    // Mock alert
    window.alert = jest.fn();

    // Simulate transcript loading
    loadTranscriptBtn.click();
    await Promise.resolve();

    // Select model
    modelSelect.value = 'model1';

    // Simulate click on process
    processBtn.click();

    // Loader should be visible
    expect(loader.classList.contains('hidden')).toBe(false);
    expect(processedDisplay.textContent).toBe('Processing...');

    // Wait for async operations
    await Promise.resolve();

    // Processed display should show error
    expect(processedDisplay.textContent).toBe('Error processing with LLM.');
    // Loader should be hidden
    expect(loader.classList.contains('hidden')).toBe(true);
  });

  test('formatTime should correctly format seconds to mm:ss', () => {
    const formatTime = window.formatTime;

    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(75)).toBe('1:15');
    expect(formatTime(3599)).toBe('59:59');
  });

  test('formatTimestamp should correctly format seconds to mm:ss', () => {
    const formatTimestamp = window.formatTimestamp;

    expect(formatTimestamp(0)).toBe('0:00');
    expect(formatTimestamp(75)).toBe('1:15');
    expect(formatTimestamp(3599)).toBe('59:59');
  });
});

test('should process a transcript segment with LLM', async () => {
    window.initializePopup();

    const loadTranscriptBtn = document.getElementById('load-transcript-btn');
    const transcriptInput = document.getElementById('transcript-input');
    const processBtn = document.getElementById('process-btn');
    const modelSelect = document.getElementById('model-select');
    const loader = document.getElementById('loader');
    const processedDisplay = document.getElementById('processed-display');

    const rawTranscript = `
    [0:00] Segment to process.
    `;

    transcriptInput.value = rawTranscript;

    // Mock alert
    window.alert = jest.fn();

    // Simulate transcript loading
    loadTranscriptBtn.click();
    await Promise.resolve();

    // Select model
    modelSelect.value = 'model1';

    // Simulate click on process
    processBtn.click();

    // Loader should be visible
    expect(loader.classList.contains('hidden')).toBe(false);
    expect(processedDisplay.textContent).toBe('Processing...');

    // Wait for async operations
    await Promise.resolve();

    // Processed display should be updated
    expect(processedDisplay.textContent).toBe('Processed output');
    // Loader should be hidden
    expect(loader.classList.contains('hidden')).toBe(true);

    const llmUtilsInstance = LLM_API_Utils.mock.instances[0];
    expect(llmUtilsInstance.call_llm).toHaveBeenCalledWith(
      'model1',
      'You are an assistant that summarizes and analyzes YouTube video transcripts.',
      expect.stringContaining('Segment to process.')
    );
  });

  test('should handle LLM processing errors gracefully', async () => {
    const mockCallLlm = jest.fn().mockRejectedValue(new Error('LLM Error'));
    LLM_API_Utils.mockImplementation(() => {
      return {
        loadApiKeys: jest.fn().mockResolvedValue(),
        call_llm: mockCallLlm,
        openai_api_key: 'test-openai-key',
        anthropic_api_key: 'test-anthropic-key',
        saveApiKeys: jest.fn().mockResolvedValue(),
      };
    });

    window.initializePopup();

    const loadTranscriptBtn = document.getElementById('load-transcript-btn');
    const transcriptInput = document.getElementById('transcript-input');
    const processBtn = document.getElementById('process-btn');
    const modelSelect = document.getElementById('model-select');
    const loader = document.getElementById('loader');
    const processedDisplay = document.getElementById('processed-display');

    const rawTranscript = `
    [0:00] Segment to process.
    `;

    transcriptInput.value = rawTranscript;

    // Mock alert
    window.alert = jest.fn();

    // Simulate transcript loading
    loadTranscriptBtn.click();
    await Promise.resolve();

    // Select model
    modelSelect.value = 'model1';

    // Simulate click on process
    processBtn.click();

    // Loader should be visible
    expect(loader.classList.contains('hidden')).toBe(false);
    expect(processedDisplay.textContent).toBe('Processing...');

    // Wait for async operations
    await Promise.resolve();

    // Processed display should show error
    expect(processedDisplay.textContent).toBe('Error processing with LLM.');
    // Loader should be hidden
    expect(loader.classList.contains('hidden')).toBe(true);
  });
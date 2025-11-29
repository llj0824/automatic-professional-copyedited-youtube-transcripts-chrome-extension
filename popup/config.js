// popup/config.js
// Centralized configuration for models, processing, and UI defaults.

// LLM-related defaults and per-model settings
export const LLM_DEFAULTS = {
  defaultModel: 'openai/gpt-oss-120b',
  endpoints: {
    openai: 'https://api.openai.com/v1/responses',
    anthropic: 'https://api.anthropic.com/v1/messages',
    openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  },
  common: {
    temperature: 0.1,
    // Fallback if model-specific is not provided
    maxOutputTokens: 10000,
    minOutputTokens: 512,
    contextReservedTokens: 2048,
  },
  // Model-specific knobs (converged to GPT-5 variants)
  models: {
    'openai/gpt-oss-120b': {
      provider: 'openrouter',
      temperature: 0.1,
      maxTokens: 131072,
      maxOutputTokens: 131072,
      openrouterOverrides: {
        reasoning: {
          enabled: true
        },
      },
    },
    'google/gemini-2.5-pro': {
      provider: 'openrouter',
      maxTokens: 65000,
      temperature: 0.1,
      openrouterOverrides: {
        isEnabled: false
      }
    },
    'deepseek/deepseek-v3.1-terminus': {
      provider: 'openrouter',
      maxTokens: 8192,
      temperature: 0.1,
      openrouterOverrides: {
        isEnabled: false,
        reasoning_effort: 'low',
      },
    },
    'gpt-5': {
      provider: 'openai',
      maxOutputTokens: 60000,
      // Responses API overrides for GPT-5 (reasoning + verbosity)
      openaiOverrides: {
        reasoning: { effort: 'minimal' },
        text: { verbosity: 'high' },
      },
    },
    'gpt-5-minimal': {
      provider: 'openai',
      // No reasoning override (non-reasoning / mini behavior)
      // Use standard temperature-based text generation
      temperature: 0.1,
      maxOutputTokens: 60000,
      openaiOverrides: {
        reasoning: { effort: 'minimal' },
        text: { verbosity: 'medium' },
      },
    },
  },
};

// Processing defaults, including page/partition behavior
export const PROCESSING_DEFAULTS = {
  // How many partitions a single transcript page is split into for parallel LLM calls
  partitions: 6,
  // For highlights generation we currently do a single call per page
  highlightPartitions: 1,
  // How long (in seconds) a page covers in the UI pagination
  pageDurationSec: 30 * 60,
};

// UI defaults
export const UI_DEFAULTS = {
  languageCode: 'en',
  languageName: 'English',
  fontSizePx: 12,
};

// Derived info helpers – useful for logs or display
export const PARTITIONING_INFO = {
  callsPerPage: () => PROCESSING_DEFAULTS.partitions,
  approxMinutesPerCall: () =>
    (PROCESSING_DEFAULTS.pageDurationSec / 60) / Math.max(1, PROCESSING_DEFAULTS.partitions),
};

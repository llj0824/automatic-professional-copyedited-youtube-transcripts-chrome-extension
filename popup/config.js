// popup/config.js
// Centralized configuration for models, processing, and UI defaults.

// Processing defaults, including page/partition behavior
export const PROCESSING_DEFAULTS = {
  // How many partitions a single transcript page is split into for parallel LLM calls
  partitions: 4,
  // For highlights generation we currently do a single call per page
  highlightPartitions: 1,
  // How long (in seconds) a page covers in the UI pagination
  pageDurationSec: 30 * 60,
};

export const ZHIPUP_MODEL = 'z-ai/glm-4.7';

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
    maxOutputTokens: 30000,
    openrouterOverrides: {
      reasoning: {
        effort: 'minimal'
      },
    },
  },
  // Model-specific knobs (converged to GPT-5 variants)
  models: {
    'openai/gpt-5.2': {
      label: 'GPT-5.2',
      provider: 'openrouter',
      temperature: 0.1,
      maxOutputTokens: 200000,     // from OpenRouter max_completion_tokens
      openrouterOverrides: {
        reasoning: {
          effort: 'minimal'
        },
      },
    },
    'openai/gpt-oss-120b': {
      label: 'OpenAI GPT-OSS 120B (OpenRouter)',
      provider: 'openrouter',
      temperature: 0.1,
      maxTokens: 131072,          // from OpenRouter context_length
      maxOutputTokens: 32768,     // from OpenRouter max_completion_tokens
      openrouterOverrides: {
        reasoning: {
          effort: 'minimal'
        },
      },
    },
    'moonshotai/kimi-k2.5': {
      label: 'MoonshotAI Kimi K2.5 Thinking (OpenRouter)',
      provider: 'openrouter',
      temperature: 0.1,
      maxTokens: 262144,          // from OpenRouter context_length
      maxOutputTokens: 16384,     // from OpenRouter max_completion_tokens
      openrouterOverrides: {
        reasoning: {
          effort: 'minimal'
        },
      },
    },
    'google/gemini-3-flash-preview': {
      label: 'Gemini 3 Flash Preview (OpenRouter)',
      provider: 'openrouter',
      temperature: 0.1,
      maxTokens: 1048576,         // from OpenRouter context_length
      maxOutputTokens: 65536,     // from OpenRouter max_completion_tokens
      openrouterOverrides: {
        reasoning: {
          effort: 'minimal'
        },
      },
    },
    [ZHIPUP_MODEL]: {
      label: 'Zhipu GLM-4.7 (OpenRouter)',
      provider: 'openrouter',
      openrouterOverrides: {
        reasoning: {
          effort: 'minimal'
        },
      },
    },
  },
};

// Derived list of model options for UI drop-downs and validation
const mappedModelOptions = Object.entries(LLM_DEFAULTS.models).map(
  ([modelName, cfg]) => ({
    value: modelName,
    label: cfg.label || modelName,
    provider: cfg.provider || 'openai'
  })
);

if (!mappedModelOptions.some(option => option.value === LLM_DEFAULTS.defaultModel)) {
  mappedModelOptions.unshift({
    value: LLM_DEFAULTS.defaultModel,
    label: LLM_DEFAULTS.defaultModel,
    provider: 'openai'
  });
}

export const MODEL_OPTIONS = mappedModelOptions;

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

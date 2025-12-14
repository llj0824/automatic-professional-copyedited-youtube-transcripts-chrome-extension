// llm_api_utils.js

// Class definition remains the same
import YoutubeTranscriptRetriever from './youtube_transcript_retrival.js';
import { OPENAI_ENCRYPTED_API_KEY, ANTHROPIC_ENCRYPTED_API_KEY, OPENROUTER_ENCRYPTED_API_KEY } from './keys.js'; // adjust the path as needed
import { LLM_DEFAULTS, PROCESSING_DEFAULTS, UI_DEFAULTS } from './config.js';

class LLM_API_Utils {

  constructor() {
    // Use centralized endpoints from config
    this.openai_endpoint = LLM_DEFAULTS.endpoints.openai;
    this.anthropic_endpoint = LLM_DEFAULTS.endpoints.anthropic;
    this.openrouter_endpoint = LLM_DEFAULTS.endpoints.openrouter;
    
    // Use static constants from keys.js
    if (!OPENAI_ENCRYPTED_API_KEY || !ANTHROPIC_ENCRYPTED_API_KEY || !OPENROUTER_ENCRYPTED_API_KEY) {
      throw new Error("API keys are not set in keys.js.");
    }
    
    this.openai_api_key = this.decryptApiKey(OPENAI_ENCRYPTED_API_KEY);
    this.anthropic_api_key = this.decryptApiKey(ANTHROPIC_ENCRYPTED_API_KEY);
    this.openrouter_api_key = this.decryptApiKey(OPENROUTER_ENCRYPTED_API_KEY);

    // Provide a default highlights prompt text for UI initialization
    try {
      this.llm_highlights_system_role = this.generateHighlightsSystemRole(UI_DEFAULTS.languageName);
    } catch (_) {
      this.llm_highlights_system_role = this.generateHighlightsSystemRole('English');
    }
  }

  generateSystemRole(targetLanguage = 'English') {
    return `Take a raw video transcript and copyedit it into a world-class professionally copyedited transcript in ${targetLanguage}.  
    Attempt to identify the speaker from the context of the conversation.
    
    IMPORTANT: Process and return the provided transcript segment. Do not truncate or ask for confirmation to continue.
    IMPORTANT: Output the transcript in ${targetLanguage}.
    IMPORTANT: Use natural, colloquial ${targetLanguage} that a native speaker would say. Avoid literal, word-for-word or phrase-by-phrase translation; prefer idiomatic phrasing and adjust sentence structure for clarity while preserving meaning. If the target is Chinese (中文/Chinese), write in modern, conversational Chinese with a native tone (avoid stiff or overly formal phrasing).
    
    # Steps
    1. **Speaker Identification**: Identify who is speaking at each segment based on context clues within the transcript.
    2. **Copyediting**:
       - Correct any grammatical or typographical errors.
       - Ensure coherence and flow of conversation.
       - Maintain the original meaning while enhancing clarity.
       - Translate to ${targetLanguage} if needed, ensuring it reads naturally to natives (colloquial, idiomatic, not literal).
    3. **Structure**: Format the transcript with each speaker's name followed by their dialogue.
    
    # Output Format
    [Time Range]
    [Speaker Name]:
    [Dialogue in ${targetLanguage}]
    
    **Requirements:**
    - **Time Range:** Combine the start and end timestamps in the format [Start Time -> End Time].
    - **Speaker Name:** Followed by a colon (:) and a newline.
    - **Dialogue:** Starts on a new line beneath the speaker's name. Ensure the dialogue is free of filler words and is professionally phrased in ${targetLanguage}.
    
    # Example Input/Output Format
    Input:  
    [00:06] uh so um today were going to be talking about, uh, 
    [00:12] mental health and, um, ideas of, uh, 
    [00:15] Dr. Paul Conti. uh welcome."
    
    Output:  
    [00:06 -> 00:15]
    Andrew Huberman:
    Today we are going to be talking about mental health and ideas of self with Dr. Paul Conti. Welcome.
    
    # Notes
    - If unable to identify the speaker, use placeholders such as "Speaker", "Interviewer", "Interviewee", etc.
    - Break long segments into smaller time ranges (1-3 mins), clearly identify the speaker, even within the same time range. Or if the same speaker is speaking across time ranges, use the same speaker name.
    - Return the complete copyedited transcript without any meta-commentary, introductions, or confirmations. Ensure that the final transcript reads smoothly and maintain the integrity of the original dialogue. Prioritize native, colloquial expression over literal translation.
    - Never truncate the output or ask for permission to continue - process only the provided input segment.`;
  }

  generateHighlightsSystemRole(targetLanguage = 'English') {
    return `
Extract segments where the speaker expresses a controversial opinion, challenges conventional wisdom, or engages in philosophical reflections, or statements that could inspire thought, provides expert analysis on complex topics.

IMPORTANT: Output all text in ${targetLanguage}.
IMPORTANT: Use a natural, colloquial style in ${targetLanguage} (native-sounding, idiomatic; avoid literal translation). If Chinese is selected, use modern conversational Chinese.

Identify moments that are:
- Highly quotable (~3-5 sentences)
- Contrarian/surprising
- Data-driven
- Actionable
- Story-driven

Look for:
- Unpopular or bold statements
- Memorable Quotes
- Counterarguments to common beliefs
- Advanced strategies or methodologies
- Clarification of common misconceptions
- Confirmation of existing beliefs.

Note: Please return without any markdown syntax. 

Format each highlight as:
[Time Range - i.e [01:00:06 -> 01:02:15]]
🔬 Topic: Brief title

✨ Quote (~3-5 sentences): "Extract the most compelling quote from this segment, aiming for approximately 3-5 sentences to capture the core idea. Use the exact words."
💎 Insight: Summary of the explanation or analysis
📝 CONTEXT: Key supporting details

--- 

Two sentence summary of highlight in viewpoint of the reader (in ${targetLanguage}).
`;
  }

  // Simple but sufficient for initial launch
  // the api_key has a limit of like ten dollars, so even if cracked, it's not a big deal.
  decryptApiKey(encryptedHex) {
    const key = 'assoonasigetusersthisisgoingtobeabackendserverandyoucantstealmykeyanymoreha';

    // Convert hex string to characters
    const encrypted = encryptedHex.match(/.{2}/g)
      .map(hex => String.fromCharCode(parseInt(hex, 16)))
      .join('');

    let decrypted = '';
    for (let i = 0; i < encrypted.length; i++) {
      decrypted += String.fromCharCode(encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return decrypted;
  }

  async call_openai(system_role, prompt, model, max_tokens, temperature) {
    if (!this.openai_api_key) {
      throw new Error("OpenAI API key is not set.");
    }

    const chosenModel = model || LLM_DEFAULTS.defaultModel;
    const modelCfg = LLM_DEFAULTS.models[chosenModel] || {};

    // Console log the chosen OpenAI config
    try {
      const reasoningLabel = modelCfg?.openaiOverrides?.reasoning?.effort || 'none';
      const verbosityLabel = modelCfg?.openaiOverrides?.text?.verbosity || 'n/a';
      const effectiveMax = max_tokens ?? modelCfg.maxOutputTokens ?? LLM_DEFAULTS.common.maxOutputTokens;
      console.info(`[LLM][OpenAI] endpoint=/v1/responses model=${chosenModel} max_output_tokens=${effectiveMax} reasoning=${reasoningLabel} verbosity=${verbosityLabel}`);
    } catch (_) { /* no-op */ }

    // Build Responses API payload
    const payload = {
      model: chosenModel,
      instructions: system_role || undefined,
      input: prompt,
      max_output_tokens: max_tokens ?? modelCfg.maxOutputTokens ?? LLM_DEFAULTS.common.maxOutputTokens,
      ...(modelCfg.openaiOverrides
        ? { ...modelCfg.openaiOverrides }
        : { temperature: (temperature ?? modelCfg.temperature ?? LLM_DEFAULTS.common.temperature) }
      )
    };

    const response = await fetch(this.openai_endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.openai_api_key}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let errorData;
      try { errorData = await response.json(); } catch (_) { errorData = {}; }
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    // Extract aggregated text from Responses API output
    try {
      if (data && Array.isArray(data.output)) {
        const texts = [];
        for (const item of data.output) {
          if (item?.type === 'message' && Array.isArray(item.content)) {
            for (const part of item.content) {
              if (part?.type === 'output_text' && typeof part.text === 'string') {
                texts.push(part.text);
              }
            }
          }
        }
        if (texts.length > 0) {
          return texts.join('\n').trim();
        }
      }
      // Fallback if unexpected shape
      if (typeof data.output_text === 'string') {
        return data.output_text.trim();
      }
      return JSON.stringify(data);
    } catch (_) {
      return JSON.stringify(data);
    }
  }

  approximateTokenCount(text) {
    if (!text) {
      return 0;
    }
    let asciiCount = 0;
    let nonAsciiCount = 0;
    for (let i = 0; i < text.length; i++) {
      if (text.charCodeAt(i) <= 0x7F) {
        asciiCount++;
      } else {
        nonAsciiCount++;
      }
    }
    const asciiEstimate = asciiCount / 3.5;
    const nonAsciiEstimate = nonAsciiCount * 1.2; // over-estimate to stay safe
    return Math.ceil(asciiEstimate + nonAsciiEstimate);
  }

  async call_openrouter(system_role, prompt, model, max_tokens, temperature) {
    if (!this.openrouter_api_key) {
      throw new Error("OpenRouter API key is not set.");
    }

    const chosenModel = model || LLM_DEFAULTS.defaultModel;
    const modelCfg = LLM_DEFAULTS.models[chosenModel] || {};
    const contextLimit = typeof modelCfg.maxContextTokens === 'number'
      ? modelCfg.maxContextTokens
      : (typeof modelCfg.maxTokens === 'number' ? modelCfg.maxTokens : null);
    const reservedTokens = modelCfg.contextReservedTokens ?? LLM_DEFAULTS.common.contextReservedTokens ?? 1024;
    const minimumOutputTokens = modelCfg.minOutputTokens ?? LLM_DEFAULTS.common.minOutputTokens ?? 256;
    let effectiveMax = max_tokens ?? modelCfg.maxOutputTokens ?? LLM_DEFAULTS.common.maxOutputTokens;
    if (contextLimit) {
      const approxPromptTokens = this.approximateTokenCount(
        `${system_role || ''}\n${prompt || ''}`
      );
      const safeLimit = Math.max(
        minimumOutputTokens,
        contextLimit - approxPromptTokens - reservedTokens
      );
      if (safeLimit < effectiveMax) {
        console.info(
          `[LLM][OpenRouter] reducing max_tokens from ${effectiveMax} to ${safeLimit} ` +
          `(approx_prompt=${approxPromptTokens}, buffer=${reservedTokens})`
        );
      }
      effectiveMax = Math.min(effectiveMax, safeLimit);
    }
    const openrouterOverrides = modelCfg.openrouterOverrides || {};
    const configuredReasoning = (typeof openrouterOverrides.reasoning === 'object' && openrouterOverrides.reasoning !== null)
      ? openrouterOverrides.reasoning
      : null;
    const configuredReasoningEffort = configuredReasoning?.effort ?? openrouterOverrides.reasoning_effort;

    try {
      const reasoningEffort = configuredReasoningEffort ?? 'none';
      console.info(`[LLM][OpenRouter] endpoint=/v1/chat/completions model=${chosenModel} max_tokens=${effectiveMax} reasoning_effort=${reasoningEffort}`);
    } catch (_) { /* no-op */ }

    const payload = {
      model: chosenModel,
      messages: [
        ...(system_role ? [{ role: 'system', content: system_role }] : []),
        { role: 'user', content: prompt }
      ],
      temperature: temperature ?? modelCfg.temperature ?? LLM_DEFAULTS.common.temperature,
      max_tokens: effectiveMax
    };

    const reasoningPayload = {};
    if (configuredReasoningEffort) {
      reasoningPayload.effort = configuredReasoningEffort;
    }
    if (Object.keys(reasoningPayload).length > 0) {
      payload.reasoning = reasoningPayload;
    }

    const response = await fetch(this.openrouter_endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openrouter_api_key}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'identity',
        'HTTP-Referer': 'https://local.dev',
        'X-Title': 'automatic-professional-transcript-editor',
        'User-Agent': 'automatic-professional-transcript-editor/1.0 (popup)'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let errorData;
      try { errorData = await response.json(); } catch (_) { errorData = {}; }
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const rawBody = await response.text();
    if (!rawBody) {
      throw new Error('OpenRouter API returned an empty response body.');
    }

    let data;
    try {
      data = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('[LLM][OpenRouter] Failed to parse JSON response:', parseError);
      return rawBody.trim();
    }

    const choice = Array.isArray(data?.choices) ? data.choices[0] : undefined;
    if (!choice) {
      return typeof data === 'string' ? data : JSON.stringify(data);
    }

    const message = choice?.message || {};

    let content = '';
    if (Array.isArray(message.content)) {
      content = message.content
        .map(part => (typeof part?.text === 'string' ? part.text : ''))
        .filter(Boolean)
        .join('\n')
        .trim();
    } else if (typeof message.content === 'string') {
      content = message.content.trim();
    } else if (message.content && typeof message.content === 'object' && typeof message.content.text === 'string') {
      content = message.content.text.trim();
    }

    const reasoning = typeof message.reasoning === 'string'
      ? message.reasoning.trim()
      : Array.isArray(message.reasoning)
        ? message.reasoning.map(part => (typeof part === 'string' ? part : '')).filter(Boolean).join('\n').trim()
        : '';

    console.log(`Reasoning:\n${reasoning}`)
    if (reasoning) {
      return `${content}\n\n`.trim();
    }
    return content;
  }

  // (No Chat Completions fallback; Responses API is required.)

  async call_claude(system_role, prompt, model, max_tokens, temperature) {
    if (!this.anthropic_api_key) {
      throw new Error("Anthropic API key is not set.");
    }

    try {
      const chosenModel = model || 'claude-3-5-sonnet-latest';
      const modelCfg = LLM_DEFAULTS.models[chosenModel] || {};
      const effectiveMax = max_tokens ?? modelCfg.maxTokens ?? 8192;
      console.info(`[LLM][Anthropic] endpoint=/v1/messages model=${chosenModel} max_tokens=${effectiveMax}`);
    } catch (_) { /* no-op */ }

    const headers = {
      "x-api-key": this.anthropic_api_key,
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"  // Add this header
    };

    const chosenModel = model || 'claude-3-5-sonnet-latest';
    const modelCfg = LLM_DEFAULTS.models[chosenModel] || {};
    const payload = {
      model: chosenModel,
      max_tokens: max_tokens ?? modelCfg.maxTokens ?? 8192,
      temperature: temperature ?? modelCfg.temperature ?? 0.1,
      system: system_role,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    };

    const response = await fetch(this.anthropic_endpoint, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  async call_llm({ model_name, system_role, prompt, max_tokens, temperature }) {
    try {
      // Log routing choice
      try {
        const chosenModel = model_name || LLM_DEFAULTS.defaultModel;
        const modelCfg = LLM_DEFAULTS.models[chosenModel] || {};
        const provider = modelCfg.provider || (chosenModel.toLowerCase().startsWith('claude') ? 'anthropic' : 'openai');
        if (provider === 'anthropic') {
          console.info(`[LLM] provider=Anthropic model=${chosenModel}`);
        } else if (provider === 'openrouter') {
          console.info(`[LLM] provider=OpenRouter model=${chosenModel}`);
        } else {
          const reasoningLabel = modelCfg?.openaiOverrides?.reasoning?.effort || 'none';
          const verbosityLabel = modelCfg?.openaiOverrides?.text?.verbosity || 'n/a';
          console.info(`[LLM] provider=OpenAI api=responses model=${chosenModel} reasoning=${reasoningLabel} verbosity=${verbosityLabel}`);
        }
      } catch (_) { /* no-op */ }
      const chosenModel = model_name || LLM_DEFAULTS.defaultModel;
      const modelCfg = LLM_DEFAULTS.models[chosenModel] || {};
      const provider = modelCfg.provider || (chosenModel.toLowerCase().startsWith('claude') ? 'anthropic' : 'openai');
      if (provider === 'anthropic') {
        return await this.call_claude(system_role, prompt, chosenModel, max_tokens, temperature);
      }
      if (provider === 'openrouter') {
        return await this.call_openrouter(system_role, prompt, chosenModel, max_tokens, temperature);
      }
      return await this.call_openai(system_role, prompt, chosenModel, max_tokens, temperature);
    } catch (error) {
      console.error("LLM API call error:", error);
      return "An error occurred while processing your request.";
    }
  }

  /**
   * Splits a transcript into n roughly equal parts
   * each part should have prefix of the context, which provides context.
   * @param {string} transcript - The transcript to split
   * @param {number} n - Number of partitions (default: 2)
   * @returns {string[]} Array of transcript partitions
   */
  splitTranscriptForProcessing(transcript, n) {
    // Split the transcript into lines
    const lines = transcript.split('\n');

    // Find context and transcript sections
    const contextStartIndex = lines.findIndex(line =>
      line.includes(YoutubeTranscriptRetriever.CONTEXT_BEGINS_DELIMITER)
    );
    const transcriptStartIndex = lines.findIndex(line =>
      line.includes(YoutubeTranscriptRetriever.TRANSCRIPT_BEGINS_DELIMITER)
    ) || lines.length;

    // Extract context section (will be added to each partition)
    const contextSection = lines.slice(contextStartIndex, transcriptStartIndex + 1).join('\n');
    const transcriptLines = lines.slice(transcriptStartIndex + 1);

    // Calculate roughly equal-sized partitions
    const linesPerPartition = Math.ceil(transcriptLines.length / n);

    // Create partitions
    const partitions = [];
    for (let i = 0; i < n; i++) {
      const start = i * linesPerPartition;
      const end = Math.min(start + linesPerPartition, transcriptLines.length);
      const partition = transcriptLines.slice(start, end);

      // Only add partition if it contains content
      if (partition.length > 0) {
        partitions.push(contextSection + '\n' + partition.join('\n'));
      }
    }

    return partitions;
  }

  /**
   * Processes a transcript with parallel LLM calls
   * @param {Object} params - Processing parameters
   * @param {string} params.transcript - The transcript to process
   * @param {string} params.model_name - The model to use
   * @param {number} params.partitions - Number of partitions
   * @param {string} [params.system_role] - Optional system role, defaults to this.llm_system_role
   * @returns {Promise<string>} Processed transcript
   */
  async processTranscriptInParallel({ transcript, model_name, partitions, system_role, targetLanguage = 'English' }) {
    // Generate system role if not provided
    if (!system_role) {
      system_role = this.generateSystemRole(targetLanguage);
    }
    // Split transcript into parts
    const effectivePartitions = partitions ?? PROCESSING_DEFAULTS.partitions;
    const parts = this.splitTranscriptForProcessing(transcript, effectivePartitions);

    // Process all parts in parallel
    const promises = parts.map(part =>
      this.call_llm({
        model_name,
        system_role: system_role,
        prompt: part
      })
    );

    // Wait for all parts to complete
    const results = await Promise.all(promises);

    // Combine results
    return results.join('\n\n');
  }

  // Add the new method
  async generateHighlights({ processedTranscript, customPrompt, model_name, targetLanguage = 'English'}) {
    try {
      // Use custom prompt if provided, otherwise use default system role
      const system_role = customPrompt || this.generateHighlightsSystemRole(targetLanguage);
      
      // Process the transcript in parallel using the existing method
      const highlights = await this.processTranscriptInParallel({
        transcript: processedTranscript,
        model_name: model_name || LLM_DEFAULTS.defaultModel,
        system_role: system_role,
        partitions: PROCESSING_DEFAULTS.highlightPartitions // One call per page for highlights
      });

      return highlights;
    } catch (error) {
      console.error("Error generating highlights:", error);
      throw error;
    }
  }
}

// Export the LLM_API_Utils class
export default LLM_API_Utils;

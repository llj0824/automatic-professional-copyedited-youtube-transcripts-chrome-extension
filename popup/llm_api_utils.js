// llm_api_utils.js

// Class definition remains the same
import YoutubeTranscriptRetriever from './youtube_transcript_retrival.js';

class LLM_API_Utils {
  static DEFAULT_PARTITIONS = 8; // Default number of partitions for parallel processing. 
  constructor() {
    this.openai_endpoint = "https://api.openai.com/v1/chat/completions";
    this.anthropic_endpoint = "https://api.anthropic.com/v1/complete";
    // Initialize with embedded keys
    this.openai_api_key = this.decryptApiKey("12185e1f1d010b5e5d373d3921303d2b431c5e04303b202b1508215039212a043910502e390b5c5d2b120b2f0a1f120536342b3f544c2b594425483b0e03343c22152556385d56470a1c563e35341a240116275a2509161e352f3e392e1025463d211758383e03062e3055310b110f0c2f0311182742132a033727223528203b352a20090521074129262f5200580d353a361d17301b390215093b2c133b0b20043c3032");
    this.anthropic_api_key = this.decryptApiKey("12185e0e011a4c12190e554758112b305e41310e1a30240330273125015a33270e250c3a112a25373e0a3d03311f0a2c160b5e38052819464b16015838261c52560306023659043d3f26303b3f305b3f5d371e272f1d052d211c2227462f5010081826423837381e09052420");
    this.llm_system_role = `Take a raw video transcript and copyedit it into a world-class professionally copyedited transcript.  
    Attempt to identify the speaker from the context of the conversation.
    
    IMPORTANT: Process and return the ENTIRE transcript segment. Do not truncate or ask for confirmation to continue.
    
    # Steps
    1. **Speaker Identification**: Identify who is speaking at each segment based on context clues within the transcript.
    2. **Copyediting**:
       - Correct any grammatical or typographical errors.
       - Ensure coherence and flow of conversation.
       - Maintain the original meaning while enhancing clarity.
    3. **Structure**: Format the transcript with each speaker's name followed by their dialogue.
    
    # Output Format
    [Time Range]
    [Speaker Name]:
    [Dialogue]
    
    **Requirements:**
    - **Time Range:** Combine the start and end timestamps in the format [Start Time -> End Time].
    - **Speaker Name:** Followed by a colon (:) and a newline.
    - **Dialogue:** Starts on a new line beneath the speaker's name. Ensure the dialogue is free of filler words and is professionally phrased.
    - **Completeness:** Process and return the entire transcript segment without truncation.
    
    # Example Input/Output Format
    Input:  
    [00:06] uh so um today were going to be talking about, uh, 
    [00:12] mental health and, um, ideas of, uh, self with, um, 
    [00:15] Dr. Paul Conti. uh welcome."
    
    Output:  
    [00:06 -> 00:15]
    Andrew Huberman:
    Today we are going to be talking about mental health and ideas of self with Dr. Paul Conti. Welcome.
    
    # Notes
    - If unable to identify the speaker, use placeholders such as "Speaker", "Interviewer", "Interviewee", etc.
    - Break long segments into smaller time ranges, clearly identify when speakers change, even within the same time range.
    - Return the complete copyedited transcript without any meta-commentary, introductions, or confirmations. Ensure that the final transcript reads smoothly and maintain the integrity of the original dialogue.
    - Never truncate the output or ask for permission to continue - process the entire input segment`

    // System role for generating highlights
    this.llm_highlights_system_role = `
Extract segments where the speaker expresses a controversial opinion, challenges conventional wisdom, or engages in philosophical reflections, or statements that could inspire thought, provides expert analysis on complex topics 

Identify moments that are:
- Highly quotable
- Contrarian/surprising
- Data-driven
- Actionable
- Story-driven

Look for:
- Unpopular or bold statements
- Memorable one-liners
- Counterarguments to common beliefs
- Advanced strategies or methodologies
- Clarification of common misconceptions
- Confirmation of existing beliefs.

Format each highlight as:
[Timestamp]
🔬 Topic: Brief title

✨ Quote (if applicable) : "Exact words from the speaker"
💎 Insight: Summary of the explanation or analysis
🎯 TAKEAWAY: Why this matters
📝 CONTEXT: Key supporting details

--- 

Two sentence summary of highlight in viewpoint of the reader.
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

  async call_gpt4(system_role, prompt, model = "chatgpt-4o-latest", max_tokens = 10000, temperature = 0.1) {
    if (!this.openai_api_key) {
      throw new Error("OpenAI API key is not set.");
    }

    const payload = {
      model: model,
      messages: [
        { role: "system", content: system_role },
        { role: "user", content: prompt }
      ],
      temperature: temperature,
      max_tokens: max_tokens
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
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  }

  async call_claude(system_role, prompt, model = "claude-3-5-sonnet-latest", max_tokens = 8192, temperature = 0.1) {
    if (!this.anthropic_api_key) {
      throw new Error("Anthropic API key is not set.");
    }

    const headers = {
      "x-api-key": this.anthropic_api_key,
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"  // Add this header
    };

    const payload = {
      model: model,
      max_tokens: max_tokens,
      temperature: temperature,
      system: system_role,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    };

    const response = await fetch("https://api.anthropic.com/v1/messages", {
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

  async call_llm({ model_name, system_role = this.llm_system_role, prompt, max_tokens, temperature }) {
    try {
      if (model_name?.toLowerCase().startsWith("claude")) {
        return await this.call_claude(system_role, prompt, model_name, max_tokens, temperature);
      } else {
        return await this.call_gpt4(system_role, prompt, model_name, max_tokens, temperature);
      }
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
    );

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
  async processTranscriptInParallel({ transcript, model_name, partitions = LLM_API_Utils.DEFAULT_PARTITIONS, system_role = this.llm_system_role }) {
    // Split transcript into parts
    const parts = this.splitTranscriptForProcessing(transcript, partitions);

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
  async generateHighlights({ processedTranscript, model_name="chatgpt-4o-latest", max_tokens = 10000, temperature = 0.4 }) {
    try {
      const system_role = this.llm_highlights_system_role;

      // Call the LLM with the processed transcript
      const highlights = await this.call_llm({
        model_name,
        system_role,
        prompt: processedTranscript,
        max_tokens,
        temperature,
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
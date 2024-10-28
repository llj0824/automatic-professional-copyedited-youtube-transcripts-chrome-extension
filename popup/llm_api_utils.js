// llm_api_utils.js

// Class definition remains the same

class LLM_API_Utils {
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
    - Ensure that the final transcript reads smoothly and professionally while maintaining the integrity of the original dialogue.
    - Return the complete copyedited transcript without any meta-commentary, introductions, or confirmations.
    - Never truncate the output or ask for permission to continue - process the entire input segment.`
    
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

  async call_llm({model_name, system_role=this.llm_system_role, prompt, max_tokens, temperature}) {
    try {
      if (model_name.toLowerCase().startsWith("claude")) {
        return await this.call_claude(system_role, prompt, model_name, max_tokens, temperature);
      } else {
        return await this.call_gpt4(system_role, prompt, model_name, max_tokens, temperature);
      }
    } catch (error) {
      console.error("LLM API call error:", error);
      return "An error occurred while processing your request.";
    }
  }
}

// Export the LLM_API_Utils class
export default LLM_API_Utils;
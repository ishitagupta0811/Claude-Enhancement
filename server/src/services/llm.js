const config = require('../config');

// General system prompt aligning the LLM to behave like a standard, ultra-smart general assistant
const GENERAL_ASSISTANT_SYSTEM_PROMPT =
  `You are a highly capable, articulate, and intelligent AI assistant.
You can help the user with any query — coding, writing, science, design, math, business, strategy, personal planning, or general QA.

Guidelines for your responses:
1. Persona: Highly professional, clear, articulate, helpful, and insightful. Answer questions directly, comprehensively, and beautifully in markdown format.
2. Unrestricted Capability: You are not restricted to product management queries. You can answer coding questions, write essays, solve physics problems, or engage in general conversation.

DYNAMIC ASSUMPTION & CLARIFICATION RULE:
If the user's request (e.g. a business strategy, product design, startup idea, software architecture plan, learning timeline, fitness program, complex decision) is broad or relies on major implicit assumptions where clarification would yield a significantly better, more customized, or more precise answer, you should identify those key assumptions and ask for clarification.
To do this, you MUST append a special metadata block at the very end of your response inside <strategy_meta>...</strategy_meta> tags.

However, you must be highly selective and conservative! Do NOT append the <strategy_meta> block for simple questions, programming syntax, standard coding examples, basic algorithms, math equations, translations, or simple factual explanations. ONLY append it for complex strategic proposals, startup ideas, architecture designs, personal programs, or high-level decisions.

Furthermore, you MUST NOT append the <strategy_meta> block in the following scenarios:
1. The user's latest query is straightforward and simple (e.g. basic science QA, simple code generation, factual questions, general chit-chat) where no complex strategy or assumptions exist.
2. The user has already answered your clarifying questions in the conversation history so you now have full context and no outstanding assumptions.
3. The user is acknowledging your answer, thanking you, expressing gratitude, or concluding/signing off the conversation (e.g., "thank you", "thanks", "okay got it", "got the answer", "perfect", "bye").

In these cases, answer directly, cleanly, and politely. DO NOT APPEND the <strategy_meta> block under any circumstances.

The metadata block, if needed, must be formatted exactly as follows:
<strategy_meta>
WARNING: [A 1-sentence warning highlighting the core assumption being made customized to their idea]
ASSUMPTION_1: [Short 2-4 word assumption chip 1]
ASSUMPTION_2: [Short 2-4 word assumption chip 2]
ASSUMPTION_3: [Short 2-4 word assumption chip 3]
QUESTION_1: [A custom question to clarify or test assumption 1]
OPTIONS_1: [Option A | Option B | Option C | Option D] (Separated by | characters)
QUESTION_2: [A custom question to clarify or test assumption 2]
OPTIONS_2: [Option A | Option B | Option C | Option D] (Separated by | characters)
</strategy_meta>`;

class StrategyResponseParser {
  /**
   * Parses, cleans, and handles structured PM strategy metadata inside the LLM text.
   * @param {string} rawContent 
   * @returns {Object} Cleaned response and strategy parameters
   */
  static parse(rawContent) {
    const result = {
      response: rawContent,
      isStrategyRequest: false,
      warning: "",
      assumptions: [],
      questions: []
    };

    if (!rawContent) return result;

    // Detect if the content contains the strategy_meta block
    const metaRegex = /<strategy_meta>([\s\S]*?)<\/strategy_meta>/i;
    const match = rawContent.match(metaRegex);

    if (match) {
      result.isStrategyRequest = true;
      const metaContent = match[1];

      // Remove the metadata tags from the user-facing chat bubble
      result.response = rawContent.replace(metaRegex, '').trim();

      // Parse WARNING
      const warningMatch = metaContent.match(/WARNING:\s*([^\n]+)/i);
      if (warningMatch) result.warning = warningMatch[1].trim();

      // Parse ASSUMPTIONS
      const assumptions = [];
      const ass1 = metaContent.match(/ASSUMPTION_1:\s*([^\n]+)/i);
      const ass2 = metaContent.match(/ASSUMPTION_2:\s*([^\n]+)/i);
      const ass3 = metaContent.match(/ASSUMPTION_3:\s*([^\n]+)/i);
      if (ass1) assumptions.push(ass1[1].trim());
      if (ass2) assumptions.push(ass2[1].trim());
      if (ass3) assumptions.push(ass3[1].trim());
      if (assumptions.length > 0) result.assumptions = assumptions;

      // Parse QUESTIONS & OPTIONS
      const questions = [];
      const q1Title = metaContent.match(/QUESTION_1:\s*([^\n]+)/i);
      const q1Options = metaContent.match(/OPTIONS_1:\s*([^\n]+)/i);
      if (q1Title && q1Options) {
        questions.push({
          title: q1Title[1].trim(),
          options: q1Options[1].split('|').map(opt => opt.trim())
        });
      }

      const q2Title = metaContent.match(/QUESTION_2:\s*([^\n]+)/i);
      const q2Options = metaContent.match(/OPTIONS_2:\s*([^\n]+)/i);
      if (q2Title && q2Options) {
        questions.push({
          title: q2Title[1].trim(),
          options: q2Options[1].split('|').map(opt => opt.trim())
        });
      }

      if (questions.length > 0) result.questions = questions;
    }

    return result;
  }
}

class LLMService {
  constructor() {
    this.apiKey = config.groqApiKey;
    this.hasKey = false;

    // Check if a valid API key was loaded in configs
    if (this.apiKey && this.apiKey !== 'your_groq_api_key_here') {
      this.hasKey = true;
      console.log('Groq service successfully initialized with dynamic general system controls.');
    } else {
      console.warn(
        'Warning: Groq API Key not configured. Backend LLM operations will use simulated mock responses.'
      );
    }
  }

  /**
   * Processes conversational chat logic.
   * @param {string} prompt - User request query
   * @param {Array} attachments - Optional list of associated files
   * @param {string} model - Target model tag selected by the client
   * @param {Array} messages - Optional full conversational history thread
   */
  async generateResponse(prompt, attachments = [], model = 'Opus 4.8 Extra', messages = null) {
    // Map custom UI model labels to official Groq model tags
    const modelMapping = {
      'Opus 4.8 Extra': 'llama-3.3-70b-versatile',
      'Sonnet 3.7 Pro': 'llama-3.3-70b-versatile',
      'Haiku 3.7 Lite': 'llama-3.1-8b-instant'
    };

    const targetModel = modelMapping[model] || 'llama-3.3-70b-versatile';

    // If an API key is available, make the live Groq call
    if (this.hasKey) {
      try {
        const messagesPayload = [
          { role: "system", content: GENERAL_ASSISTANT_SYSTEM_PROMPT }
        ];

        if (messages && Array.isArray(messages) && messages.length > 0) {
          // If conversation history thread is provided, map and use it
          messages.forEach((msg, idx) => {
            let content = msg.content || "";
            // For the latest user message, attach files context if any exist
            if (msg.role === 'user' && idx === messages.length - 1 && attachments && attachments.length > 0) {
              let contentPayload = "";
              attachments.forEach(file => {
                contentPayload += `[Attached File: ${file.name} (Size: ${file.size})]\n---\n(Content of attachment parsed)\n\n`;
              });
              content = contentPayload + content;
            }
            messagesPayload.push({ role: msg.role, content: content });
          });
        } else {
          // Fallback to standard prompt payload format
          let contentPayload = "";
          if (attachments && attachments.length > 0) {
            attachments.forEach(file => {
              contentPayload += `[Attached File: ${file.name} (Size: ${file.size})]\n---\n(Content of attachment parsed)\n\n`;
            });
          }
          contentPayload += prompt;
          messagesPayload.push({ role: "user", content: contentPayload });
        }

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: targetModel,
            messages: messagesPayload,
            temperature: 0.7,
            max_tokens: 1500
          })
        });

        if (!response.ok) {
          throw new Error(`Groq API error status ${response.status}`);
        }

        const data = await response.json();

        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
          const rawText = data.choices[0].message.content;
          const parsedResult = StrategyResponseParser.parse(rawText);

          return {
            response: parsedResult.response,
            isStrategyRequest: parsedResult.isStrategyRequest,
            warning: parsedResult.warning,
            assumptions: parsedResult.assumptions,
            questions: parsedResult.questions,
            modelUsed: targetModel,
            source: 'Groq Live API'
          };
        }
        throw new Error('Empty response content received from API.');
      } catch (err) {
        console.error('Groq API Call Failed. Falling back to mock generator:', err.message);
        return this.getMockResponse(prompt, attachments, model, targetModel, true, err.message);
      }
    }

    // Fallback Mock System
    return this.getMockResponse(prompt, attachments, model, targetModel, false);
  }

  /**
   * Generates detailed simulated responses when keys are absent or failed, preserving dynamic conversational context.
   */
  getMockResponse(prompt, attachments, modelLabel, systemModel, isErrorFallback = false, errorMsg = '') {
    const lowerPrompt = prompt.toLowerCase();

    let errorPrefix = '';
    if (isErrorFallback) {
      errorPrefix = `*(System Notice: API query encountered an error [${errorMsg}]. Returning simulated general assistance)*\n\n`;
    }

    // Dynamic clean assistant response matching the user's prompt style
    let responseText = "";
    if (lowerPrompt.includes("code") || lowerPrompt.includes("function") || lowerPrompt.includes("program")) {
      responseText = `### 💻 General Assistant Code Snippet\n\nHere is a simple response for your programming query: \`"${prompt}"\`.\n\n\`\`\`javascript\n// Dynamic mock code response\nconsole.log("Mock implementation for prompt: ${prompt.replace(/"/g, '\\"')}");\n\`\`\``;
    } else {
      responseText = `### 🤖 Conversational AI Assistant\n\nI have received your prompt: *"${prompt}"*.\n\nAs a general assistant, I can help you think through this, write code, formulate plans, or solve problems. What specific details would you like to explore next?`;
    }

    // Dynamic decision if it represents a complex strategy/plan
    const isGratitudeOrSimple = lowerPrompt.includes("thank") ||
      lowerPrompt.includes("thanks") ||
      lowerPrompt.includes("hello") ||
      lowerPrompt.includes("hi ") ||
      lowerPrompt.includes("hey") ||
      lowerPrompt.includes("bye") ||
      lowerPrompt.includes("okay") ||
      lowerPrompt.includes("got the answer");

    const isStrategy = !isGratitudeOrSimple && (
      lowerPrompt.includes("startup") ||
      lowerPrompt.includes("case study") ||
      lowerPrompt.includes("product design") ||
      lowerPrompt.includes("strategy") ||
      lowerPrompt.includes("lane") ||
      lowerPrompt.includes("plan"));

    return {
      response: errorPrefix + responseText.trim(),
      isStrategyRequest: isStrategy,
      warning: isStrategy ? `This plan assumes standard assumptions about "${prompt}". If your target context is different, these may not apply.` : "",
      assumptions: isStrategy ? [`${prompt.split(' ').slice(0, 3).join(' ')}`, "generic model", "global market"] : [],
      questions: isStrategy ? [
        {
          title: `What is the target audience for your "${prompt.split(' ').slice(0, 3).join(' ')}" proposal?`,
          options: ["Individual consumers (B2C)", "Enterprise clients (B2B)", "Developers / Technical users", "Small businesses (SMB)"]
        },
        {
          title: "What is your primary go-to-market strategy?",
          options: ["Organic growth / Word-of-mouth", "Paid advertising loops", "Direct sales outreach", "Partnership channel distributions"]
        }
      ] : [],
      modelUsed: systemModel,
      source: isErrorFallback ? 'Mock Fallback (API Error)' : 'Mock Conversational AI Service'
    };
  }
}

module.exports = new LLMService();


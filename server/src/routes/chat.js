const express = require('express');
const router = express.Router();
const llmService = require('../services/llm');

/**
 * @route   POST /api/chat
 * @desc    Accepts chat prompt and attachments, returning Claude responses
 * @access  Public
 */
router.post('/chat', async (req, res) => {
  try {
    const { prompt, messages, attachments, model } = req.body;

    // Request body validation (must have a string prompt or an array of messages)
    if ((!prompt || typeof prompt !== 'string') && (!messages || !Array.isArray(messages))) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field "prompt" (string) or "messages" (array) in request body.'
      });
    }

    console.log(`Processing chat request for model "${model || 'Opus 4.8 Extra'}"...`);

    // Call our LLM service layer (which handles live Anthropic API and mock fallbacks)
    const result = await llmService.generateResponse(
      prompt,
      attachments || [],
      model || 'Opus 4.8 Extra',
      messages
    );

    // Express standard success JSON payload
    return res.status(200).json({
      success: true,
      response: result.response,
      modelUsed: result.modelUsed,
      source: result.source,
      isStrategyRequest: result.isStrategyRequest,
      warning: result.warning,
      assumptions: result.assumptions,
      questions: result.questions
    });

  } catch (err) {
    console.error('Error occurred in POST /api/chat route:', err);
    return res.status(500).json({
      success: false,
      error: 'An internal server error occurred while processing your chat prompt.'
    });
  }
});

module.exports = router;

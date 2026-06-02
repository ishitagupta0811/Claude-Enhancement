const llmService = require('../server/src/services/llm');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const { prompt, messages, attachments, model } = req.body || {};

  if ((!prompt || typeof prompt !== 'string') && (!messages || !Array.isArray(messages))) {
    return res.status(400).json({
      success: false,
      error: 'Missing required field "prompt" (string) or "messages" (array) in request body.'
    });
  }

  try {
    const result = await llmService.generateResponse(
      prompt,
      attachments || [],
      model || 'Opus 4.8 Extra',
      messages
    );

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
  } catch (error) {
    console.error('Vercel API /api/chat error:', error);
    return res.status(500).json({
      success: false,
      error: 'An internal server error occurred while processing your chat request.'
    });
  }
};

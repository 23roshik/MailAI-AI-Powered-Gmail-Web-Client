const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const anthropicService = require('../services/anthropic');

const requireAuth = authRoutes.requireAuth;

// POST /api/ai/chat
router.post('/chat', requireAuth, async (req, res) => {
  try {
    const { messages, context } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    // Add user info to context
    const enrichedContext = {
      ...context,
      userEmail: req.session.user?.email,
    };

    const result = await anthropicService.chat(messages, enrichedContext);
    res.json(result);
  } catch (err) {
    console.error('AI chat error:', err.message);
    res.status(500).json({
      error: 'AI service error',
      details: err.message,
      message: 'Sorry, I encountered an error. Please try again.',
      actions: [],
    });
  }
});

module.exports = router;
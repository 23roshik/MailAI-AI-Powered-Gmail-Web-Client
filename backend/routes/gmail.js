const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const gmailService = require('../services/gmail');

const requireAuth = authRoutes.requireAuth;

// GET /api/gmail/inbox
router.get('/inbox', requireAuth, async (req, res) => {
  try {
    const { pageToken, maxResults = 50 } = req.query;
    const result = await gmailService.listMessages(req.session.tokens, {
      labelIds: ['INBOX'],
      maxResults: parseInt(maxResults),
      pageToken,
    });
    res.json(result);
  } catch (err) {
    console.error('Inbox error:', err.message);
    res.status(500).json({ error: 'Failed to fetch inbox', details: err.message });
  }
});

// GET /api/gmail/sent
router.get('/sent', requireAuth, async (req, res) => {
  try {
    const { pageToken, maxResults = 50 } = req.query;
    const result = await gmailService.listMessages(req.session.tokens, {
      labelIds: ['SENT'],
      maxResults: parseInt(maxResults),
      pageToken,
    });
    res.json(result);
  } catch (err) {
    console.error('Sent error:', err.message);
    res.status(500).json({ error: 'Failed to fetch sent emails', details: err.message });
  }
});

// GET /api/gmail/message/:id
router.get('/message/:id', requireAuth, async (req, res) => {
  try {
    const message = await gmailService.getMessage(req.session.tokens, req.params.id);
    // Mark as read
    if (message.isUnread) {
      await gmailService.markAsRead(req.session.tokens, req.params.id);
      message.isUnread = false;
    }
    res.json(message);
  } catch (err) {
    console.error('Get message error:', err.message);
    res.status(500).json({ error: 'Failed to fetch message', details: err.message });
  }
});

// GET /api/gmail/thread/:id
router.get('/thread/:id', requireAuth, async (req, res) => {
  try {
    const thread = await gmailService.getThread(req.session.tokens, req.params.id);
    res.json(thread);
  } catch (err) {
    console.error('Get thread error:', err.message);
    res.status(500).json({ error: 'Failed to fetch thread', details: err.message });
  }
});

// POST /api/gmail/send
router.post('/send', requireAuth, async (req, res) => {
  try {
    const { to, cc, subject, body, replyToMessageId, threadId } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, body' });
    }

    const result = await gmailService.sendEmail(req.session.tokens, {
      to, cc, subject, body, replyToMessageId, threadId
    });

    // Notify connected clients
    const io = req.app.get('io');
    io.emit('gmail:email_sent', { messageId: result.id });

    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Send email error:', err.message);
    res.status(500).json({ error: 'Failed to send email', details: err.message });
  }
});

// GET /api/gmail/search
router.get('/search', requireAuth, async (req, res) => {
  try {
    const { from, to, subject, keyword, unread, read, after, before, days, sent, maxResults } = req.query;

    const filters = {
      from, to, subject, keyword,
      unread: unread === 'true',
      read: read === 'true',
      after, before, days,
      sent: sent === 'true',
      maxResults: maxResults ? parseInt(maxResults) : 50,
    };

    // Remove undefined/false values
    Object.keys(filters).forEach(k => {
      if (filters[k] === undefined || filters[k] === false || filters[k] === '') {
        delete filters[k];
      }
    });

    const result = await gmailService.searchMessages(req.session.tokens, filters);
    res.json(result);
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(500).json({ error: 'Failed to search emails', details: err.message });
  }
});

// POST /api/gmail/watch (setup push notifications)
router.post('/watch', requireAuth, async (req, res) => {
  try {
    const { topicName } = req.body;
    if (!topicName) {
      return res.status(400).json({ error: 'topicName required' });
    }
    const result = await gmailService.setupPushNotifications(req.session.tokens, topicName);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
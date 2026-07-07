const { google } = require('googleapis');

function getOAuth2Client(tokens) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oauth2Client.setCredentials(tokens);

  // Auto-refresh tokens
  oauth2Client.on('tokens', (newTokens) => {
    if (newTokens.refresh_token) {
      tokens.refresh_token = newTokens.refresh_token;
    }
    tokens.access_token = newTokens.access_token;
    tokens.expiry_date = newTokens.expiry_date;
  });

  return oauth2Client;
}

function getGmailClient(tokens) {
  const auth = getOAuth2Client(tokens);
  return google.gmail({ version: 'v1', auth });
}

// Parse email headers
function parseHeaders(headers) {
  const parsed = {};
  if (!headers) return parsed;
  headers.forEach(({ name, value }) => {
    parsed[name.toLowerCase()] = value;
  });
  return parsed;
}

// Decode base64 email body
function decodeBody(data) {
  if (!data) return '';
  return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
}

// Extract text/html from payload
function extractBody(payload) {
  if (!payload) return { text: '', html: '' };

  let text = '';
  let html = '';

  function traverse(part) {
    if (!part) return;
    const mimeType = part.mimeType || '';

    if (mimeType === 'text/plain' && part.body?.data) {
      text = decodeBody(part.body.data);
    } else if (mimeType === 'text/html' && part.body?.data) {
      html = decodeBody(part.body.data);
    } else if (part.parts) {
      part.parts.forEach(traverse);
    }
  }

  if (payload.body?.data) {
    const decoded = decodeBody(payload.body.data);
    if (payload.mimeType === 'text/html') html = decoded;
    else text = decoded;
  }
  if (payload.parts) payload.parts.forEach(traverse);

  return { text, html };
}

// Format a Gmail message into a clean object
function formatMessage(msg) {
  const headers = parseHeaders(msg.payload?.headers);
  const { text, html } = extractBody(msg.payload);
  const isUnread = msg.labelIds?.includes('UNREAD') ?? false;

  return {
    id: msg.id,
    threadId: msg.threadId,
    labelIds: msg.labelIds || [],
    snippet: msg.snippet || '',
    subject: headers['subject'] || '(No Subject)',
    from: headers['from'] || '',
    to: headers['to'] || '',
    cc: headers['cc'] || '',
    date: headers['date'] || '',
    timestamp: msg.internalDate ? parseInt(msg.internalDate) : 0,
    isUnread,
    body: { text, html },
  };
}

// List messages with optional filters
async function listMessages(tokens, options = {}) {
  const gmail = getGmailClient(tokens);
  const {
    labelIds = ['INBOX'],
    query = '',
    maxResults = 50,
    pageToken,
  } = options;

  let q = query;

  const params = {
    userId: 'me',
    maxResults,
    labelIds,
    ...(q && { q }),
    ...(pageToken && { pageToken }),
  };

  const { data } = await gmail.users.messages.list(params);
  if (!data.messages || data.messages.length === 0) {
    return { messages: [], nextPageToken: null };
  }

  // Fetch full details in parallel
  const messages = await Promise.all(
    data.messages.map(({ id }) =>
      gmail.users.messages.get({ userId: 'me', id, format: 'full' })
        .then(({ data: msg }) => formatMessage(msg))
        .catch(() => null)
    )
  );

  return {
    messages: messages.filter(Boolean),
    nextPageToken: data.nextPageToken || null,
  };
}

// Get a single message
async function getMessage(tokens, id) {
  const gmail = getGmailClient(tokens);
  const { data } = await gmail.users.messages.get({ userId: 'me', id, format: 'full' });
  return formatMessage(data);
}

// Send an email
async function sendEmail(tokens, { to, cc, subject, body, replyToMessageId, threadId }) {
  const gmail = getGmailClient(tokens);

  let headers = `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=utf-8`;
  if (cc) headers += `\r\nCc: ${cc}`;
  if (replyToMessageId) headers += `\r\nIn-Reply-To: ${replyToMessageId}\r\nReferences: ${replyToMessageId}`;

  const raw = Buffer.from(`${headers}\r\n\r\n${body}`)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const params = {
    userId: 'me',
    requestBody: { raw, ...(threadId && { threadId }) },
  };

  const { data } = await gmail.users.messages.send(params);
  return { id: data.id, threadId: data.threadId };
}

// Mark message as read
async function markAsRead(tokens, id) {
  const gmail = getGmailClient(tokens);
  await gmail.users.messages.modify({
    userId: 'me',
    id,
    requestBody: { removeLabelIds: ['UNREAD'] },
  });
}

// Search messages with filters
async function searchMessages(tokens, filters = {}) {
  const queryParts = [];

  if (filters.from) queryParts.push(`from:${filters.from}`);
  if (filters.to) queryParts.push(`to:${filters.to}`);
  if (filters.subject) queryParts.push(`subject:${filters.subject}`);
  if (filters.keyword) queryParts.push(filters.keyword);
  if (filters.unread) queryParts.push('is:unread');
  if (filters.read) queryParts.push('is:read');

  if (filters.after) {
    const d = new Date(filters.after);
    queryParts.push(`after:${Math.floor(d.getTime() / 1000)}`);
  }
  if (filters.before) {
    const d = new Date(filters.before);
    queryParts.push(`before:${Math.floor(d.getTime() / 1000)}`);
  }
  if (filters.days) {
    const d = new Date();
    d.setDate(d.getDate() - parseInt(filters.days));
    queryParts.push(`after:${Math.floor(d.getTime() / 1000)}`);
  }

  const labelIds = filters.sent ? ['SENT'] : ['INBOX'];
  const query = queryParts.join(' ');

  return listMessages(tokens, { labelIds, query, maxResults: filters.maxResults || 50 });
}

// Setup Gmail push notifications
async function setupPushNotifications(tokens, topicName) {
  const gmail = getGmailClient(tokens);
  try {
    const { data } = await gmail.users.watch({
      userId: 'me',
      requestBody: {
        topicName,
        labelIds: ['INBOX'],
      },
    });
    return data;
  } catch (err) {
    console.error('Push notification setup failed:', err.message);
    return null;
  }
}

// Get thread messages
async function getThread(tokens, threadId) {
  const gmail = getGmailClient(tokens);
  const { data } = await gmail.users.threads.get({ userId: 'me', id: threadId, format: 'full' });
  return {
    id: data.id,
    messages: (data.messages || []).map(formatMessage),
  };
}

module.exports = {
  listMessages,
  getMessage,
  sendEmail,
  markAsRead,
  searchMessages,
  setupPushNotifications,
  getThread,
};
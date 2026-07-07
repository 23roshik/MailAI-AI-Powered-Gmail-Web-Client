import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { gmailAPI, authAPI } from '../services/api';

const MailContext = createContext(null);

export function MailProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState('inbox'); // inbox | sent | compose | email_detail
  const [openEmail, setOpenEmail] = useState(null);
  const [emails, setEmails] = useState([]);
  const [sentEmails, setSentEmails] = useState([]);
  const [emailLoading, setEmailLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [composeData, setComposeData] = useState({ to: '', cc: '', subject: '', body: '' });
  const [composeMode, setComposeMode] = useState('new'); // new | reply | forward
  const [notification, setNotification] = useState(null);
  const [aiFlashField, setAiFlashField] = useState(null);
  const socketRef = useRef(null);

  // ──── Auth ────────────────────────────────────────────────────────────────
  useEffect(() => {
    authAPI.getMe()
      .then(data => setUser(data.authenticated ? data.user : null))
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));

    // Handle OAuth redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'success') {
      window.history.replaceState({}, '', '/');
      authAPI.getMe().then(data => {
        if (data.authenticated) setUser(data.user);
      });
    }
  }, []);

  // ──── Socket.io ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const socket = io({ withCredentials: true });
    socketRef.current = socket;

    socket.on('gmail:new_message', () => {
      showNotification('📬 New email received!', 'info');
      loadInbox(filters);
    });

    socket.on('gmail:poll_refresh', () => {
      loadInbox(filters);
    });

    socket.on('gmail:email_sent', () => {
      showNotification('✅ Email sent!', 'success');
    });

    return () => socket.disconnect();
  }, [user]);

  // ──── Polling fallback (every 60s) ────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      silentRefreshInbox();
    }, 60000);
    return () => clearInterval(interval);
  }, [user, filters]);

  // ──── Email loading ────────────────────────────────────────────────────────
  const loadInbox = useCallback(async (filterParams = {}) => {
    setEmailLoading(true);
    try {
      const hasFilters = Object.keys(filterParams).some(k => filterParams[k]);
      let result;
      if (hasFilters) {
        result = await gmailAPI.search(filterParams);
      } else {
        result = await gmailAPI.getInbox();
      }
      setEmails(result.messages || []);
    } catch (err) {
      console.error('Load inbox error:', err);
      showNotification('Failed to load inbox', 'error');
    } finally {
      setEmailLoading(false);
    }
  }, []);

  const silentRefreshInbox = useCallback(async () => {
    try {
      const hasFilters = Object.keys(filters).some(k => filters[k]);
      let result;
      if (hasFilters) {
        result = await gmailAPI.search(filters);
      } else {
        result = await gmailAPI.getInbox();
      }
      setEmails(result.messages || []);
    } catch {}
  }, [filters]);

  const loadSent = useCallback(async () => {
    setEmailLoading(true);
    try {
      const result = await gmailAPI.getSent();
      setSentEmails(result.messages || []);
    } catch (err) {
      console.error('Load sent error:', err);
      showNotification('Failed to load sent emails', 'error');
    } finally {
      setEmailLoading(false);
    }
  }, []);

  // ──── Navigation ───────────────────────────────────────────────────────────
  const navigate = useCallback((view) => {
    setCurrentView(view);
    if (view === 'inbox' && emails.length === 0) loadInbox(filters);
    if (view === 'sent' && sentEmails.length === 0) loadSent();
    if (view === 'compose' && composeMode === 'new') {
      // don't reset if already set by AI
    }
  }, [emails, sentEmails, filters, composeMode, loadInbox, loadSent]);

  const openEmailById = useCallback(async (emailId) => {
    try {
      const email = await gmailAPI.getMessage(emailId);
      setOpenEmail(email);
      setCurrentView('email_detail');
      // Mark as read in local state
      setEmails(prev => prev.map(e => e.id === emailId ? { ...e, isUnread: false } : e));
    } catch (err) {
      console.error('Open email error:', err);
      showNotification('Failed to open email', 'error');
    }
  }, []);

  // ──── Compose ──────────────────────────────────────────────────────────────
  const startCompose = useCallback((data = {}, mode = 'new') => {
    setComposeData({ to: '', cc: '', subject: '', body: '', ...data });
    setComposeMode(mode);
    setCurrentView('compose');
  }, []);

  const startReply = useCallback((email) => {
    const replySubject = email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`;
    startCompose({
      to: email.from,
      subject: replySubject,
      body: `\n\n---\nOn ${email.date}, ${email.from} wrote:\n${email.body?.text?.substring(0, 300) || email.snippet}`,
      replyToMessageId: email.id,
      threadId: email.threadId,
    }, 'reply');
  }, [startCompose]);

  const startForward = useCallback((email, to = '') => {
    const fwdSubject = email.subject.startsWith('Fwd:') ? email.subject : `Fwd: ${email.subject}`;
    startCompose({
      to,
      subject: fwdSubject,
      body: `\n\n---\nForwarded message\nFrom: ${email.from}\nDate: ${email.date}\nSubject: ${email.subject}\n\n${email.body?.text || email.snippet}`,
    }, 'forward');
  }, [startCompose]);

  const sendEmail = useCallback(async (data) => {
    const payload = { ...composeData, ...data };
    await gmailAPI.sendEmail(payload);
    showNotification('Email sent successfully!', 'success');
    setCurrentView('inbox');
    setComposeData({ to: '', cc: '', subject: '', body: '' });
    setComposeMode('new');
    // Refresh sent
    setTimeout(() => loadSent(), 1000);
  }, [composeData, loadSent]);

  // ──── Filters ──────────────────────────────────────────────────────────────
  const applyFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    loadInbox(newFilters);
    setCurrentView('inbox');
  }, [loadInbox]);

  const clearFilters = useCallback(() => {
    setFilters({});
    loadInbox({});
    setCurrentView('inbox');
  }, [loadInbox]);

  // ──── AI Actions executor ──────────────────────────────────────────────────
  const executeActions = useCallback(async (actions = []) => {
    for (const action of actions) {
      switch (action.type) {
        case 'navigate':
          navigate(action.view);
          break;

        case 'fill_compose': {
          const newData = {
            to: action.to || '',
            cc: action.cc || '',
            subject: action.subject || '',
            body: action.body || '',
          };
          setComposeData(newData);
          // Flash each field as AI fills it
          for (const field of ['to', 'cc', 'subject', 'body']) {
            if (action[field]) {
              setAiFlashField(field);
              await delay(150);
            }
          }
          setAiFlashField(null);
          break;
        }

        case 'open_email':
          if (action.emailId) await openEmailById(action.emailId);
          break;

        case 'filter_inbox':
          if (action.filters) {
            applyFilters(action.filters);
          }
          break;

        case 'search': {
          const searchFilters = action.filters || {};
          if (action.query) searchFilters.keyword = action.query;
          applyFilters(searchFilters);
          break;
        }

        case 'send_email':
          await sendEmail({});
          break;

        case 'reply_to_email':
          if (openEmail) {
            startReply({ ...openEmail, body: { text: action.body || '' } });
          }
          break;

        case 'forward_email':
          if (openEmail) {
            startForward(openEmail, action.to || '');
          }
          break;

        case 'clear_filters':
          clearFilters();
          break;

        default:
          console.warn('Unknown action:', action.type);
      }
      await delay(100);
    }
  }, [navigate, openEmailById, applyFilters, clearFilters, sendEmail, startReply, startForward, openEmail]);

  // ──── Notification ─────────────────────────────────────────────────────────
  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  // ──── Logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await authAPI.logout();
    setUser(null);
    setEmails([]);
    setSentEmails([]);
    setOpenEmail(null);
  }, []);

  return (
    <MailContext.Provider value={{
      // Auth
      user, authLoading, logout,
      // View
      currentView, navigate, setCurrentView,
      // Emails
      emails, sentEmails, openEmail, setOpenEmail, emailLoading,
      loadInbox, loadSent, openEmailById,
      // Compose
      composeData, setComposeData, composeMode,
      startCompose, startReply, startForward, sendEmail,
      // Filters
      filters, applyFilters, clearFilters,
      // AI
      executeActions, aiFlashField,
      // UI
      notification, showNotification,
    }}>
      {children}
    </MailContext.Provider>
  );
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function useMail() {
  const ctx = useContext(MailContext);
  if (!ctx) throw new Error('useMail must be used within MailProvider');
  return ctx;
}
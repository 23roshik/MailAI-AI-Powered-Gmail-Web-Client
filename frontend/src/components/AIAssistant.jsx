import React, { useState, useRef, useEffect } from 'react';
import { useMail } from '../context/MailContext';
import { aiAPI } from '../services/api';

const SUGGESTIONS = [
  'Show unread emails',
  'Show emails from last 7 days',
  'Compose a new email',
  'Open the latest email',
  'Filter emails from today',
];

function MessageBubble({ msg }) {
  const isAI = msg.role === 'assistant';
  const isError = msg.isError;

  return (
    <div className={`flex gap-2 animate-fade-in ${isAI ? '' : 'flex-row-reverse'}`}>
      {/* Avatar */}
      {isAI && (
        <div className="w-7 h-7 bg-purple-700 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-3.5 h-3.5 text-purple-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
          </svg>
        </div>
      )}

      <div className={`max-w-[85%] ${isAI ? '' : 'items-end flex flex-col'}`}>
        {/* Bubble */}
        <div className={`
          rounded-2xl px-3 py-2.5 text-sm leading-relaxed
          ${isAI
            ? isError
              ? 'bg-red-900/40 border border-red-800 text-red-300'
              : 'bg-gray-800 text-gray-100'
            : 'bg-brand-600 text-white'}
        `}>
          {msg.content}
        </div>

        {/* Actions display */}
        {isAI && msg.actions && msg.actions.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {msg.actions.map((action, i) => (
              <ActionBadge key={i} action={action} />
            ))}
          </div>
        )}

        {/* Email previews in AI response */}
        {isAI && msg.emailPreviews && msg.emailPreviews.length > 0 && (
          <div className="mt-2 space-y-1 w-full">
            {msg.emailPreviews.map(email => (
              <EmailPreviewCard key={email.id} email={email} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionBadge({ action }) {
  const labels = {
    navigate: `→ Navigated to ${action.view}`,
    fill_compose: '✏️ Filled compose form',
    open_email: '📧 Opened email',
    filter_inbox: '🔍 Applied filters',
    send_email: '📤 Sent email',
    reply_to_email: '↩️ Started reply',
    forward_email: '↪️ Started forward',
    clear_filters: '🗑️ Cleared filters',
    search: '🔍 Searched emails',
  };

  return (
    <span className="inline-flex items-center text-xs bg-purple-900/40 text-purple-300 border border-purple-800/50 rounded-full px-2 py-0.5">
      {labels[action.type] || action.type}
    </span>
  );
}

function EmailPreviewCard({ email }) {
  const { openEmailById } = useMail();
  const fromName = email.from?.split('<')[0]?.trim() || email.from;

  return (
    <div
      onClick={() => openEmailById(email.id)}
      className="bg-gray-700/50 border border-gray-700 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-700 transition-colors text-xs"
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-medium text-gray-200 truncate">{fromName}</span>
        {email.isUnread && <span className="w-1.5 h-1.5 bg-brand-400 rounded-full flex-shrink-0" />}
      </div>
      <p className="text-gray-400 truncate">{email.subject}</p>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2">
      <div className="w-7 h-7 bg-purple-700 rounded-full flex items-center justify-center flex-shrink-0">
        <svg className="w-3.5 h-3.5 text-purple-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
        </svg>
      </div>
      <div className="bg-gray-800 rounded-2xl px-4 py-3 flex items-center gap-1">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  );
}

function ConfirmationDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="mx-3 mb-3 bg-amber-900/30 border border-amber-700 rounded-xl p-3 animate-fade-in">
      <p className="text-sm text-amber-200 mb-3">{message}</p>
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          className="flex-1 bg-brand-600 hover:bg-brand-500 text-white text-sm py-1.5 rounded-lg font-medium transition-colors"
        >
          ✓ Confirm & Send
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm py-1.5 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function AIAssistant() {
  const { currentView, openEmail, emails, filters, executeActions, showNotification } = useMail();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your AI mail assistant. I can control the UI for you — compose emails, search your inbox, open specific messages, and more. What would you like to do?",
      actions: [],
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const getContext = () => ({
    currentView,
    openEmail: openEmail ? {
      id: openEmail.id,
      threadId: openEmail.threadId,
      from: openEmail.from,
      to: openEmail.to,
      subject: openEmail.subject,
      snippet: openEmail.snippet,
      date: openEmail.date,
      body: { text: openEmail.body?.text?.substring(0, 500) },
    } : null,
    emailList: emails,
    filters,
  });

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;

    setInput('');
    const newUserMsg = { role: 'user', content: userText };
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const context = getContext();
      // Only send last 10 messages to API to keep context manageable
      const apiMessages = updatedMessages.slice(-10).map(m => ({ role: m.role, content: m.content }));

      const result = await aiAPI.chat(apiMessages, context);

      const aiMsg = {
        role: 'assistant',
        content: result.message || 'Done!',
        actions: result.actions || [],
        emailPreviews: result.actions?.some(a => a.type === 'filter_inbox' || a.type === 'search')
          ? emails.slice(0, 5)
          : [],
      };

      setMessages(prev => [...prev, aiMsg]);

      // Execute UI actions
      if (result.actions && result.actions.length > 0) {
        if (result.requiresConfirmation) {
          // Execute non-send actions first (navigate, fill_compose)
          const preActions = result.actions.filter(a => a.type !== 'send_email');
          const sendActions = result.actions.filter(a => a.type === 'send_email');

          if (preActions.length > 0) await executeActions(preActions);

          if (sendActions.length > 0) {
            setPendingConfirmation({
              message: result.confirmationMessage || 'Are you sure you want to send this email?',
              actions: sendActions,
            });
          }
        } else {
          await executeActions(result.actions);
        }
      }
    } catch (err) {
      console.error('AI chat error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I ran into an error. Please try again.',
        isError: true,
        actions: [],
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleConfirm = async () => {
    if (!pendingConfirmation) return;
    const actions = pendingConfirmation.actions;
    setPendingConfirmation(null);
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: 'Sending the email now! ✉️',
      actions: [{ type: 'send_email' }],
    }]);
    try {
      await executeActions(actions);
    } catch (err) {
      showNotification('Failed to send email: ' + err.message, 'error');
    }
  };

  const handleCancel = () => {
    setPendingConfirmation(null);
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: 'No problem! The email was not sent. You can edit it in the compose window.',
      actions: [],
    }]);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-800 flex-shrink-0">
        <div className="w-7 h-7 bg-purple-700 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-purple-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">AI Assistant</h3>
          <p className="text-xs text-purple-400">Controls your UI</p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs text-gray-500">Live</span>
        </div>
      </div>

      {/* Context badge */}
      <div className="px-3 py-2 border-b border-gray-800/60 flex-shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="text-gray-600">Context:</span>
          <span className="bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full capitalize">{currentView}</span>
          {openEmail && (
            <span className="bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full truncate max-w-[120px]">
              📧 {openEmail.subject?.substring(0, 20)}...
            </span>
          )}
          {Object.keys(filters).some(k => filters[k]) && (
            <span className="bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded-full">Filtered</span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Confirmation dialog */}
      {pendingConfirmation && (
        <ConfirmationDialog
          message={pendingConfirmation.message}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}

      {/* Suggestions */}
      {messages.length <= 2 && !loading && (
        <div className="px-3 pb-2 flex-shrink-0">
          <p className="text-xs text-gray-500 mb-1.5">Try asking:</p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-2.5 py-1 rounded-full transition-colors border border-gray-700"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 p-3 border-t border-gray-800">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask me to do anything..."
            rows={1}
            className="flex-1 input-field text-sm resize-none min-h-[38px] max-h-24"
            style={{ height: 'auto' }}
            onInput={e => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
            }}
            disabled={loading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="flex-shrink-0 w-9 h-9 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-1.5 text-center">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { useMail } from '../context/MailContext';

export default function Compose() {
  const { composeData, setComposeData, sendEmail, navigate, composeMode, aiFlashField, showNotification } = useMail();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setComposeData(prev => ({ ...prev, [field]: value }));
  };

  const handleSend = async () => {
    if (!composeData.to) return setError('Recipient (To) is required');
    if (!composeData.subject) return setError('Subject is required');
    if (!composeData.body) return setError('Email body is required');

    setError('');
    setSending(true);
    try {
      await sendEmail(composeData);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to send email. Please try again.');
      setSending(false);
    }
  };

  const fieldClass = (field) =>
    `input-field transition-all duration-200 ${aiFlashField === field ? 'ring-2 ring-brand-400 border-brand-400 bg-brand-950/20 ai-action-flash' : ''}`;

  const title = composeMode === 'reply' ? 'Reply' : composeMode === 'forward' ? 'Forward' : 'New Email';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 flex-shrink-0">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <button
          onClick={() => navigate('inbox')}
          className="btn-ghost p-2"
          title="Discard"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 flex flex-col p-4 gap-3 overflow-y-auto">
        {/* To */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">To</label>
          <input
            type="email"
            className={fieldClass('to')}
            placeholder="recipient@example.com"
            value={composeData.to || ''}
            onChange={e => handleChange('to', e.target.value)}
          />
        </div>

        {/* CC */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Cc (optional)</label>
          <input
            type="text"
            className={fieldClass('cc')}
            placeholder="cc@example.com"
            value={composeData.cc || ''}
            onChange={e => handleChange('cc', e.target.value)}
          />
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Subject</label>
          <input
            type="text"
            className={fieldClass('subject')}
            placeholder="Email subject"
            value={composeData.subject || ''}
            onChange={e => handleChange('subject', e.target.value)}
          />
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col">
          <label className="block text-xs font-medium text-gray-400 mb-1">Message</label>
          <textarea
            className={`${fieldClass('body')} flex-1 resize-none min-h-[200px]`}
            placeholder="Write your email..."
            value={composeData.body || ''}
            onChange={e => handleChange('body', e.target.value)}
            rows={10}
          />
        </div>

        {/* AI filling indicator */}
        {aiFlashField && (
          <div className="flex items-center gap-2 text-xs text-brand-400 animate-fade-in">
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            AI is filling in the {aiFlashField} field...
          </div>
        )}

        {error && (
          <div className="text-sm text-red-400 bg-red-900/20 border border-red-800 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-800 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={handleSend}
          disabled={sending}
          className="btn-primary flex items-center gap-2"
        >
          {sending ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sending...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send
            </>
          )}
        </button>
        <button
          onClick={() => navigate('inbox')}
          className="btn-secondary"
          disabled={sending}
        >
          Discard
        </button>
      </div>
    </div>
  );
}
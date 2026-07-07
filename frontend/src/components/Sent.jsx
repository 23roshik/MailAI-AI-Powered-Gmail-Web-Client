import React, { useEffect } from 'react';
import { useMail } from '../context/MailContext';
import { format } from 'date-fns';

function SentRow({ email, selected, onClick }) {
  const dateStr = email.timestamp
    ? (() => {
        const d = new Date(email.timestamp);
        const now = new Date();
        const diffDays = Math.floor((now - d) / 86400000);
        if (diffDays === 0) return format(d, 'h:mm a');
        if (diffDays < 7) return format(d, 'EEE');
        return format(d, 'MMM d');
      })()
    : '';

  const toName = email.to?.split('<')[0]?.trim() || email.to || 'Unknown';

  return (
    <div onClick={onClick} className={`email-row ${selected ? 'selected' : ''}`}>
      <div className="flex-shrink-0 mt-1.5">
        <svg className="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 mb-0.5">
          <span className="text-sm text-gray-300 truncate">To: {toName}</span>
          <span className="text-xs text-gray-500 flex-shrink-0">{dateStr}</span>
        </div>
        <p className="text-sm text-gray-400 truncate mb-0.5">{email.subject}</p>
        <p className="text-xs text-gray-500 truncate">{email.snippet}</p>
      </div>
    </div>
  );
}

export default function Sent() {
  const { sentEmails, emailLoading, openEmailById, openEmail, loadSent } = useMail();

  useEffect(() => {
    if (sentEmails.length === 0) loadSent();
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">Sent</h2>
          <span className="text-sm text-gray-500">{sentEmails.length} emails</span>
        </div>
        <button onClick={loadSent} className="btn-ghost" disabled={emailLoading} title="Refresh">
          <svg className={`w-4 h-4 ${emailLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {emailLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sentEmails.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-center">
            <div>
              <p className="text-4xl mb-3">📤</p>
              <p className="text-gray-400">No sent emails yet</p>
            </div>
          </div>
        ) : (
          sentEmails.map(email => (
            <SentRow
              key={email.id}
              email={email}
              selected={openEmail?.id === email.id}
              onClick={() => openEmailById(email.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useMail } from '../context/MailContext';
import { formatDistanceToNow, format } from 'date-fns';
import Filters from './Filters';

function EmailRow({ email, selected, onClick }) {
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

  const fromName = email.from?.split('<')[0]?.trim() || email.from || 'Unknown';

  return (
    <div
      onClick={onClick}
      className={`email-row ${email.isUnread ? 'unread' : ''} ${selected ? 'selected' : ''}`}
    >
      {/* Unread dot */}
      <div className="flex-shrink-0 mt-1.5">
        <div className={`w-2 h-2 rounded-full ${email.isUnread ? 'bg-brand-400' : 'bg-transparent'}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 mb-0.5">
          <span className={`text-sm truncate ${email.isUnread ? 'font-semibold text-white' : 'text-gray-300'}`}>
            {fromName}
          </span>
          <span className="text-xs text-gray-500 flex-shrink-0">{dateStr}</span>
        </div>
        <p className={`text-sm truncate mb-0.5 ${email.isUnread ? 'text-gray-200' : 'text-gray-400'}`}>
          {email.subject}
        </p>
        <p className="text-xs text-gray-500 truncate">{email.snippet}</p>
      </div>
    </div>
  );
}

export default function Inbox() {
  const { emails, emailLoading, openEmailById, openEmail, currentView, filters, applyFilters, clearFilters, loadInbox } = useMail();
  const [showFilters, setShowFilters] = useState(false);

  const hasFilters = Object.keys(filters).some(k => filters[k]);

  useEffect(() => {
    if (emails.length === 0 && !emailLoading) {
      loadInbox(filters);
    }
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">
            {hasFilters ? 'Filtered Results' : 'Inbox'}
          </h2>
          {hasFilters && (
            <span className="text-xs bg-brand-900/60 text-brand-300 px-2 py-0.5 rounded-full">
              Filtered
            </span>
          )}
          <span className="text-sm text-gray-500">{emails.length} emails</span>
        </div>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-gray-400 hover:text-red-400 transition-colors"
            >
              Clear filters
            </button>
          )}
          <button
            onClick={() => setShowFilters(o => !o)}
            className={`btn-ghost text-sm ${showFilters ? 'bg-gray-800 text-white' : ''}`}
          >
            <svg className="w-4 h-4 inline mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter
          </button>
          <button
            onClick={() => loadInbox(filters)}
            className="btn-ghost"
            disabled={emailLoading}
            title="Refresh"
          >
            <svg className={`w-4 h-4 ${emailLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="border-b border-gray-800 bg-gray-900/50">
          <Filters filters={filters} onApply={(f) => { applyFilters(f); setShowFilters(false); }} onClear={clearFilters} />
        </div>
      )}

      {/* Email list */}
      <div className="flex-1 overflow-y-auto">
        {emailLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 text-sm">Loading emails...</p>
            </div>
          </div>
        ) : emails.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-gray-400 font-medium">
                {hasFilters ? 'No emails match your filters' : 'Your inbox is empty'}
              </p>
              {hasFilters && (
                <button onClick={clearFilters} className="mt-3 text-brand-400 hover:text-brand-300 text-sm underline">
                  Clear filters
                </button>
              )}
            </div>
          </div>
        ) : (
          emails.map(email => (
            <EmailRow
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
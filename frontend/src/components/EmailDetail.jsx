import React, { useState, useEffect } from 'react';
import { useMail } from '../context/MailContext';
import { format } from 'date-fns';
import { gmailAPI } from '../services/api';

function formatDate(dateStr, timestamp) {
  try {
    const d = timestamp ? new Date(timestamp) : new Date(dateStr);
    return format(d, 'EEE, MMM d, yyyy \'at\' h:mm a');
  } catch { return dateStr; }
}

export default function EmailDetail() {
  const { openEmail, navigate, startReply, startForward } = useMail();
  const [thread, setThread] = useState(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [showThread, setShowThread] = useState(false);

  useEffect(() => {
    if (!openEmail) navigate('inbox');
  }, [openEmail]);

  const loadThread = async () => {
    if (!openEmail?.threadId) return;
    setThreadLoading(true);
    try {
      const t = await gmailAPI.getThread(openEmail.threadId);
      setThread(t);
      setShowThread(true);
    } catch (err) {
      console.error('Load thread error:', err);
    } finally {
      setThreadLoading(false);
    }
  };

  if (!openEmail) return null;

  const fromName = openEmail.from?.split('<')[0]?.trim() || openEmail.from;
  const fromEmail = openEmail.from?.match(/<(.+)>/)?.[1] || openEmail.from;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 flex-shrink-0">
        <button
          onClick={() => navigate('inbox')}
          className="btn-ghost p-2"
          title="Back"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold text-white truncate flex-1">{openEmail.subject}</h2>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => startReply(openEmail)}
            className="btn-ghost text-sm flex items-center gap-1.5"
            title="Reply"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Reply
          </button>
          <button
            onClick={() => startForward(openEmail)}
            className="btn-ghost text-sm flex items-center gap-1.5"
            title="Forward"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
            Forward
          </button>
        </div>
      </div>

      {/* Email Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-3xl">
          {/* Metadata */}
          <div className="mb-6">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-brand-700 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold text-white">
                {fromName?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <div>
                    <span className="text-sm font-semibold text-white">{fromName}</span>
                    <span className="text-xs text-gray-500 ml-2">&lt;{fromEmail}&gt;</span>
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {formatDate(openEmail.date, openEmail.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  To: {openEmail.to}
                  {openEmail.cc && <span> · Cc: {openEmail.cc}</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="border-t border-gray-800 pt-4">
            {openEmail.body?.html ? (
              <div
                className="email-body-html"
                dangerouslySetInnerHTML={{
                  __html: openEmail.body.html
                    // Basic sandbox: remove scripts
                    .replace(/<script[\s\S]*?<\/script>/gi, '')
                    .replace(/javascript:/gi, '')
                }}
              />
            ) : (
              <pre className="text-sm text-gray-200 whitespace-pre-wrap font-sans leading-relaxed">
                {openEmail.body?.text || openEmail.snippet || '(Empty email)'}
              </pre>
            )}
          </div>

          {/* Thread */}
          {openEmail.threadId && (
            <div className="mt-6 pt-4 border-t border-gray-800">
              {!showThread ? (
                <button
                  onClick={loadThread}
                  disabled={threadLoading}
                  className="flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors"
                >
                  {threadLoading ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  )}
                  {threadLoading ? 'Loading thread...' : 'View conversation thread'}
                </button>
              ) : thread && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-400">
                      Conversation ({thread.messages?.length || 0} messages)
                    </h3>
                    <button onClick={() => setShowThread(false)} className="text-xs text-gray-500 hover:text-gray-300">
                      Hide
                    </button>
                  </div>
                  {thread.messages?.filter(m => m.id !== openEmail.id).map(msg => (
                    <div key={msg.id} className="card p-4 text-sm">
                      <div className="flex items-baseline justify-between mb-2">
                        <span className="font-medium text-gray-300">{msg.from}</span>
                        <span className="text-xs text-gray-500">{formatDate(msg.date, msg.timestamp)}</span>
                      </div>
                      <p className="text-gray-400 text-xs leading-relaxed line-clamp-3">{msg.snippet}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick reply bar */}
      <div className="px-4 py-3 border-t border-gray-800 flex-shrink-0">
        <button
          onClick={() => startReply(openEmail)}
          className="w-full flex items-center gap-3 px-4 py-2.5 bg-gray-800/60 hover:bg-gray-800 rounded-lg text-sm text-gray-400 hover:text-gray-200 transition-colors text-left"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          Click to reply, or ask the AI to reply for you...
        </button>
      </div>
    </div>
  );
}
import React from 'react';
import { authAPI } from '../services/api';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600 rounded-2xl mb-4 shadow-lg shadow-brand-900/50">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">MailAI</h1>
          <p className="text-gray-400 text-sm">Your AI-powered email copilot</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <h2 className="text-xl font-semibold text-white mb-2">Sign in to continue</h2>
          <p className="text-gray-400 text-sm mb-6">
            Connect your Gmail account to start using the AI assistant to manage your emails.
          </p>

          <a
            href={authAPI.loginUrl}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 hover:bg-gray-100 px-5 py-3 rounded-xl font-medium transition-colors duration-200 shadow-md"
          >
            <svg className="w-5 h-5" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.6 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.2 6.7 29.4 4.5 24 4.5 12.9 4.5 4 13.4 4 24.5S12.9 44.5 24 44.5 44 35.6 44 24.5c0-1.5-.2-2.9-.4-4.4z"/>
              <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.5 15.7 18.9 12 24 12c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.2 6.7 29.4 4.5 24 4.5c-7.5 0-14 4.3-17.7 10.2z"/>
              <path fill="#4CAF50" d="M24 44.5c5.3 0 10-1.9 13.6-5.1l-6.3-5.3C29.3 35.7 26.8 36.5 24 36.5c-5.3 0-9.6-3.3-11.3-7.9L6 33.7C9.6 40.2 16.3 44.5 24 44.5z"/>
              <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.4 4.2-4.3 5.6l6.3 5.3C37 38.5 44 33 44 24.5c0-1.5-.2-2.9-.4-4.4z"/>
            </svg>
            Continue with Google
          </a>

          <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
            <p className="text-xs text-gray-500 text-center leading-relaxed">
              Requires Gmail access permissions to read, send, and manage your emails.
              Your credentials are stored securely and never shared.
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          {[
            { icon: '🤖', label: 'AI Controls UI' },
            { icon: '📬', label: 'Real-time Sync' },
            { icon: '🔍', label: 'Smart Search' },
          ].map(f => (
            <div key={f.label} className="p-3">
              <div className="text-2xl mb-1">{f.icon}</div>
              <p className="text-xs text-gray-500">{f.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { useMail } from '../context/MailContext';

const navItems = [
  {
    id: 'inbox',
    label: 'Inbox',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    ),
  },
  {
    id: 'sent',
    label: 'Sent',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
  },
  {
    id: 'compose',
    label: 'Compose',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
];

export default function Sidebar({ onToggleAI, aiOpen }) {
  const { currentView, navigate, user, logout, emails, startCompose } = useMail();

  const unreadCount = emails.filter(e => e.isUnread).length;

  const handleNav = (id) => {
    if (id === 'compose') {
      startCompose({}, 'new');
    } else {
      navigate(id);
    }
  };

  return (
    <div className="w-16 xl:w-56 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="p-4 flex items-center gap-3 border-b border-gray-800">
        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <span className="font-bold text-white text-lg hidden xl:block">MailAI</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => handleNav(item.id)}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150
              ${currentView === item.id || (item.id === 'compose' && currentView === 'compose')
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/50'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'}
            `}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            <span className="hidden xl:block">{item.label}</span>
            {item.id === 'inbox' && unreadCount > 0 && (
              <span className="ml-auto hidden xl:flex items-center justify-center min-w-[20px] h-5 bg-brand-500 text-white text-xs rounded-full px-1.5">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* AI Toggle */}
      <div className="p-2 border-t border-gray-800">
        <button
          onClick={onToggleAI}
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150
            ${aiOpen ? 'bg-purple-900/50 text-purple-300' : 'text-gray-400 hover:text-white hover:bg-gray-800'}
          `}
          title="Toggle AI Assistant"
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
          </svg>
          <span className="hidden xl:block">AI Assistant</span>
          {aiOpen && <span className="hidden xl:block ml-auto text-xs text-purple-400">●</span>}
        </button>
      </div>

      {/* User */}
      <div className="p-3 border-t border-gray-800">
        <div className="flex items-center gap-3">
          {user?.picture ? (
            <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-gray-300">
                {user?.name?.[0] || user?.email?.[0] || '?'}
              </span>
            </div>
          )}
          <div className="hidden xl:block min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-200 truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="hidden xl:block text-gray-500 hover:text-gray-300 transition-colors ml-auto flex-shrink-0"
            title="Sign out"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
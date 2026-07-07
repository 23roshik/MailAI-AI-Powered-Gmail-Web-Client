import React from 'react';

const colors = {
  success: 'bg-green-900/90 border-green-700 text-green-200',
  error: 'bg-red-900/90 border-red-700 text-red-200',
  info: 'bg-brand-900/90 border-brand-700 text-brand-200',
};

export default function Notification({ notification }) {
  const cls = colors[notification?.type] || colors.info;

  return (
    <div className={`
      fixed bottom-5 right-5 z-50 max-w-sm
      border rounded-xl px-4 py-3 shadow-2xl text-sm font-medium
      animate-slide-in backdrop-blur-sm
      ${cls}
    `}>
      {notification.message}
    </div>
  );
}
import React, { useEffect } from 'react';
import { MailProvider, useMail } from './context/MailContext';
import Layout from './components/Layout';
import LoginPage from './components/LoginPage';

function AppInner() {
  const { user, authLoading, currentView, loadInbox } = useMail();

  useEffect(() => {
    if (user) loadInbox({});
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading MailAI...</p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return <Layout />;
}

export default function App() {
  return (
    <MailProvider>
      <div className='bg-red-800 max-h-screen'>

      <AppInner />
      </div>
    </MailProvider>
  );
}
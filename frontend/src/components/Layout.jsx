import React, { useState } from 'react';
import { useMail } from '../context/MailContext';
import Sidebar from './Sidebar';
import Inbox from './Inbox';
import Sent from './Sent';
import Compose from './Compose';
import EmailDetail from './EmailDetail';
import AIAssistant from './AIAssistant';
import Notification from './Notification';

export default function Layout() {
  const { currentView, notification } = useMail();
  const [aiOpen, setAiOpen] = useState(true);

  return (
    <div className="h-screen bg-gray-950 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar onToggleAI={() => setAiOpen(o => !o)} aiOpen={aiOpen} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="flex-1 overflow-hidden flex">
          {/* Email Views */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {currentView === 'inbox' && <Inbox />}
            {currentView === 'sent' && <Sent />}
            {currentView === 'compose' && <Compose />}
            {currentView === 'email_detail' && <EmailDetail />}
          </div>

          {/* AI Assistant Panel */}
          {aiOpen && (
            <div className="w-80 xl:w-96 border-l border-gray-800 flex-shrink-0 overflow-hidden">
              <AIAssistant />
            </div>
          )}
        </div>
      </main>

      {/* Notification Toast */}
      {notification && <Notification notification={notification} />}
    </div>
  );
}
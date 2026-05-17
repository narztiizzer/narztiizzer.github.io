import React, { useState } from 'react';
import { LogOut, User, ChevronLeft, Layout, Share2, Check } from 'lucide-react';

interface HeaderProps {
  userName: string;
  sessionTitle?: string;
  onBack?: () => void;
  onLogout: () => void;
  sessionId?: string;
}

const Header: React.FC<HeaderProps> = ({ userName, sessionTitle, onBack, onLogout, sessionId }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (!sessionId) return;
    const url = new URL(window.location.href);
    url.searchParams.set('session', sessionId);
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center z-10">
      <div className="flex items-center gap-4">
        {onBack ? (
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
            title="Back to Dashboard"
          >
            <ChevronLeft size={24} />
          </button>
        ) : (
          <div className="p-2 bg-indigo-600 rounded-lg text-white">
            <Layout size={24} />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            {sessionTitle || 'Retrospective Board'}
          </h1>
          {sessionTitle && (
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
              Retrospective Session
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {sessionId && (
          <button
            onClick={handleShare}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
              copied 
                ? 'bg-green-50 border-green-200 text-green-600' 
                : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
            }`}
          >
            {copied ? <Check size={18} /> : <Share2 size={18} />}
            <span className="text-sm font-medium">{copied ? 'Copied!' : 'Share'}</span>
          </button>
        )}
        <div className="hidden sm:flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
          <User size={18} />
          <span className="font-medium text-sm">{userName}</span>
        </div>
        <button 
          onClick={onLogout}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;

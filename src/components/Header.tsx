import React from 'react';
import { LogOut, User } from 'lucide-react';

interface HeaderProps {
  userName: string;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ userName, onLogout }) => {
  return (
    <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
      <h1 className="text-xl font-bold text-gray-800">Retrospective Board</h1>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-gray-600">
          <User size={20} />
          <span className="font-medium">{userName}</span>
        </div>
        <button 
          onClick={onLogout}
          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          title="Change Name"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;

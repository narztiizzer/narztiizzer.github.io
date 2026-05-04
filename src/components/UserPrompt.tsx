import React, { useState } from 'react';

interface UserPromptProps {
  onSetUserName: (name: string) => void;
}

const UserPrompt: React.FC<UserPromptProps> = ({ onSetUserName }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSetUserName(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 text-center">Welcome!</h2>
        <p className="text-gray-600 mb-6 text-center">Please enter your name to join the retrospective session.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Name"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-black"
            autoFocus
          />
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-md font-semibold hover:bg-indigo-700 transition-colors"
          >
            Join Session
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserPrompt;

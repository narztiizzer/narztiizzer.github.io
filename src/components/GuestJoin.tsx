import React, { useState } from 'react';

interface GuestJoinProps {
  sessionTitle: string;
  onJoin: (name: string) => void;
}

const GuestJoin: React.FC<GuestJoinProps> = ({ sessionTitle, onJoin }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onJoin(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Join Retrospective</h2>
        <p className="text-indigo-600 font-semibold mb-4 text-lg">"{sessionTitle}"</p>
        <p className="text-gray-600 mb-6">
          You're joining as a guest. Please enter a nickname to start collaborating.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Nickname</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Alex, GuestDeveloper"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-black"
              autoFocus
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-md font-semibold hover:bg-indigo-700 transition-colors"
          >
            Join as Guest
          </button>
        </form>
        <div className="mt-6 border-t pt-4">
          <p className="text-sm text-gray-500">
            Already have an account? 
            <button 
              onClick={() => window.location.search = ''} 
              className="ml-1 text-indigo-600 hover:underline font-medium"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default GuestJoin;

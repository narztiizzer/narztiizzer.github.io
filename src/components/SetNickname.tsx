import React, { useState } from 'react';
import { supabase } from '../services/supabase';

interface SetNicknameProps {
  userId: string;
  onComplete: (nickname: string) => void;
}

const SetNickname: React.FC<SetNicknameProps> = ({ userId, onComplete }) => {
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Upsert profile with nickname
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: userId, nickname: nickname.trim(), updated_at: new Date().toISOString() });

      if (error) throw error;

      onComplete(nickname.trim());
    } catch (err: any) {
      setError(err.message || 'Failed to set nickname');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Set Your Nickname</h2>
        <p className="text-gray-600 mb-6">
          Please choose a nickname that will be displayed on your retrospective cards.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nickname</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g., CaptainAgile"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-black"
              autoFocus
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading || !nickname.trim()}
            className="w-full bg-indigo-600 text-white py-2 rounded-md font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Set Nickname'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetNickname;

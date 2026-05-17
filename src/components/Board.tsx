import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { type CardData } from '../types';
import RetroCard from './RetroCard';

interface BoardProps {
  config: {
    id: string;
    title: string;
    color: string;
    headerColor: string;
  };
  userName: string;
  authorId: string;
  sessionId: string;
  cards: CardData[];
}

const Board: React.FC<BoardProps> = ({ config, userName, authorId, sessionId, cards }) => {
  const [newCardContent, setNewCardContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const { setNodeRef } = useDroppable({
    id: config.id,
    data: {
      type: 'Board',
    },
  });

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardContent.trim()) return;

    const newCard = {
      board_id: config.id,
      session_id: sessionId,
      content: newCardContent.trim(),
      author: userName,
      author_id: authorId,
      order_index: cards.length,
    };

    const { error } = await supabase.from('cards').insert([newCard]);

    if (error) {
      console.error('Error adding card:', error);
    }

    setNewCardContent('');
    setIsAdding(false);
  };

  return (
    <div 
      ref={setNodeRef}
      className={`flex flex-col h-[calc(100vh-120px)] w-80 md:w-auto rounded-lg shadow-md overflow-hidden ${config.color}`}
    >
      <div className={`${config.headerColor} p-4 flex justify-between items-center text-white`}>
        <h2 className="font-bold uppercase tracking-wider">{config.title}</h2>
        <span className="bg-white/20 px-2 py-0.5 rounded text-sm font-medium">
          {cards.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isAdding ? (
          <form onSubmit={handleAddCard} className="bg-white p-3 rounded shadow-sm">
            <textarea
              className="w-full border-none focus:ring-0 resize-none text-gray-700 placeholder-gray-400"
              rows={3}
              placeholder="Type your message..."
              value={newCardContent}
              onChange={(e) => setNewCardContent(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddCard(e);
                }
                if (e.key === 'Escape') {
                  setIsAdding(false);
                }
              }}
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Add
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-2 flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-all bg-white/50"
          >
            <Plus size={20} />
            <span>Add Card</span>
          </button>
        )}

        <SortableContext 
          items={cards.map(c => c.id)} 
          strategy={verticalListSortingStrategy}
        >
          {cards.map((card) => (
            <RetroCard key={card.id} card={card} currentUserId={authorId} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};

export default Board;

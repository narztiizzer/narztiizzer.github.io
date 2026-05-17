import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { type CardData } from '../types';
import { supabase } from '../services/supabase';

interface RetroCardProps {
  card: CardData;
  currentUserId: string;
}

const RetroCard: React.FC<RetroCardProps> = ({ card, currentUserId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(card.content);
  const isOwner = card.author_id === currentUserId;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: card.id,
    disabled: isEditing,
    data: {
      type: 'Card',
      card,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  const handleUpdate = async () => {
    if (!editedContent.trim() || editedContent === card.content) {
      setIsEditing(false);
      setEditedContent(card.content);
      return;
    }

    const { error } = await supabase
      .from('cards')
      .update({ content: editedContent.trim() })
      .eq('id', card.id);

    if (error) {
      console.error('Error updating card:', error);
    } else {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this card?')) return;

    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', card.id);

    if (error) {
      console.error('Error deleting card:', error);
    }
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="bg-white p-4 rounded shadow-sm border-l-4 border-indigo-400 hover:shadow-md transition-shadow relative group"
    >
      {/* Drag Handle Area (only if not editing) */}
      {!isEditing && (
        <div 
          {...attributes} 
          {...listeners} 
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          aria-label="Drag to reorder"
        />
      )}

      <div className="relative z-10 pointer-events-none">
        {isEditing ? (
          <div className="pointer-events-auto">
            <textarea
              className="w-full p-2 border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800 text-sm"
              rows={3}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-2">
              <button 
                onClick={() => {
                  setIsEditing(false);
                  setEditedContent(card.content);
                }}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
              <button 
                onClick={handleUpdate}
                className="p-1 text-green-500 hover:text-green-700"
              >
                <Check size={18} />
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-gray-800 mb-3 whitespace-pre-wrap break-words">{card.content}</p>
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span className="font-semibold px-2 py-0.5 bg-gray-100 rounded-full">
                {card.author}
              </span>
              <span>
                {new Date(card.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Action Buttons (Visible on hover for owner) */}
      {isOwner && !isEditing && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <button 
            onClick={() => setIsEditing(true)}
            className="p-1.5 bg-white rounded-full shadow-sm border border-gray-100 text-gray-400 hover:text-indigo-600 transition-colors"
            title="Edit Card"
          >
            <Pencil size={14} />
          </button>
          <button 
            onClick={handleDelete}
            className="p-1.5 bg-white rounded-full shadow-sm border border-gray-100 text-gray-400 hover:text-red-500 transition-colors"
            title="Delete Card"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default RetroCard;

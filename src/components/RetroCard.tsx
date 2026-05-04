import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface CardData {
  id: string;
  board_id: string;
  content: string;
  author: string;
  created_at: string;
  order_index: number;
}

interface CardProps {
  card: CardData;
}

const RetroCard: React.FC<CardProps> = ({ card }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: card.id,
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

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-4 rounded shadow-sm border-l-4 border-indigo-400 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group relative"
    >
      <p className="text-gray-800 mb-3 whitespace-pre-wrap break-words">{card.content}</p>
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span className="font-semibold px-2 py-0.5 bg-gray-100 rounded-full">
          {card.author}
        </span>
        <span>
          {new Date(card.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

export default RetroCard;

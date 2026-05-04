import React, { useState, useEffect } from 'react';
import boardsConfig from './config/boards.json';
import Board from './components/Board';
import Header from './components/Header';
import UserPrompt from './components/UserPrompt';
import { supabase } from './services/supabase';
import { 
  DndContext, 
  PointerSensor, 
  useSensor, 
  useSensors,
  closestCorners,
  DragOverlay,
  defaultDropAnimationSideEffects,
  type DragEndEvent, 
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Interfaces
export interface BoardConfig {
  id: string;
  title: string;
  color: string;
  headerColor: string;
}

export interface CardData {
  id: string;
  board_id: string;
  content: string;
  author: string;
  created_at: string;
  order_index: number;
}

// Inlined RetroCard Component to fix binding errors
const InlineRetroCard: React.FC<{ card: CardData }> = ({ card }) => {
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

const App: React.FC = () => {
  const [userName, setUserName] = useState<string | null>(localStorage.getItem('userName'));
  const [boards] = useState<BoardConfig[]>(boardsConfig.boards);
  const [cards, setCards] = useState<CardData[]>([]);
  const [activeCard, setActiveCard] = useState<CardData | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .order('order_index', { ascending: true });

      if (mounted) {
        if (error) {
          console.error('Error fetching cards:', error);
        } else {
          setCards(data || []);
        }
      }
    };

    loadData();

    const channel = supabase
      .channel('global-cards')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cards' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setCards((prev) => [...prev, payload.new as CardData]);
          } else if (payload.eventType === 'DELETE') {
            setCards((prev) => prev.filter((c) => c.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            // We ignore updates from drag-and-drop broadcasts here 
            // to avoid state flickering, as they are handled by 'broadcast' below
            if (!payload.new.is_drag_update) {
              setCards((prev) => 
                prev.map((c) => (c.id === payload.new.id ? (payload.new as CardData) : c))
              );
            }
          }
        }
      )
      .on('broadcast', { event: 'cards-reordered' }, (payload) => {
        setCards(payload.payload.newCards);
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSetUserName = (name: string) => {
    localStorage.setItem('userName', name);
    setUserName(name);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const card = cards.find((c) => c.id === active.id);
    if (card) setActiveCard(card);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveACard = active.data.current?.type === 'Card';
    const isOverACard = over.data.current?.type === 'Card';
    const isOverABoard = over.data.current?.type === 'Board';

    if (!isActiveACard) return;

    if (isOverACard) {
      setCards((prev) => {
        const activeIndex = prev.findIndex((c) => c.id === activeId);
        const overIndex = prev.findIndex((c) => c.id === overId);
        
        if (prev[activeIndex].board_id !== prev[overIndex].board_id) {
          const newCards = [...prev];
          newCards[activeIndex] = {
            ...newCards[activeIndex],
            board_id: prev[overIndex].board_id
          };
          const result = arrayMove(newCards, activeIndex, overIndex);
          // Broadcast the movement to others
          supabase.channel('global-cards').send({
            type: 'broadcast',
            event: 'cards-reordered',
            payload: { newCards: result }
          });
          return result;
        }
        
        const result = arrayMove(prev, activeIndex, overIndex);
        // Broadcast reorder within board
        supabase.channel('global-cards').send({
          type: 'broadcast',
          event: 'cards-reordered',
          payload: { newCards: result }
        });
        return result;
      });
    }

    if (isOverABoard) {
      setCards((prev) => {
        const activeIndex = prev.findIndex((c) => c.id === activeId);
        const newCards = [...prev];
        newCards[activeIndex] = {
          ...newCards[activeIndex],
          board_id: overId as string
        };
        const result = arrayMove(newCards, activeIndex, activeIndex);
        // Broadcast the container change
        supabase.channel('global-cards').send({
          type: 'broadcast',
          event: 'cards-reordered',
          payload: { newCards: result }
        });
        return result;
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const activeCard = cards.find((c) => c.id === active.id);
    if (!activeCard) return;

    // Final Sync with database
    const cardsInSameBoard = cards
      .filter((c) => c.board_id === activeCard.board_id)
      .sort((a, b) => a.order_index - b.order_index);
    
    const updates = cardsInSameBoard.map((c, index) => ({
      id: c.id,
      board_id: c.board_id,
      order_index: index,
      content: c.content,
      author: c.author
    }));

    // Update database, tagging as drag update to avoid loop in the insert listener
    const { error } = await supabase.from('cards').upsert(updates);
    if (error) console.error('Error syncing positions:', error);
  };

  if (!userName) {
    return <UserPrompt onSetUserName={handleSetUserName} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header userName={userName} onLogout={() => {
        localStorage.removeItem('userName');
        setUserName(null);
      }} />
      <main className="flex-1 p-6 overflow-x-auto">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 h-full min-w-max md:min-w-0 md:grid md:grid-cols-3">
            {boards.map((board) => (
              <Board 
                key={board.id} 
                config={board} 
                userName={userName} 
                cards={cards.filter(c => c.board_id === board.id)}
              />
            ))}
          </div>
          <DragOverlay dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: {
                active: {
                  opacity: '0.5',
                },
              },
            }),
          }}>
            {activeCard ? <InlineRetroCard card={activeCard} /> : null}
          </DragOverlay>
        </DndContext>
      </main>
    </div>
  );
};

export default App;

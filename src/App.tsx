import React, { useState, useEffect } from 'react';
import boardsConfig from './config/boards.json';
import Board from './components/Board';
import Header from './components/Header';
import Auth from './components/Auth';
import SessionDashboard from './components/SessionDashboard';
import GuestJoin from './components/GuestJoin';
import SetNickname from './components/SetNickname';
import RetroCard from './components/RetroCard';
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
import { arrayMove } from '@dnd-kit/sortable';
import { v4 as uuidv4 } from 'uuid';
import type { Session as SupabaseSession } from '@supabase/supabase-js';
import type { CardData, Session, BoardConfig, Profile } from './types';

const App: React.FC = () => {
  const [authSession, setAuthSession] = useState<SupabaseSession | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [guestName, setGuestName] = useState<string | null>(localStorage.getItem('guestName'));
  const [guestId] = useState<string>(() => {
    const existing = localStorage.getItem('guestId');
    if (existing) return existing;
    const newId = uuidv4();
    localStorage.setItem('guestId', newId);
    return newId;
  });

  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [boards] = useState<BoardConfig[]>(boardsConfig.boards);
  const [cards, setCards] = useState<CardData[]>([]);
  const [activeCard, setActiveCard] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const currentAuthorId = authSession?.user?.id || guestId;
  const userName = userProfile?.nickname || guestName || 'Anonymous';

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (data && !error) {
      setUserProfile(data);
    } else {
      setUserProfile({ id: userId, nickname: null, updated_at: '' });
    }
  };

  useEffect(() => {
    const initApp = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setAuthSession(session);

      if (session) {
        await fetchProfile(session.user.id);
      }

      const urlParams = new URLSearchParams(window.location.search);
      const sessionIdFromUrl = urlParams.get('session');

      if (sessionIdFromUrl) {
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', sessionIdFromUrl)
          .maybeSingle();
        
        if (data && !error) {
          setCurrentSession(data);
        }
      }
      setLoading(false);
    };

    initApp();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setAuthSession(session);
      if (session) {
        await fetchProfile(session.user.id);
      } else {
        setUserProfile(null);
        if (!new URLSearchParams(window.location.search).has('session')) {
          setCurrentSession(null);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentSession) return;
    if (!authSession && !guestName) return;
    if (authSession && !userProfile?.nickname) return;

    let mounted = true;

    const loadData = async () => {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('session_id', currentSession.id)
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
      .channel(`session-${currentSession.id}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'cards',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newCard = payload.new as CardData;
            if (newCard.session_id === currentSession.id) {
              setCards((prev) => [...prev, newCard]);
            }
          } else if (payload.eventType === 'DELETE') {
            setCards((prev) => prev.filter((c) => c.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            const updatedCard = payload.new as CardData;
            if (updatedCard.session_id === currentSession.id) {
              if (!payload.new.is_drag_update) {
                setCards((prev) => 
                  prev.map((c) => (c.id === updatedCard.id ? updatedCard : c))
                );
              }
            } else {
              // If it moved to another session (unlikely in this app but good to handle)
              setCards((prev) => prev.filter((c) => c.id !== updatedCard.id));
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
  }, [authSession, currentSession, guestName, userProfile?.nickname]);

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
          supabase.channel(`session-${currentSession?.id}`).send({
            type: 'broadcast',
            event: 'cards-reordered',
            payload: { newCards: result }
          });
          return result;
        }
        
        const result = arrayMove(prev, activeIndex, overIndex);
        supabase.channel(`session-${currentSession?.id}`).send({
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
        supabase.channel(`session-${currentSession?.id}`).send({
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

    const cardsInSameBoard = cards
      .filter((c) => c.board_id === activeCard.board_id)
      .sort((a, b) => a.order_index - b.order_index);
    
    const updates = cardsInSameBoard.map((c, index) => ({
      id: c.id,
      board_id: c.board_id,
      session_id: currentSession?.id,
      order_index: index,
      content: c.content,
      author: c.author,
      author_id: c.author_id
    }));

    const { error } = await supabase.from('cards').upsert(updates);
    if (error) console.error('Error syncing positions:', error);
  };

  const handleLogout = async () => {
    if (authSession) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem('guestName');
      localStorage.removeItem('guestId');
      setGuestName(null);
      // If they were on a shared session, clear it to return to Auth screen
      if (!authSession) {
        const url = new URL(window.location.href);
        url.searchParams.delete('session');
        window.history.pushState({}, '', url.toString());
        setCurrentSession(null);
      }
    }
  };

  const handleJoinAsGuest = (name: string) => {
    localStorage.setItem('guestName', name);
    setGuestName(name);
  };

  const handleBackToDashboard = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('session');
    window.history.pushState({}, '', url.toString());
    setCurrentSession(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (authSession && !userProfile?.nickname) {
    return (
      <SetNickname 
        userId={authSession.user.id} 
        onComplete={(name) => setUserProfile({ ...userProfile!, nickname: name })} 
      />
    );
  }

  if (currentSession && !authSession && !guestName) {
    return <GuestJoin sessionTitle={currentSession.title} onJoin={handleJoinAsGuest} />;
  }

  if (!authSession && !currentSession) {
    return <Auth />;
  }

  if (authSession && !currentSession) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <Header userName={userName} onLogout={handleLogout} />
        <main className="flex-1 flex overflow-hidden">
          <SessionDashboard onSelectSession={(s) => {
            const url = new URL(window.location.href);
            url.searchParams.set('session', s.id);
            window.history.pushState({}, '', url.toString());
            setCurrentSession(s);
          }} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header 
        userName={userName} 
        sessionTitle={currentSession?.title} 
        onBack={authSession ? handleBackToDashboard : undefined}
        onLogout={handleLogout}
        sessionId={currentSession?.id}
      />
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
                authorId={currentAuthorId}
                sessionId={currentSession!.id}
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
            {activeCard ? <RetroCard card={activeCard} currentUserId={currentAuthorId} /> : null}
          </DragOverlay>
        </DndContext>
      </main>
    </div>
  );
};

export default App;

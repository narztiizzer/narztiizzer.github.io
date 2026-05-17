export interface BoardConfig {
  id: string;
  title: string;
  color: string;
  headerColor: string;
}

export interface CardData {
  id: string;
  board_id: string;
  session_id: string;
  content: string;
  author: string;
  author_id: string;
  created_at: string;
  order_index: number;
}

export interface Session {
  id: string;
  title: string;
  created_at: string;
  created_by: string;
}

export interface Profile {
  id: string;
  nickname: string | null;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
}

export interface BoardConfig {
  id: string;
  title: string;
  color: string;
  headerColor: string;
}

export interface CardData {
  id: string;
  boardId: string;
  content: string;
  author: string;
  createdAt: string;
}

export interface User {
  name: string;
}

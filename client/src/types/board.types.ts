import { Task } from './task.types';

export interface Column {
  _id: string;
  board: string;
  project: string;
  name: string;
  color: string;
  position: number;
  tasks: Task[];
  taskLimit?: number;
  isDefault: boolean;
}

export interface Board {
  _id: string;
  project: string;
  name: string;
  backgroundColor?: string;
  columns: Column[];
  isDefault: boolean;
}

export interface BoardState {
  board: Board | null;
  columns: Column[];
  isLoading: boolean;
}

export interface DragResult {
  draggableId: string;
  type: string;
  source: {
    droppableId: string;
    index: number;
  };
  destination: {
    droppableId: string;
    index: number;
  } | null;
}

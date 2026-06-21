'use client';

import React, { useState, useCallback } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MoreHorizontal, Filter, SlidersHorizontal } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { KanbanColumn } from './KanbanColumn';
import { Button } from '@/components/ui/button';
import { BoardSkeleton } from '@/components/ui/skeleton';
import { apiGet, apiPatch } from '@/lib/api';
import { Board, Column } from '@/types/board.types';
import { Task } from '@/types/task.types';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface KanbanBoardProps {
  projectId: string;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ projectId }) => {
  const queryClient = useQueryClient();
  const [isDragging, setIsDragging] = useState(false);

  // Fetch board data
  const { data: boardData, isLoading } = useQuery({
    queryKey: ['board', projectId],
    queryFn: async () => {
      const res = await apiGet<{ board: Board; columns: Column[] }>(`/projects/${projectId}/board`);
      return res.data.data;
    },
  });

  // Move task mutation
  const moveTaskMutation = useMutation({
    mutationFn: async ({
      taskId,
      sourceColumnId,
      destinationColumnId,
      sourceIndex,
      destinationIndex,
    }: {
      taskId: string;
      sourceColumnId: string;
      destinationColumnId: string;
      sourceIndex: number;
      destinationIndex: number;
    }) => {
      await apiPatch(`/tasks/${taskId}/move`, {
        sourceColumnId,
        destinationColumnId,
        sourceIndex,
        destinationIndex,
      });
    },
    onError: () => {
      toast.error('Failed to move task');
      queryClient.invalidateQueries({ queryKey: ['board', projectId] });
    },
  });

  const onDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const onDragEnd = useCallback(
    (result: DropResult) => {
      setIsDragging(false);

      if (!result.destination || !boardData) return;

      const { source, destination, draggableId } = result;

      // Same position — no-op
      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      ) return;

      // Optimistic update
      queryClient.setQueryData(['board', projectId], (old: typeof boardData) => {
        if (!old) return old;

        const newColumns = old.columns.map((col) => ({ ...col, tasks: [...col.tasks] }));
        const sourceCol = newColumns.find((c) => c._id === source.droppableId);
        const destCol = newColumns.find((c) => c._id === destination.droppableId);

        if (!sourceCol || !destCol) return old;

        const [movedTask] = sourceCol.tasks.splice(source.index, 1);
        destCol.tasks.splice(destination.index, 0, movedTask);

        return { ...old, columns: newColumns };
      });

      moveTaskMutation.mutate({
        taskId: draggableId,
        sourceColumnId: source.droppableId,
        destinationColumnId: destination.droppableId,
        sourceIndex: source.index,
        destinationIndex: destination.index,
      });
    },
    [boardData, queryClient, projectId, moveTaskMutation]
  );

  if (isLoading) return <BoardSkeleton />;

  if (!boardData) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground">
      Board not found
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Board Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-foreground">{boardData.board?.name || 'Main Board'}</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {boardData.columns.reduce((acc, col) => acc + col.tasks.length, 0)} tasks
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" leftIcon={<Filter className="h-3.5 w-3.5" />}>
            Filter
          </Button>
          <Button variant="ghost" size="sm" leftIcon={<SlidersHorizontal className="h-3.5 w-3.5" />}>
            Group by
          </Button>
        </div>
      </div>

      {/* Board */}
      <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 p-6 min-h-full h-max">
            {boardData.columns.map((column) => (
              <KanbanColumn
                key={column._id}
                column={column}
                projectId={projectId}
                isDraggingOver={isDragging}
              />
            ))}

            {/* Add Column */}
            <div className="w-72 flex-shrink-0">
              <Button
                variant="ghost"
                className="w-full h-10 border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary"
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Add Column
              </Button>
            </div>
          </div>
        </div>
      </DragDropContext>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MoreHorizontal } from 'lucide-react';
import { Column } from '@/types/board.types';
import { TaskCard } from './TaskCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui.store';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { apiPost } from '@/lib/api';
import toast from 'react-hot-toast';
interface KanbanColumnProps {
  column: Column;
  projectId: string;
  isDraggingOver?: boolean;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ column, projectId, isDraggingOver }) => {
  const { openCreateTaskModal, setActiveProjectId } = useUIStore();
  const queryClient = useQueryClient();
  const [isCreatingInline, setIsCreatingInline] = useState(false);
  const [inlineTaskTitle, setInlineTaskTitle] = useState('');
  
  const taskCount = column.tasks.length;

  const handleAddTask = () => {
    setActiveProjectId(projectId);
    openCreateTaskModal();
  };

  const createTaskMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await apiPost(`/projects/${projectId}/tasks`, {
        title,
        project: projectId,
        columnId: column._id,
        priority: 'medium',
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', projectId] });
      setInlineTaskTitle('');
      setIsCreatingInline(false);
    },
    onError: () => {
      toast.error('Failed to create task');
    }
  });

  const handleInlineKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inlineTaskTitle.trim()) {
      createTaskMutation.mutate(inlineTaskTitle.trim());
    } else if (e.key === 'Escape') {
      setIsCreatingInline(false);
      setInlineTaskTitle('');
    }
  };

  return (
    <div className="w-72 flex-shrink-0 flex flex-col max-h-full">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div
            className="h-2.5 w-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: column.color }}
          />
          <h3 className="text-sm font-semibold text-foreground">{column.name}</h3>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full font-medium">
            {taskCount}
          </span>
          {column.taskLimit && taskCount >= column.taskLimit && (
            <span className="text-xs text-red-500 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded-full">
              Full
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={handleAddTask} className="h-6 w-6 text-muted-foreground hover:text-primary">
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" className="h-6 w-6 text-muted-foreground">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={column._id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'flex-1 rounded-xl p-2 space-y-2 overflow-y-auto min-h-[120px] transition-colors duration-200',
              snapshot.isDraggingOver
                ? 'bg-primary/5 border-2 border-dashed border-primary/30'
                : 'bg-muted/30'
            )}
          >
            <AnimatePresence>
              {column.tasks.map((task, index) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  index={index}
                  columnId={column._id}
                />
              ))}
            </AnimatePresence>
            {provided.placeholder}

            {column.tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mb-2">
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">No tasks yet</p>
                <button
                  onClick={handleAddTask}
                  className="text-xs text-primary hover:underline mt-1"
                >
                  Add a task
                </button>
              </div>
            )}
          </div>
        )}
      </Droppable>

      {/* Add Task Button or Inline Input */}
      {isCreatingInline ? (
        <div className="mt-2 bg-card rounded-lg p-2 border border-primary shadow-sm ring-2 ring-primary/20">
          <input
            autoFocus
            type="text"
            value={inlineTaskTitle}
            onChange={(e) => setInlineTaskTitle(e.target.value)}
            onKeyDown={handleInlineKeyDown}
            onBlur={() => setIsCreatingInline(false)}
            placeholder="Task title..."
            className="w-full bg-transparent border-none focus:outline-none text-sm placeholder:text-muted-foreground"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-muted-foreground">Press Enter to save</span>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsCreatingInline(true)}
          className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add task
        </button>
      )}
    </div>
  );
};

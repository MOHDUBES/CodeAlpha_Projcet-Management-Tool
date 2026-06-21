'use client';

import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { motion } from 'framer-motion';
import { MessageSquare, Paperclip, Calendar, CheckSquare2, Clock } from 'lucide-react';
import { Task } from '@/types/task.types';
import { AvatarGroup } from '@/components/ui/avatar';
import { useUIStore } from '@/store/ui.store';
import { cn, formatDate, isOverdue, isDueSoon, getTaskPriorityConfig } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  index: number;
  columnId: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, index, columnId }) => {
  const { openTaskModal } = useUIStore();
  const priorityConfig = getTaskPriorityConfig(task.priority);
  const overdue = isOverdue(task.dueDate);
  const dueSoon = isDueSoon(task.dueDate);
  const checklistDone = task.checklist.filter((c) => c.isCompleted).length;
  const checklistTotal = task.checklist.length;

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={provided.draggableProps.style as React.CSSProperties}
        >
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'task-card bg-card border border-border rounded-xl p-3 space-y-2.5 cursor-grab active:cursor-grabbing',
              snapshot.isDragging && 'shadow-2xl border-primary/30 rotate-2 scale-[1.03] opacity-95 cursor-grabbing z-50',
              task.status === 'done' && 'opacity-60'
            )}
            onClick={() => openTaskModal(task._id)}
          >
            {/* Priority + Labels */}
            <div className="flex items-center justify-between gap-2">
              <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', priorityConfig.className)}>
                {priorityConfig.label}
              </span>
              <div className="flex items-center gap-1 flex-wrap justify-end">
                {task.labels.slice(0, 2).map((label) => (
                  <span
                    key={label}
                    className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Title */}
            <p className={cn(
              'text-sm font-medium text-foreground line-clamp-2 leading-snug',
              task.status === 'done' && 'line-through text-muted-foreground'
            )}>
              {task.title}
            </p>

            {/* Checklist Progress */}
            {checklistTotal > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckSquare2 className="h-3 w-3" />
                    {checklistDone}/{checklistTotal}
                  </span>
                  <span>{Math.round((checklistDone / checklistTotal) * 100)}%</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${(checklistDone / checklistTotal) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between gap-2">
              {/* Due Date */}
              {task.dueDate && (
                <span className={cn(
                  'flex items-center gap-1 text-[10px] font-medium rounded-full px-1.5 py-0.5',
                  overdue
                    ? 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
                    : dueSoon
                    ? 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30'
                    : 'text-muted-foreground'
                )}>
                  <Calendar className="h-3 w-3" />
                  {formatDate(task.dueDate, 'MMM d')}
                </span>
              )}

              <div className="flex items-center gap-2 ml-auto">
                {/* Comment count */}
                {task.commentCount > 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <MessageSquare className="h-3 w-3" />
                    {task.commentCount}
                  </span>
                )}
                {/* Attachment count */}
                {task.attachments?.length > 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Paperclip className="h-3 w-3" />
                    {task.attachments.length}
                  </span>
                )}
                {/* Assignees */}
                {task.assignees?.length > 0 && (
                  <AvatarGroup users={task.assignees} max={3} size="xs" />
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </Draggable>
  );
};

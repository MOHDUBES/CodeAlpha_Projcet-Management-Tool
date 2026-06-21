'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { useUIStore } from '@/store/ui.store';
import { apiGet, apiPatch } from '@/lib/api';
import { Task } from '@/types/task.types';
import { UserAvatar, AvatarGroup } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate, getTaskPriorityConfig, isOverdue } from '@/lib/utils';
import TextareaAutosize from 'react-textarea-autosize';
import { Calendar, AlignLeft, CheckSquare2, Clock, MessageSquare, Paperclip, MoreHorizontal, X, UserPlus, Tag, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export const TaskDetailModal = () => {
  const queryClient = useQueryClient();
  const { taskModalId, closeTaskModal } = useUIStore();
  const [isEditingDesc, setIsEditingDesc] = React.useState(false);
  const [descInput, setDescInput] = React.useState('');
  const [titleInput, setTitleInput] = React.useState('');

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskModalId],
    queryFn: async () => {
      const res = await apiGet<Task>(`/tasks/${taskModalId}`);
      setTitleInput(res.data.data.title);
      return res.data.data;
    },
    enabled: !!taskModalId,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Task>) => {
      const res = await apiPatch(`/tasks/${taskModalId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskModalId] });
      queryClient.invalidateQueries({ queryKey: ['board'] });
      setIsEditingDesc(false);
      toast.success('Task updated');
    },
    onError: () => toast.error('Failed to update task'),
  });

  const handleDescSave = () => {
    if (descInput !== task?.description) {
      updateMutation.mutate({ description: descInput });
    } else {
      setIsEditingDesc(false);
    }
  };

  const handleTitleSave = () => {
    if (titleInput.trim() && titleInput !== task?.title) {
      updateMutation.mutate({ title: titleInput.trim() });
    } else if (!titleInput.trim() && task?.title) {
      setTitleInput(task.title);
    }
  };

  if (!taskModalId) return null;

  return (
    <Dialog open={!!taskModalId} onOpenChange={(open) => !open && closeTaskModal()}>
      <DialogContent size="lg" className="h-[85vh] flex flex-col p-0 overflow-hidden" showClose={false}>
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : !task ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Task not found
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="font-medium">{task.project.name}</span>
                <span>/</span>
                <span>{task.column.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon-sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
                <DialogClose asChild>
                  <Button variant="ghost" size="icon-sm" onClick={closeTaskModal}>
                    <X className="h-4 w-4" />
                  </Button>
                </DialogClose>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
              {/* Main Content */}
              <div className="flex-1 p-6 space-y-8 border-r border-border min-h-0 overflow-y-auto">
                {/* Title Section */}
                <div className="space-y-4">
                  <TextareaAutosize
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    onBlur={handleTitleSave}
                    className="w-full resize-none appearance-none bg-transparent text-2xl font-semibold leading-tight text-foreground focus:outline-none placeholder:text-muted-foreground/50 border-none px-0 rounded-none shadow-none focus-visible:ring-0"
                    placeholder="Task title"
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={cn('text-xs font-semibold px-2.5 py-0.5 rounded-full cursor-pointer hover:opacity-80 transition-opacity', getTaskPriorityConfig(task.priority).className)}>
                      {getTaskPriorityConfig(task.priority).label}
                    </span>
                    {task.labels.map(label => (
                      <Badge key={label} variant="secondary" className="text-[10px] cursor-pointer hover:bg-secondary/80">{label}</Badge>
                    ))}
                    <Button variant="ghost" size="icon-sm" className="h-6 w-6 rounded-full border border-dashed border-border"><Plus className="h-3 w-3" /></Button>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-medium">
                    <AlignLeft className="h-4 w-4 text-muted-foreground" />
                    <h3>Description</h3>
                  </div>
                  {isEditingDesc ? (
                    <div className="space-y-3">
                      <Textarea
                        value={descInput}
                        onChange={(e) => setDescInput(e.target.value)}
                        autoFocus
                        rows={6}
                        placeholder="Add a more detailed description..."
                        className="bg-muted/50"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleDescSave} isLoading={updateMutation.isPending}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setIsEditingDesc(false)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="text-sm text-muted-foreground hover:bg-muted/30 p-3 rounded-lg cursor-pointer min-h-[100px] border border-transparent hover:border-border transition-colors whitespace-pre-wrap"
                      onClick={() => {
                        setDescInput(task.description || '');
                        setIsEditingDesc(true);
                      }}
                    >
                      {task.description || 'Add a more detailed description...'}
                    </div>
                  )}
                </div>

                {/* Checklist (Placeholder logic) */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-medium">
                    <CheckSquare2 className="h-4 w-4 text-muted-foreground" />
                    <h3>Checklist</h3>
                  </div>
                  <div className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">
                    Checklist implementation goes here
                  </div>
                </div>

                {/* Comments (Placeholder) */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-medium">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <h3>Activity</h3>
                  </div>
                  <div className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">
                    Activity and comments feed goes here
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="w-full md:w-64 flex-shrink-0 bg-muted/10 p-6 space-y-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</h4>
                  <div className="bg-secondary text-secondary-foreground text-sm font-medium px-3 py-1.5 rounded-md inline-block">
                    {task.column.name}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assignees</h4>
                  <div className="flex items-center gap-3">
                    {task.assignees.length > 0 ? (
                      <AvatarGroup users={task.assignees} size="md" />
                    ) : (
                      <span className="text-sm text-muted-foreground">Unassigned</span>
                    )}
                    <Button variant="ghost" size="icon-sm" className="rounded-full bg-muted">
                      <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dates</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between group cursor-pointer">
                      <span className="text-muted-foreground">Start</span>
                      <span className="font-medium group-hover:bg-muted px-2 py-0.5 rounded transition-colors">
                        {task.startDate ? formatDate(task.startDate) : 'None'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between group cursor-pointer">
                      <span className="text-muted-foreground">Due</span>
                      <span className={cn('font-medium group-hover:bg-muted px-2 py-0.5 rounded transition-colors', isOverdue(task.dueDate) && 'text-red-500')}>
                        {task.dueDate ? formatDate(task.dueDate) : 'None'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</h4>
                  <div className="space-y-2 flex flex-col">
                    <Button variant="outline" size="sm" className="justify-start text-muted-foreground" leftIcon={<UserPlus className="h-4 w-4" />}>Join</Button>
                    <Button variant="outline" size="sm" className="justify-start text-muted-foreground" leftIcon={<Paperclip className="h-4 w-4" />}>Attachment</Button>
                    <Button variant="outline" size="sm" className="justify-start text-muted-foreground" leftIcon={<Tag className="h-4 w-4" />}>Labels</Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

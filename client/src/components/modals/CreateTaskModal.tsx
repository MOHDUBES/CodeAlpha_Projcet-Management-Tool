'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { useUIStore } from '@/store/ui.store';
import { apiGet, apiPost } from '@/lib/api';
import { Board } from '@/types/board.types';
import toast from 'react-hot-toast';

export const CreateTaskModal = () => {
  const queryClient = useQueryClient();
  const { createTaskModalOpen, closeCreateTaskModal, activeProjectId } = useUIStore();
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [columnId, setColumnId] = React.useState('');
  const [priority, setPriority] = React.useState('medium');

  // Fetch columns for the active project
  const { data: boardData } = useQuery({
    queryKey: ['board', activeProjectId],
    queryFn: async () => {
      const res = await apiGet<{ board: Board; columns: any[] }>(`/projects/${activeProjectId}/board`);
      return res.data.data;
    },
    enabled: !!activeProjectId && createTaskModalOpen,
  });

  React.useEffect(() => {
    if (boardData?.columns.length && !columnId) {
      setColumnId(boardData.columns[0]._id);
    }
  }, [boardData, columnId]);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiPost(`/projects/${activeProjectId}/tasks`, {
        title,
        description,
        columnId,
        priority,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', activeProjectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task created');
      closeCreateTaskModal();
      setTitle('');
      setDescription('');
      setPriority('medium');
    },
    onError: () => toast.error('Failed to create task'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <Dialog open={createTaskModalOpen} onOpenChange={(open) => !open && closeCreateTaskModal()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="p-6 pt-0 space-y-4">
          <Input
            label="Task Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Status</label>
              <select
                value={columnId}
                onChange={(e) => setColumnId(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-transparent px-3 text-sm focus:ring-1 focus:ring-ring focus:outline-none"
              >
                {boardData?.columns.map(c => (
                  <option key={c._id} value={c._id} className="bg-popover">{c.name}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-transparent px-3 text-sm focus:ring-1 focus:ring-ring focus:outline-none"
              >
                <option value="low" className="bg-popover">Low</option>
                <option value="medium" className="bg-popover">Medium</option>
                <option value="high" className="bg-popover">High</option>
                <option value="urgent" className="bg-popover">Urgent</option>
              </select>
            </div>
          </div>

          <DialogFooter className="px-0 pb-0 border-t-0 mt-6">
            <Button type="button" variant="ghost" onClick={closeCreateTaskModal}>Cancel</Button>
            <Button type="submit" isLoading={mutation.isPending}>Create Task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

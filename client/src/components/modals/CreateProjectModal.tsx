'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { useUIStore } from '@/store/ui.store';
import { apiPost } from '@/lib/api';
import toast from 'react-hot-toast';

export const CreateProjectModal = () => {
  const queryClient = useQueryClient();
  const { createProjectModalOpen, closeCreateProjectModal } = useUIStore();
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiPost('/projects', { name, description });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Project created');
      closeCreateProjectModal();
      setName('');
      setDescription('');
    },
    onError: () => toast.error('Failed to create project'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <Dialog open={createProjectModalOpen} onOpenChange={(open) => !open && closeCreateProjectModal()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="p-6 pt-0 space-y-4">
          <Input
            label="Project Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <DialogFooter className="px-0 pb-0 border-t-0 mt-6">
            <Button type="button" variant="ghost" onClick={closeCreateProjectModal}>Cancel</Button>
            <Button type="submit" isLoading={mutation.isPending}>Create Project</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

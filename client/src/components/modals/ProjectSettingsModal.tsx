'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { useUIStore } from '@/store/ui.store';
import { apiGet, apiPatch } from '@/lib/api';
import { Project } from '@/types/project.types';
import toast from 'react-hot-toast';
import { PROJECT_COLORS } from '@/lib/constants';

export const ProjectSettingsModal = () => {
  const queryClient = useQueryClient();
  const { projectSettingsModalOpen, closeProjectSettingsModal, activeProjectId } = useUIStore();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PROJECT_COLORS[0]);

  const { data: project } = useQuery({
    queryKey: ['project', activeProjectId],
    queryFn: async () => {
      const res = await apiGet<Project>(`/projects/${activeProjectId}`);
      return res.data.data;
    },
    enabled: !!activeProjectId && projectSettingsModalOpen,
  });

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || '');
      setColor(project.color);
    }
  }, [project]);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiPatch(`/projects/${activeProjectId}`, {
        name,
        description,
        color,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', activeProjectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Project settings updated');
      closeProjectSettingsModal();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to update project'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    mutation.mutate();
  };

  return (
    <Dialog open={projectSettingsModalOpen} onOpenChange={(open) => !open && closeProjectSettingsModal()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Project Settings</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 pt-0 space-y-4">
          <Input
            label="Project Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Project Color</label>
            <div className="flex flex-wrap gap-2 pt-1">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-ring ring-offset-2 ring-offset-background' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <DialogFooter className="px-0 pb-0 border-t-0 mt-6">
            <Button type="button" variant="ghost" onClick={closeProjectSettingsModal}>Cancel</Button>
            <Button type="submit" isLoading={mutation.isPending}>Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

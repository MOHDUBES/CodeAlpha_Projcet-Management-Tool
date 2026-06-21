'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { KanbanBoard } from '@/components/board/KanbanBoard';
import { apiGet, apiDelete } from '@/lib/api';
import { Project } from '@/types/project.types';
import { Loader2, Settings, Users, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants';
import { useUIStore } from '@/store/ui.store';
import toast from 'react-hot-toast';

export default function ProjectBoardPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiDelete(`/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Project deleted successfully');
      router.push(ROUTES.DASHBOARD);
    },
    onError: () => toast.error('Failed to delete project'),
  });

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const res = await apiGet<Project>(`/projects/${id}`);
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (!project) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center flex-col gap-4">
          <h2 className="text-xl font-semibold">Project not found</h2>
          <Button onClick={() => router.push(ROUTES.DASHBOARD)}>Back to Dashboard</Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Project Header */}
        <div className="h-16 border-b border-border bg-card/50 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${project.color}20`, color: project.color }}
            >
              <span className="font-bold text-sm">{project.name.charAt(0)}</span>
            </div>
            <h1 className="text-lg font-semibold tracking-tight">{project.name}</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-secondary-foreground uppercase tracking-wider">
              {project.visibility}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex -space-x-2 mr-4">
              {project.members.slice(0, 4).map(m => (
                <div key={m.user._id} className="h-8 w-8 rounded-full bg-muted ring-2 ring-background overflow-hidden flex items-center justify-center">
                   {m.user.avatar ? (
                     <img src={m.user.avatar} alt="" className="h-full w-full object-cover" />
                   ) : (
                     <span className="text-[10px] font-semibold">{m.user.name.charAt(0)}</span>
                   )}
                </div>
              ))}
              {project.members.length > 4 && (
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center ring-2 ring-background z-10 text-[10px] font-medium">
                  +{project.members.length - 4}
                </div>
              )}
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              leftIcon={<Users className="h-4 w-4" />}
              onClick={() => {
                useUIStore.getState().setActiveProjectId(id);
                useUIStore.getState().openShareModal();
              }}
            >
              Share
            </Button>
            <Button 
              variant="ghost" 
              size="icon-sm"
              onClick={() => {
                useUIStore.getState().setActiveProjectId(id);
                useUIStore.getState().openProjectSettingsModal();
              }}
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon-sm" 
              className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this project? This cannot be undone.')) {
                  deleteMutation.mutate();
                }
              }}
              isLoading={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Board Area */}
        <div className="flex-1 overflow-hidden bg-background">
          <KanbanBoard projectId={id} />
        </div>
      </div>
    </AppShell>
  );
}

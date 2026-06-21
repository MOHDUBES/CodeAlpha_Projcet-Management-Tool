'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { apiGet } from '@/lib/api';
import { Project } from '@/types/project.types';
import { Plus, Search, FolderKanban, Star, MoreVertical, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ROUTES } from '@/lib/constants';
import { useUIStore } from '@/store/ui.store';
import { formatDate } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/avatar';

export default function ProjectsPage() {
  const router = useRouter();
  const { openCreateProjectModal } = useUIStore();
  const [view, setView] = React.useState<'grid' | 'list'>('grid');
  const [search, setSearch] = React.useState('');

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await apiGet<Project[]>('/projects');
      return res.data.data;
    },
  });

  const filteredProjects = projects?.filter(p => p.name.toLowerCase().includes(search.toLowerCase())) || [];

  return (
    <AppShell>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground mt-1">Manage and track all your team's projects.</p>
          </div>
          <Button onClick={openCreateProjectModal} leftIcon={<Plus className="h-4 w-4" />} variant="glow">
            New Project
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-2 rounded-xl border border-border">
          <div className="w-full sm:w-72">
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
              className="bg-transparent border-none shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
            <Button
              variant={view === 'grid' ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => setView('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => setView('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className={view === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {filteredProjects.map((project) => (
              <div
                key={project._id}
                onClick={() => router.push(ROUTES.BOARD(project._id))}
                className={view === 'grid' 
                  ? "glass-card p-5 cursor-pointer hover:border-primary/50 transition-all hover:-translate-y-1 hover:shadow-xl group"
                  : "glass-card p-4 cursor-pointer hover:bg-muted/30 transition-all flex items-center justify-between group"
                }
              >
                {view === 'grid' ? (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <div
                        className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${project.color}20`, color: project.color }}
                      >
                        {project.logo ? (
                          <img src={project.logo} alt="" className="h-full w-full rounded-xl object-cover" />
                        ) : (
                          <FolderKanban className="h-6 w-6" />
                        )}
                      </div>
                      <button className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </div>
                    <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">{project.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1 mb-4 h-10">
                      {project.description || "No description provided."}
                    </p>
                    <div className="flex items-center justify-between border-t border-border pt-4 mt-auto">
                      <div className="flex -space-x-2">
                        {project.members.slice(0, 3).map(m => (
                          <UserAvatar key={m.user._id} user={m.user} size="sm" className="ring-2 ring-card" />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDate(project.updatedAt)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-4">
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${project.color}20`, color: project.color }}
                      >
                         <FolderKanban className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{project.name}</h3>
                        <p className="text-xs text-muted-foreground">{project.members.length} members • Updated {formatDate(project.updatedAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-secondary text-secondary-foreground uppercase tracking-wider">
                        {project.status}
                      </span>
                      <button className="text-muted-foreground hover:text-foreground">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {filteredProjects.length === 0 && (
              <div className="col-span-full py-20 text-center flex flex-col items-center justify-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FolderKanban className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">No projects found</h3>
                <p className="text-muted-foreground mb-6">Get started by creating a new project.</p>
                <Button onClick={openCreateProjectModal} variant="outline">Create Project</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

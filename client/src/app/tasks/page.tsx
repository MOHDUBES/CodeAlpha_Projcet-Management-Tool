'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/AppShell';
import { apiGet } from '@/lib/api';
import { Task } from '@/types/task.types';
import { Loader2, Calendar, Clock, CheckCircle2, Circle } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants';

export default function TasksPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming'>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: async () => {
      const res = await apiGet<Task[]>('/tasks/me?limit=100');
      return res.data.data || [];
    },
  });

  const getFilteredTasks = () => {
    if (!data) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return data.filter(task => {
      if (filter === 'all') return true;
      if (!task.dueDate) return false;
      
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      if (filter === 'today') {
        return dueDate.getTime() === today.getTime();
      }
      if (filter === 'upcoming') {
        return dueDate.getTime() > today.getTime();
      }
      return true;
    });
  };

  const tasks = getFilteredTasks();

  return (
    <AppShell>
      <div className="flex-1 p-6 md:p-8 max-w-5xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
            <p className="text-muted-foreground mt-1">Manage all your assigned tasks across projects.</p>
          </div>
          
          <div className="flex bg-muted p-1 rounded-lg w-fit">
            <button 
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'all' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'today' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setFilter('today')}
            >
              Today
            </button>
            <button 
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'upcoming' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setFilter('upcoming')}
            >
              Upcoming
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed border-border rounded-xl">
            <CheckCircle2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">No tasks found</h3>
            <p className="text-muted-foreground max-w-sm mt-1">You're all caught up! Enjoy your free time or check other projects.</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="divide-y divide-border">
              {tasks.map(task => (
                <div 
                  key={task._id} 
                  className="p-4 flex items-start gap-4 hover:bg-accent/30 transition-colors cursor-pointer group"
                  onClick={() => router.push(ROUTES.PROJECT(task.project._id))}
                >
                  <div className="mt-1 flex-shrink-0">
                    {task.status === 'done' || task.status === 'completed' as any ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium text-base truncate ${task.status === 'done' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                      {task.title}
                    </h4>
                    
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5 bg-secondary/50 px-2 py-0.5 rounded-md">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: task.project?.color || '#ccc' }} />
                        <span className="truncate max-w-[120px]">{task.project?.name || 'Unknown Project'}</span>
                      </div>
                      
                      {task.dueDate && (
                        <div className={`flex items-center gap-1 ${new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'text-red-500' : ''}`}>
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{format(new Date(task.dueDate), 'MMM d')}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1">
                        <span className={`px-1.5 py-0.5 rounded uppercase tracking-wider text-[10px] font-semibold
                          ${task.priority === 'urgent' ? 'bg-red-500/10 text-red-500' : 
                            task.priority === 'high' ? 'bg-orange-500/10 text-orange-500' : 
                            task.priority === 'medium' ? 'bg-blue-500/10 text-blue-500' : 
                            'bg-muted text-muted-foreground'}`
                        }>
                          {task.priority}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <span className="bg-muted px-1.5 py-0.5 rounded capitalize text-[10px] font-medium">
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

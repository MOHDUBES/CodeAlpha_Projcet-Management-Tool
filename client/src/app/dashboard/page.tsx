'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardSkeleton } from '@/components/ui/skeleton';
import { apiGet } from '@/lib/api';
import { Project } from '@/types/project.types';
import { Task } from '@/types/task.types';
import { useAuthStore } from '@/store/auth.store';
import { CheckSquare, Clock, FolderKanban, TrendingUp } from 'lucide-react';
import { UserAvatar } from '@/components/ui/avatar';
import { cn, formatDate, isOverdue } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      // Aggregate data from multiple endpoints for the dashboard
      const [projectsRes, tasksRes] = await Promise.all([
        apiGet<Project[]>('/projects?limit=5'),
        apiGet<{ tasks: Task[]; total: number }>('/tasks/me?status=todo,in_progress,review&limit=5'),
      ]);
      return {
        projects: projectsRes.data.data,
        tasks: tasksRes.data.data.tasks,
        totalTasks: tasksRes.data.data.total,
      };
    },
  });

  if (isLoading) return <AppShell><DashboardSkeleton /></AppShell>;

  const activeProjects = dashboardData?.projects.filter(p => p.status === 'active') || [];
  const myTasks = dashboardData?.tasks || [];

  return (
    <AppShell>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Good morning, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening across your projects today.</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active Projects"
            value={activeProjects.length}
            icon={<FolderKanban className="h-5 w-5 text-indigo-500" />}
            trend="+2 this month"
          />
          <StatCard
            title="My Tasks"
            value={dashboardData?.totalTasks || 0}
            icon={<CheckSquare className="h-5 w-5 text-emerald-500" />}
            trend="12 completed"
          />
          <StatCard
            title="Overdue"
            value={myTasks.filter(t => isOverdue(t.dueDate)).length}
            icon={<Clock className="h-5 w-5 text-red-500" />}
            trend="Needs attention"
            trendColor="text-red-500"
          />
          <StatCard
            title="Productivity"
            value="85%"
            icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
            trend="+5% from last week"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Projects */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Recent Projects</h2>
              <button onClick={() => router.push(ROUTES.PROJECTS)} className="text-sm text-primary hover:underline">View all</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeProjects.map((project) => (
                <div
                  key={project._id}
                  onClick={() => router.push(ROUTES.PROJECT(project._id))}
                  className="glass-card p-5 cursor-pointer hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${project.color}20`, color: project.color }}
                    >
                      {project.logo ? (
                        <img src={project.logo} alt="" className="h-full w-full rounded-lg object-cover" />
                      ) : (
                        <span className="font-bold text-lg">{project.name.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{project.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">{project.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 text-xs">
                    <div className="flex -space-x-2">
                      {project.members.slice(0, 3).map((m, i) => (
                        <UserAvatar key={m.user._id} user={m.user} size="sm" className="ring-2 ring-card" />
                      ))}
                      {project.members.length > 3 && (
                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center ring-2 ring-card z-10">
                          +{project.members.length - 3}
                        </div>
                      )}
                    </div>
                    <span className="text-muted-foreground">Updated {formatDate(project.updatedAt)}</span>
                  </div>
                </div>
              ))}
              {activeProjects.length === 0 && (
                <div className="col-span-full py-12 text-center border border-dashed rounded-xl border-border text-muted-foreground">
                  No active projects. Create one to get started!
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Tasks */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">My Tasks</h2>
            <div className="glass-card overflow-hidden">
              <div className="flex flex-col divide-y divide-border/50">
                {myTasks.map((task) => (
                  <div
                    key={task._id}
                    className="p-4 hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "mt-0.5 h-4 w-4 rounded-sm border flex-shrink-0",
                        task.priority === 'urgent' ? 'border-red-500 bg-red-500/10' :
                        task.priority === 'high' ? 'border-orange-500 bg-orange-500/10' :
                        'border-muted-foreground'
                      )} />
                      <div>
                        <p className="text-sm font-medium text-foreground line-clamp-2 leading-tight mb-1">{task.title}</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="font-medium">{task.project.name}</span>
                          {task.dueDate && (
                            <>
                              <span>•</span>
                              <span className={isOverdue(task.dueDate) ? 'text-red-500' : ''}>
                                Due {formatDate(task.dueDate, 'MMM d')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {myTasks.length === 0 && (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    You're all caught up!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({ title, value, icon, trend, trendColor = "text-muted-foreground" }: any) {
  return (
    <div className="glass-card p-5">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
        </div>
        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center text-xs">
        <span className={trendColor}>{trend}</span>
      </div>
    </div>
  );
}

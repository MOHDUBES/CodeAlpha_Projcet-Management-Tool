'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/AppShell';
import { apiGet } from '@/lib/api';
import { Task } from '@/types/task.types';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants';

export default function CalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: async () => {
      const res = await apiGet<Task[]>('/tasks/me?limit=500');
      return res.data.data || [];
    },
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  // Get days to display in the calendar grid (including padding from prev/next months)
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday
  
  const endDate = new Date(monthEnd);
  if (endDate.getDay() !== 6) {
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // End on Saturday
  }

  const dateInterval = eachDayOfInterval({ start: startDate, end: endDate });

  const getTasksForDate = (date: Date) => {
    if (!tasks) return [];
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      return isSameDay(new Date(task.dueDate), date);
    });
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <AppShell>
      <div className="flex flex-col h-full overflow-hidden">
        <div className="p-6 border-b border-border bg-card/50 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
            <p className="text-muted-foreground text-sm mt-1">Track your task deadlines.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={goToToday}
              className="px-3 py-1.5 text-sm font-medium border border-border rounded-md hover:bg-accent transition-colors"
            >
              Today
            </button>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-1.5 rounded-md hover:bg-accent transition-colors">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-semibold w-36 text-center">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
              <button onClick={nextMonth} className="p-1.5 rounded-md hover:bg-accent transition-colors">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-background/50">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="min-w-[800px] h-full flex flex-col bg-card border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="grid grid-cols-7 border-b border-border bg-muted/50 flex-shrink-0">
                {weekDays.map(day => (
                  <div key={day} className="p-3 text-center text-sm font-semibold text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                {dateInterval.map((date, idx) => {
                  const dayTasks = getTasksForDate(date);
                  const isCurrentMonth = isSameMonth(date, currentDate);
                  const isTodayDate = isToday(date);
                  
                  return (
                    <div 
                      key={idx} 
                      className={`min-h-[120px] p-2 border-b border-r border-border/50 relative group transition-colors ${!isCurrentMonth ? 'bg-muted/20 opacity-50' : ''} hover:bg-accent/10`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isTodayDate ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}>
                          {format(date, 'd')}
                        </span>
                        {dayTasks.length > 0 && (
                          <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                            {dayTasks.length} task{dayTasks.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-1.5 overflow-y-auto max-h-[80px] custom-scrollbar">
                        {dayTasks.map(task => (
                          <div 
                            key={task._id}
                            onClick={() => router.push(ROUTES.PROJECT(task.project._id))}
                            className={`text-xs p-1.5 rounded border cursor-pointer hover:opacity-80 transition-opacity truncate
                              ${task.status === 'done' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 line-through' : 'bg-card border-border text-foreground hover:border-primary/50'}`}
                            title={task.title}
                          >
                            <span className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle" style={{ backgroundColor: task.project?.color || '#ccc' }} />
                            {task.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

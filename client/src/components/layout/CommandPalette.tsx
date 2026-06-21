'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, FolderKanban, CheckSquare, LayoutDashboard,
  Calendar, Settings, Users, X, ArrowRight, Loader2,
} from 'lucide-react';
import { useUIStore } from '@/store/ui.store';
import { useDebounce } from '@/hooks/useDebounce';
import { apiGet } from '@/lib/api';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface SearchResult {
  projects?: Array<{ _id: string; name: string; color: string; status: string }>;
  tasks?: Array<{ _id: string; title: string; priority: string; project: { name: string } }>;
  members?: Array<{ _id: string; name: string; email: string; avatar?: string }>;
}

const staticCommands = [
  { id: 'dashboard', label: 'Go to Dashboard', icon: LayoutDashboard, href: ROUTES.DASHBOARD, group: 'Navigation' },
  { id: 'projects', label: 'Browse Projects', icon: FolderKanban, href: ROUTES.PROJECTS, group: 'Navigation' },
  { id: 'tasks', label: 'My Tasks', icon: CheckSquare, href: ROUTES.TASKS, group: 'Navigation' },
  { id: 'calendar', label: 'Calendar', icon: Calendar, href: ROUTES.CALENDAR, group: 'Navigation' },
  { id: 'settings', label: 'Settings', icon: Settings, href: ROUTES.SETTINGS, group: 'Navigation' },
  { id: 'profile', label: 'Profile', icon: Users, href: ROUTES.PROFILE, group: 'Navigation' },
];

export const CommandPalette: React.FC = () => {
  const router = useRouter();
  const { commandPaletteOpen, closeCommandPalette } = useUIStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const debouncedQuery = useDebounce(query, 300);

  // Keyboard shortcut to open/close
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        commandPaletteOpen ? closeCommandPalette() : useUIStore.getState().openCommandPalette();
      }
      if (e.key === 'Escape') closeCommandPalette();
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [commandPaletteOpen, closeCommandPalette]);

  // Search
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults(null);
      return;
    }

    const search = async () => {
      setIsLoading(true);
      try {
        const res = await apiGet<SearchResult>(`/search?q=${encodeURIComponent(debouncedQuery)}`);
        setResults(res.data.data);
      } catch {
        setResults(null);
      } finally {
        setIsLoading(false);
      }
    };
    search();
  }, [debouncedQuery]);

  const handleClose = () => {
    setQuery('');
    setResults(null);
    closeCommandPalette();
  };

  const navigate = useCallback((href: string) => {
    router.push(href);
    handleClose();
  }, [router]);

  const filteredStatic = query
    ? staticCommands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : staticCommands;

  if (!commandPaletteOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100]">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.15 }}
          className="absolute left-1/2 top-[20%] -translate-x-1/2 w-full max-w-xl"
        >
          <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              {isLoading ? (
                <Loader2 className="h-4 w-4 text-muted-foreground animate-spin flex-shrink-0" />
              ) : (
                <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <input
                autoFocus
                type="text"
                placeholder="Search or type a command..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {/* Static commands */}
              {filteredStatic.length > 0 && (
                <div className="mb-2">
                  <p className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Navigation</p>
                  {filteredStatic.map((cmd) => {
                    const Icon = cmd.icon;
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => navigate(cmd.href)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent text-sm transition-colors group"
                      >
                        <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                        </div>
                        <span className="flex-1 text-left text-foreground">{cmd.label}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Search results */}
              {results && (
                <>
                  {results.projects && results.projects.length > 0 && (
                    <div className="mb-2">
                      <p className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Projects</p>
                      {results.projects.map((project) => (
                        <button
                          key={project._id}
                          onClick={() => navigate(ROUTES.PROJECT(project._id))}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent text-sm transition-colors group"
                        >
                          <div
                            className="h-5 w-5 rounded flex-shrink-0"
                            style={{ backgroundColor: project.color }}
                          />
                          <span className="flex-1 text-left text-foreground">{project.name}</span>
                          <span className="text-[10px] text-muted-foreground capitalize">{project.status}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {results.tasks && results.tasks.length > 0 && (
                    <div className="mb-2">
                      <p className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Tasks</p>
                      {results.tasks.map((task) => (
                        <button
                          key={task._id}
                          onClick={() => useUIStore.getState().openTaskModal(task._id)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent text-sm transition-colors group"
                        >
                          <CheckSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 text-left">
                            <p className="text-foreground line-clamp-1">{task.title}</p>
                            <p className="text-[10px] text-muted-foreground">{task.project?.name}</p>
                          </div>
                          <span className={cn(
                            'text-[10px] capitalize px-1.5 py-0.5 rounded-full',
                            task.priority === 'urgent' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                            task.priority === 'high' && 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
                            task.priority === 'medium' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                            task.priority === 'low' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                          )}>
                            {task.priority}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {query.length >= 2 && !isLoading && !results?.projects?.length && !results?.tasks?.length && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Search className="h-8 w-8 mb-3 opacity-30" />
                  <p className="text-sm">No results for "{query}"</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-4 py-2 flex items-center gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-muted rounded text-[9px]">↑↓</kbd> navigate</span>
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-muted rounded text-[9px]">↵</kbd> select</span>
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-muted rounded text-[9px]">Esc</kbd> close</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

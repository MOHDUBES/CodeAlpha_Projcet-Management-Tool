'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/store/ui.store';
import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CommandPalette } from './CommandPalette';
import { CreateProjectModal } from '../modals/CreateProjectModal';
import { CreateTaskModal } from '../modals/CreateTaskModal';
import { TaskDetailModal } from '../modals/TaskDetailModal';
import { ShareProjectModal } from '../modals/ShareProjectModal';
import { ProjectSettingsModal } from '../modals/ProjectSettingsModal';

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <div 
        className={cn(
          "flex flex-col flex-1 h-full transition-all duration-300 ease-in-out w-full",
          sidebarCollapsed ? "ml-[60px]" : "ml-[240px]"
        )}
      >
        <Header />
        <main className="flex-1 overflow-auto bg-background/50">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette />

      {/* Global Modals */}
      <CreateProjectModal />
      <CreateTaskModal />
      <TaskDetailModal />
      <ShareProjectModal />
      <ProjectSettingsModal />
    </div>
  );
};

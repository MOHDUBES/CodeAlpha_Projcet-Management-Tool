'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/store/ui.store';
import { ROUTES } from '@/lib/constants';
import { useRouter } from 'next/navigation';

type KeyCombo = {
  key: string;
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  action: () => void;
  description?: string;
};

export function useKeyboardShortcuts() {
  const router = useRouter();
  const { openCommandPalette, openCreateProjectModal, openCreateTaskModal, toggleSidebar } = useUIStore();

  useEffect(() => {
    const shortcuts: KeyCombo[] = [
      {
        key: 'k', meta: true,
        action: openCommandPalette,
        description: 'Open command palette',
      },
      {
        key: 'k', ctrl: true,
        action: openCommandPalette,
        description: 'Open command palette',
      },
      {
        key: 'p', shift: true,
        action: () => router.push(ROUTES.PROFILE),
        description: 'Go to profile',
      },
      {
        key: 'n', shift: true,
        action: openCreateProjectModal,
        description: 'New project',
      },
      {
        key: 't', shift: true,
        action: openCreateTaskModal,
        description: 'New task',
      },
      {
        key: 'b', shift: true,
        action: toggleSidebar,
        description: 'Toggle sidebar',
      },
      {
        key: 'd', meta: true,
        action: () => router.push(ROUTES.DASHBOARD),
        description: 'Go to dashboard',
      },
    ];

    const handleKeydown = (e: KeyboardEvent) => {
      // Don't fire shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) return;

      for (const shortcut of shortcuts) {
        const metaMatch = shortcut.meta ? e.metaKey : true;
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey : !shortcut.ctrl;
        const shiftMatch = shortcut.shift ? e.shiftKey : !shortcut.shift;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (keyMatch && metaMatch && shiftMatch) {
          e.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [openCommandPalette, openCreateProjectModal, openCreateTaskModal, toggleSidebar, router]);
}

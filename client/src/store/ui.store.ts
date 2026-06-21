import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';

interface UIStore {
  theme: Theme;
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  taskModalId: string | null;
  createProjectModalOpen: boolean;
  createTaskModalOpen: boolean;
  shareModalOpen: boolean;
  projectSettingsModalOpen: boolean;
  activeProjectId: string | null;

  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  openTaskModal: (taskId: string) => void;
  closeTaskModal: () => void;
  openCreateProjectModal: () => void;
  closeCreateProjectModal: () => void;
  openCreateTaskModal: () => void;
  closeCreateTaskModal: () => void;
  openShareModal: () => void;
  closeShareModal: () => void;
  openProjectSettingsModal: () => void;
  closeProjectSettingsModal: () => void;
  setActiveProjectId: (projectId: string | null) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  theme: 'dark',
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  taskModalId: null,
  createProjectModalOpen: false,
  createTaskModalOpen: false,
  shareModalOpen: false,
  projectSettingsModalOpen: false,
  activeProjectId: null,

  setTheme: (theme) => set({ theme }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
  openTaskModal: (taskId) => set({ taskModalId: taskId }),
  closeTaskModal: () => set({ taskModalId: null }),
  openCreateProjectModal: () => set({ createProjectModalOpen: true }),
  closeCreateProjectModal: () => set({ createProjectModalOpen: false }),
  openCreateTaskModal: () => set({ createTaskModalOpen: true }),
  closeCreateTaskModal: () => set({ createTaskModalOpen: false }),
  openShareModal: () => set({ shareModalOpen: true }),
  closeShareModal: () => set({ shareModalOpen: false }),
  openProjectSettingsModal: () => set({ projectSettingsModalOpen: true }),
  closeProjectSettingsModal: () => set({ projectSettingsModalOpen: false }),
  setActiveProjectId: (projectId) => set({ activeProjectId: projectId }),
}));

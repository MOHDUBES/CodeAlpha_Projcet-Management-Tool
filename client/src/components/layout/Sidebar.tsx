'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FolderKanban, CheckSquare, Calendar,
  Bell, Settings, ChevronLeft, ChevronRight, Plus,
  Users, BarChart3, Zap, Shield, LogOut, ChevronDown, Check, Folder
} from 'lucide-react';
import * as Collapsible from '@radix-ui/react-collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { ROUTES } from '@/lib/constants';
import { UserAvatar } from '@/components/ui/avatar';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: ROUTES.DASHBOARD, icon: LayoutDashboard, label: 'Dashboard' },
  { href: ROUTES.PROJECTS, icon: FolderKanban, label: 'Projects' },
  { href: ROUTES.TASKS, icon: CheckSquare, label: 'My Tasks' },
  { href: ROUTES.CALENDAR, icon: Calendar, label: 'Calendar' },
  { href: ROUTES.NOTIFICATIONS, icon: Bell, label: 'Notifications' },
];

const adminNavItems = [
  { href: ROUTES.ADMIN, icon: BarChart3, label: 'Analytics' },
  { href: ROUTES.ADMIN_USERS, icon: Users, label: 'Users' },
  { href: ROUTES.ADMIN_PROJECTS, icon: Shield, label: 'Projects' },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar, openCreateProjectModal } = useUIStore();

  const isAdmin = user?.role === 'admin';

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 60 : 240 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-screen z-40 bg-sidebar border-r border-sidebar-border flex flex-col overflow-hidden"
    >
      {/* Workspace Switcher */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-sidebar-border flex-shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "flex items-center gap-2 hover:bg-accent p-1.5 rounded-lg transition-colors w-full",
              sidebarCollapsed && "justify-center"
            )}>
              <div className="h-7 w-7 rounded-md overflow-hidden flex items-center justify-center flex-shrink-0">
                <img src="/logo.png" alt="PM SaaS Logo" className="w-full h-full object-cover" />
              </div>
              {!sidebarCollapsed && (
                <>
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="font-bold text-foreground text-sm truncate w-full text-left">PM SaaS</span>
                    <span className="text-[10px] text-muted-foreground truncate w-full text-left">Free Plan</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start" sideOffset={8}>
            <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
            <DropdownMenuItem className="justify-between">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded bg-primary/20 flex items-center justify-center">
                  <Zap className="h-3 w-3 text-primary" />
                </div>
                <span>PM SaaS</span>
              </div>
              <Check className="h-4 w-4 text-primary" />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Plus className="mr-2 h-4 w-4" />
              <span>Create Workspace</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {!sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="h-6 w-6 ml-1 flex-shrink-0 rounded-md hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Quick Action */}
      <div className="px-3 py-3 flex-shrink-0">
        {sidebarCollapsed ? (
          <SimpleTooltip content="New Project" side="right">
            <button
              onClick={openCreateProjectModal}
              className="w-full h-8 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </SimpleTooltip>
        ) : (
          <Button
            onClick={openCreateProjectModal}
            size="sm"
            variant="gradient"
            className="w-full text-xs"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
          >
            New Project
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          const linkContent = (
            <Link
              href={item.href}
              className={cn(
                'sidebar-link',
                isActive && 'active',
                sidebarCollapsed && 'justify-center px-2'
              )}
            >
              <Icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')} />
              {!sidebarCollapsed && (
                <span className="truncate">{item.label}</span>
              )}
              {!sidebarCollapsed && isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
                />
              )}
            </Link>
          );

          return sidebarCollapsed ? (
            <SimpleTooltip key={item.href} content={item.label} side="right">
              {linkContent}
            </SimpleTooltip>
          ) : (
            <div key={item.href}>{linkContent}</div>
          );
        })}

        {/* Collapsible Projects */}
        {!sidebarCollapsed && (
          <Collapsible.Root defaultOpen className="pt-4 pb-1 group/collapsible">
            <Collapsible.Trigger className="flex items-center justify-between w-full px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors group">
              <span>Your Projects</span>
              <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]/collapsible:-rotate-180" />
            </Collapsible.Trigger>
            <Collapsible.Content className="space-y-0.5 mt-1 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden">
              <Link href={ROUTES.PROJECTS} className="sidebar-link pl-8 text-muted-foreground">
                <Folder className="h-4 w-4" />
                <span className="truncate">View All Projects</span>
              </Link>
              {/* Future: Map active projects here */}
            </Collapsible.Content>
          </Collapsible.Root>
        )}

        {/* Admin Section */}
        {isAdmin && (
          <>
            <div className="pt-4 pb-1">
              {!sidebarCollapsed && (
                <p className="px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Admin
                </p>
              )}
            </div>
            {adminNavItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;

              const linkContent = (
                <Link
                  href={item.href}
                  className={cn(
                    'sidebar-link',
                    isActive && 'active',
                    sidebarCollapsed && 'justify-center px-2'
                  )}
                >
                  <Icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')} />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );

              return sidebarCollapsed ? (
                <SimpleTooltip key={item.href} content={item.label} side="right">
                  {linkContent}
                </SimpleTooltip>
              ) : (
                <div key={item.href}>{linkContent}</div>
              );
            })}
          </>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="px-2 py-3 space-y-1 border-t border-sidebar-border flex-shrink-0">
        {/* Settings */}
        {sidebarCollapsed ? (
          <SimpleTooltip content="Settings" side="right">
            <Link
              href={ROUTES.SETTINGS}
              className={cn('sidebar-link justify-center px-2', pathname === ROUTES.SETTINGS && 'active')}
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
            </Link>
          </SimpleTooltip>
        ) : (
          <Link
            href={ROUTES.SETTINGS}
            className={cn('sidebar-link', pathname === ROUTES.SETTINGS && 'active')}
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span>Settings</span>
          </Link>
        )}

        {/* User */}
        <div className={cn('flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-accent cursor-pointer transition-colors', sidebarCollapsed && 'justify-center')}>
          <UserAvatar user={user} size="sm" />
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{user?.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
          )}
          {!sidebarCollapsed && (
            <button
              onClick={logout}
              className="h-6 w-6 rounded-md hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="w-full h-8 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.aside>
  );
};

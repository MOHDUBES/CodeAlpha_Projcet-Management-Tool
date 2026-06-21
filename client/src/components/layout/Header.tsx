'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Bell, Moon, Sun, Menu, Command, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { useNotificationStore } from '@/store/notification.store';
import { UserAvatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuTrigger,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';

export const Header: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const { openCommandPalette, toggleSidebar } = useUIStore();
  const { unreadCount } = useNotificationStore();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      logout();
      router.push(ROUTES.LOGIN);
    }
  };

  return (
    <header className="h-14 border-b border-border bg-background/80 backdrop-blur-md flex items-center gap-3 px-4 flex-shrink-0 z-30 sticky top-0">
      {/* Mobile menu button */}
      <Button variant="ghost" size="icon-sm" onClick={toggleSidebar} className="lg:hidden">
        <Menu className="h-4 w-4" />
      </Button>

      {/* Global Back Button */}
      {pathname !== ROUTES.DASHBOARD && (
        <Button variant="ghost" size="icon-sm" onClick={() => router.back()} className="hidden sm:flex text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Search Bar */}
      <button
        onClick={openCommandPalette}
        className="hidden md:flex items-center gap-2 h-8 px-3 rounded-lg border border-border bg-muted/50 hover:bg-muted text-sm text-muted-foreground transition-colors w-64 group"
      >
        <Search className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="flex-1 text-left">Search...</span>
        <div className="flex items-center gap-0.5 bg-background border border-border rounded px-1 py-0.5">
          <Command className="h-2.5 w-2.5" />
          <span className="text-[10px] font-medium">K</span>
        </div>
      </button>

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Search (mobile) */}
        <Button variant="ghost" size="icon-sm" onClick={openCommandPalette} className="md:hidden">
          <Search className="h-4 w-4" />
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="text-muted-foreground"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Notifications */}
        <Link href={ROUTES.NOTIFICATIONS}>
          <Button variant="ghost" size="icon-sm" className="text-muted-foreground relative">
            <Bell className="h-4 w-4" />
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="notification-badge"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </Link>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-accent transition-colors">
              <UserAvatar user={user} size="sm" />
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold leading-none text-foreground">{user?.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{user?.role?.replace('_', ' ')}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>
                <p className="font-semibold">{user?.name}</p>
                <p className="text-xs text-muted-foreground font-normal">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(ROUTES.PROFILE)}>
              Profile
              <DropdownMenuShortcut>⇧P</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(ROUTES.SETTINGS)}>
              Settings
              <DropdownMenuShortcut>⇧S</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(ROUTES.NOTIFICATIONS)}>
              Notifications
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem danger onClick={handleLogout}>
              Logout
              <DropdownMenuShortcut>⇧Q</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

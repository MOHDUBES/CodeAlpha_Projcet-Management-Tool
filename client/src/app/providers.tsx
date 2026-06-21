'use client';

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { queryClient } from '@/lib/queryClient';
import { useSocket } from '@/hooks/useSocket';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

function AppInit() {
  useSocket();
  useKeyboardShortcuts();
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <AppInit />
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'hsl(var(--card))',
              color: 'hsl(var(--foreground))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px',
              fontSize: '13px',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.15)',
            },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

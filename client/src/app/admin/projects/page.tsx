'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';

export default function AdminProjectsPage() {
  return (
    <AppShell>
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-4">Project Management</h1>
        <p className="text-muted-foreground">This feature is currently under development. Soon you will be able to monitor and manage all projects across the platform.</p>
      </div>
    </AppShell>
  );
}

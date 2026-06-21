'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';

export default function AdminUsersPage() {
  return (
    <AppShell>
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-4">User Management</h1>
        <p className="text-muted-foreground">This feature is currently under development. Soon you will be able to manage all users on the platform from here.</p>
      </div>
    </AppShell>
  );
}

'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';

export default function AdminAnalyticsPage() {
  return (
    <AppShell>
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-4">Admin Analytics</h1>
        <p className="text-muted-foreground">This feature is currently under development. Soon you will see platform-wide analytics and usage metrics here.</p>
      </div>
    </AppShell>
  );
}

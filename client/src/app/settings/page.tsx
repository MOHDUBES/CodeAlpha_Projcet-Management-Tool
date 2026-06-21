'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/AppShell';
import { apiGet, apiPatch, apiPost } from '@/lib/api';
import { User } from '@/types/auth.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, User as UserIcon, Lock, Camera, Palette, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useTheme } from 'next-themes';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { user: authUser, updateUser } = useAuthStore();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');

  // Profile Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await apiGet<User>('/users/profile');
      return res.data.data;
    },
  });

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setEmail(profile.email);
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const res = await apiPatch('/users/profile', { name, email });
      return res.data.data;
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      updateUser(updatedUser);
      toast.success('Profile updated successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update profile'),
  });

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      await apiPatch('/users/change-password', { currentPassword, newPassword });
    },
    onSuccess: () => {
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to change password'),
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate();
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    changePasswordMutation.mutate();
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account settings and preferences.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Tabs */}
          <div className="w-full md:w-64 flex-shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}
            >
              <UserIcon className="h-4 w-4" />
              Public Profile
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'security' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}
            >
              <Lock className="h-4 w-4" />
              Security
            </button>
            <button 
              onClick={() => setActiveTab('preferences')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'preferences' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}
            >
              <Palette className="h-4 w-4" />
              Preferences
            </button>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'profile' && (
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
                
                <div className="flex items-center gap-6 mb-8">
                  <div className="h-24 w-24 rounded-full bg-secondary border border-border overflow-hidden flex items-center justify-center text-4xl font-bold text-muted-foreground relative group cursor-pointer">
                    {profile?.avatar ? (
                      <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>{profile?.name?.charAt(0)}</span>
                    )}
                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="h-6 w-6 text-foreground" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Profile Picture</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">We support PNG, JPG or GIF up to 5MB. Click the avatar to upload.</p>
                  </div>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-md">
                  <Input
                    label="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <div className="pt-4">
                    <Button type="submit" isLoading={updateProfileMutation.isPending}>
                      Save Changes
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-6">Change Password</h2>
                <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                  <Input
                    label="Current Password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                  <Input
                    label="New Password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <div className="pt-4">
                    <Button type="submit" isLoading={changePasswordMutation.isPending}>
                      Update Password
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-6">Appearance</h2>
                
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="text-sm font-medium mb-3 block">Theme Preference</label>
                    <div className="grid grid-cols-3 gap-3">
                      <button 
                        onClick={() => setTheme('light')}
                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                          <Sun className="h-4 w-4 text-orange-500" />
                        </div>
                        <span className="text-sm font-medium">Light</span>
                      </button>
                      
                      <button 
                        onClick={() => setTheme('dark')}
                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
                          <Moon className="h-4 w-4 text-blue-400" />
                        </div>
                        <span className="text-sm font-medium">Dark</span>
                      </button>

                      <button 
                        onClick={() => setTheme('system')}
                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${theme === 'system' ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-900 flex items-center justify-center border border-border shadow-inner">
                          <div className="h-4 w-4 bg-background rounded-sm flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-primary" /></div>
                        </div>
                        <span className="text-sm font-medium">System</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

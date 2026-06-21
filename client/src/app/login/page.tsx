'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Input, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiGet, apiPost } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { ROUTES } from '@/lib/constants';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = React.useState('admin@example.com');
  const [password, setPassword] = React.useState('password123');

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await apiPost<any>('/auth/login', { email, password });
      return res.data;
    },
    onSuccess: (data) => {
      setAuth(data.data.user, data.data.accessToken, data.data.refreshToken);
      toast.success('Welcome back!');
      router.push(ROUTES.DASHBOARD);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Login failed');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">PM</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground text-sm mt-2">Enter your credentials to access your account</p>
        </div>

        <div className="glass-card p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              leftIcon={<Mail className="h-4 w-4" />}
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              leftIcon={<Lock className="h-4 w-4" />}
            />
            
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="rounded border-input bg-transparent text-primary focus:ring-primary" />
                Remember me
              </label>
              <Link href={ROUTES.FORGOT_PASSWORD} className="text-sm text-primary hover:underline">Forgot password?</Link>
            </div>

            <Button
              type="submit"
              className="w-full"
              variant="glow"
              isLoading={loginMutation.isPending}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Sign in
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <a href={ROUTES.SIGNUP} className="text-primary hover:underline font-medium">
              Sign up
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

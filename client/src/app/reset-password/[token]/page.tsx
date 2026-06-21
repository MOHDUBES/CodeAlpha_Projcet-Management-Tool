'use client';

import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiPost } from '@/lib/api';
import { ROUTES } from '@/lib/constants';
import { Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Validate token presence
  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing reset token');
      router.push(ROUTES.LOGIN);
    }
  }, [token, router]);

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { password: string }) => {
      const res = await apiPost<null>(`/auth/reset-password/${token}`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Password has been reset successfully');
      router.push(ROUTES.LOGIN);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    resetPasswordMutation.mutate({ password });
  };

  if (!token) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md px-6 relative z-10">
        <div className="mb-10 text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl font-bold text-primary">PM</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Set New Password</h1>
          <p className="text-muted-foreground">
            Please enter your new password below.
          </p>
        </div>

        <div className="glass-card p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="New Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              leftIcon={<Lock className="h-4 w-4" />}
              placeholder="••••••••"
            />
            
            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              leftIcon={<Lock className="h-4 w-4" />}
              placeholder="••••••••"
            />

            <Button
              type="submit"
              className="w-full mt-2"
              variant="glow"
              isLoading={resetPasswordMutation.isPending}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Reset Password
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <Link href={ROUTES.LOGIN} className="text-primary hover:underline font-medium">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiPost } from '@/lib/api';
import { ROUTES } from '@/lib/constants';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: { email: string }) => {
      const res = await apiPost<null>('/auth/forgot-password', data);
      return res.data;
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast.success('Password reset link sent to your email');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send reset link');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    forgotPasswordMutation.mutate({ email });
  };

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
          <h1 className="text-3xl font-bold tracking-tight mb-2">Reset Password</h1>
          <p className="text-muted-foreground">
            {isSubmitted 
              ? "Check your email for a reset link" 
              : "Enter your email and we'll send you a reset link"}
          </p>
        </div>

        <div className="glass-card p-6 md:p-8">
          {isSubmitted ? (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="h-16 w-16 bg-green-500/10 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                We have sent a password reset link to <br />
                <span className="font-medium text-foreground">{email}</span>
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsSubmitted(false)}
              >
                Try another email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                leftIcon={<Mail className="h-4 w-4" />}
                placeholder="name@example.com"
              />

              <Button
                type="submit"
                className="w-full"
                variant="glow"
                isLoading={forgotPasswordMutation.isPending}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Send Reset Link
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Remember your password?{' '}
            <Link href={ROUTES.LOGIN} className="text-primary hover:underline font-medium">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

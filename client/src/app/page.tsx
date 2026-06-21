'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants';
import { Zap, CheckCircle2, Users2, ShieldCheck, ArrowRight, Kanban, Clock, BellRing } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 selection:text-primary">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">PM SaaS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href={ROUTES.LOGIN} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Log in
            </Link>
            <Link href={ROUTES.SIGNUP}>
              <Button variant="glow" size="sm">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] opacity-50 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              v2.0 is now live
            </span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-balance mx-auto leading-tight"
          >
            Project Management <br />
            <span className="gradient-text">Reimagined for Speed</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto text-balance"
          >
            The all-in-one platform for modern teams to plan, track, and collaborate on projects with unprecedented speed and clarity.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href={ROUTES.SIGNUP}>
              <Button size="xl" variant="glow" rightIcon={<ArrowRight className="h-5 w-5" />}>
                Start building for free
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground sm:hidden">No credit card required</p>
          </motion.div>

          {/* Abstract App Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-20 relative mx-auto max-w-5xl"
          >
            <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl p-2 shadow-2xl">
              <div className="rounded-xl border border-border/50 bg-background overflow-hidden flex h-[400px] md:h-[600px] relative">
                {/* Fake Sidebar */}
                <div className="w-16 md:w-64 border-r border-border bg-sidebar/50 p-4 flex flex-col gap-4">
                  <div className="h-6 w-24 bg-muted rounded-md hidden md:block" />
                  <div className="space-y-2 mt-8">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-8 w-full bg-muted/50 rounded-md" />
                    ))}
                  </div>
                </div>
                {/* Fake Content */}
                <div className="flex-1 p-6 flex flex-col gap-6 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="h-8 w-48 bg-muted rounded-md" />
                    <div className="h-8 w-32 bg-primary/20 rounded-md" />
                  </div>
                  {/* Fake Kanban */}
                  <div className="flex-1 flex gap-4 overflow-hidden">
                    {[1, 2, 3].map((col) => (
                      <div key={col} className="w-72 bg-muted/20 rounded-xl p-3 flex flex-col gap-3">
                        <div className="h-5 w-24 bg-muted rounded-md" />
                        {[1, 2].map((card) => (
                          <div key={card} className="h-24 bg-card border border-border rounded-lg shadow-sm p-3">
                            <div className="h-4 w-3/4 bg-muted rounded-md mb-3" />
                            <div className="flex justify-between items-center mt-auto">
                              <div className="h-3 w-16 bg-muted rounded-md" />
                              <div className="h-6 w-6 rounded-full bg-muted" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Everything you need to ship faster</h2>
            <p className="text-muted-foreground text-lg">Powerful features wrapped in a beautiful, intuitive interface.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Kanban className="h-6 w-6 text-primary" />}
              title="Intuitive Kanban Boards"
              description="Visualize your workflow with drag-and-drop boards. Customize columns and automate task movement."
            />
            <FeatureCard
              icon={<Clock className="h-6 w-6 text-primary" />}
              title="Real-time Collaboration"
              description="See changes instantly as they happen. Socket.io integration ensures everyone is always on the same page."
            />
            <FeatureCard
              icon={<BellRing className="h-6 w-6 text-primary" />}
              title="Smart Notifications"
              description="Never miss an update. Get notified about mentions, assignments, and approaching deadlines."
            />
            <FeatureCard
              icon={<CheckCircle2 className="h-6 w-6 text-primary" />}
              title="Advanced Task Management"
              description="Break work down with subtasks, checklists, rich text descriptions, and file attachments."
            />
            <FeatureCard
              icon={<Users2 className="h-6 w-6 text-primary" />}
              title="Role-Based Access"
              description="Control exactly who can see and do what with granular permissions and team roles."
            />
            <FeatureCard
              icon={<ShieldCheck className="h-6 w-6 text-primary" />}
              title="Enterprise Grade Security"
              description="Built with industry best practices, featuring JWT auth, rate limiting, and data encryption."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="font-bold tracking-tight">PM SaaS</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 PM SaaS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="glass-card p-6 flex flex-col gap-4">
      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

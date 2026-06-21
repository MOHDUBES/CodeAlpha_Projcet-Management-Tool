import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    default: 'PM SaaS — Enterprise Project Management',
    template: '%s | PM SaaS',
  },
  description:
    'The all-in-one project management platform for modern teams. Kanban boards, real-time collaboration, task tracking, and more.',
  keywords: ['project management', 'kanban', 'task tracking', 'team collaboration', 'saas'],
  authors: [{ name: 'PM SaaS Team' }],
  creator: 'PM SaaS',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'PM SaaS — Enterprise Project Management',
    description: 'The all-in-one project management platform for modern teams.',
    siteName: 'PM SaaS',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'PM SaaS — Enterprise Project Management',
    description: 'The all-in-one project management platform for modern teams.',
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.png?v=2',
    apple: '/logo.png',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1117' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Attribution Tracker',
  description: 'First-party multi-touch attribution dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Sidebar />
        <main className="pl-56 min-h-screen">
          <Suspense>{children}</Suspense>
        </main>
      </body>
    </html>
  );
}

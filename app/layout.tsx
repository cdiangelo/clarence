import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'Clarence — Investment Analyst',
  description: 'Personal investment research and analysis',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg text-ink antialiased h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

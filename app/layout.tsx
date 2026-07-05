import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Clarence — Golf Performance',
  description: 'Personal golf management and advisory',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-paper text-ink antialiased h-full font-body">
        {children}
      </body>
    </html>
  );
}

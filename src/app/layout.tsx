import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/components/common/QueryProvider';

export const metadata: Metadata = {
  title: 'JAWIR Sentinel',
  description: 'AI-assisted governed decision workflow for financial operations',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}


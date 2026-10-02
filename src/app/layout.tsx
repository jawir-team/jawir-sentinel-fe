import type { Metadata } from 'next';
import './globals.css';

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
      <body className="antialiased min-h-screen bg-neutral-50 text-neutral-900">
        {children}
      </body>
    </html>
  );
}

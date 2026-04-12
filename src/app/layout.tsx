import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kaaf CMS — Admin',
  description: 'Content management system for Kaaf Logistics',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" />
      </head>
      <body className="h-full" suppressHydrationWarning>{children}</body>
    </html>
  );
}

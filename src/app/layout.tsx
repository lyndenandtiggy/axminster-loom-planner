import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Axminster Loom Planner',
  description: 'Internal loom planning and scheduling tool for Axminster Carpets',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="h-full min-h-screen bg-[#0a0a0f] text-[#e2e8f0] antialiased">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import './globals.css';
import { SocketInitializer } from '@/hooks/useSocket';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "AI Charades: Director's Cut",
  description: 'A party game for the modern age.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' className='dark'>
      <body className={inter.className}>
        <SocketInitializer />
        {children}
      </body>
    </html>
  );
}

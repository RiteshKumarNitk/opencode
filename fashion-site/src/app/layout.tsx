import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/components/QueryProvider';
import { Navbar } from '@/components/Navbar';
import ChatWidget from '@/components/ChatWidget';
import CompareBar from '@/components/CompareBar';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'FashionStore - Premium Fashion E-Commerce',
  description: 'Discover premium fashion with fast delivery and easy returns',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FashionStore',
  },
};

export const viewport: Viewport = {
  themeColor: '#ff3f6c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${inter.className} bg-[#f8fafc] antialiased`}>
        <QueryProvider>
          <Navbar />
          <main className="min-h-[calc(100vh-64px)] pb-16">{children}</main>
          <CompareBar />
          <ChatWidget />
        </QueryProvider>
      </body>
    </html>
  );
}
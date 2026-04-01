import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/components/QueryProvider';
import { Navbar } from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'FashionStore - Premium Fashion E-Commerce',
  description: 'Discover premium fashion with fast delivery and easy returns',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#f8fafc] antialiased`}>
        <QueryProvider>
          <Navbar />
          <main className="min-h-[calc(100vh-64px)]">{children}</main>
        </QueryProvider>
      </body>
    </html>
  );
}

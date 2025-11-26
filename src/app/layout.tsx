/**
 * Root Layout
 * Main layout for the entire app
 */

import type { Metadata, Viewport } from 'next';
import './globals.css';
import { TRPCProvider } from '@/lib/trpc/Provider';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'WC Check System - Toilet Inspection Management',
  description: 'Professional toilet inspection and management system with QR code scanning',
  keywords: 'toilet inspection, QR code, facility management, cleaning inspection',
  authors: [{ name: 'WC Check Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <TRPCProvider>
          {children}

          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#000',
                color: '#fff',
                border: '1px solid #333',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </TRPCProvider>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Manrope, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Orbital',
  description: 'Frontend bancario Orbital conectado a Clerk y a un backend Express protegido.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body className={`${manrope.variable} ${plexMono.variable}`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}

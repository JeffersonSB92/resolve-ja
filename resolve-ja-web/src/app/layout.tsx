import type { Metadata } from 'next';
import { Poppins, Space_Grotesk } from 'next/font/google';
import { AppProviders } from '@/providers/AppProviders';
import './globals.css';

const fontSans = Poppins({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const fontMono = Space_Grotesk({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
});

export const metadata: Metadata = {
  title: 'ResolveJa Web',
  description: 'Interface web modular da plataforma ResolveJa',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${fontSans.variable} ${fontMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

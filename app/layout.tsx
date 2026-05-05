import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const jbm = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jbm',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Sideline — Coverage & scheduling',
  description: 'Coverage and scheduling for Royal Sporting Group trainers.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jbm.variable}`}>
      <body className="bg-bg text-ink antialiased">{children}</body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Stoq. — Autonomous Inventory & Supply Intelligence',
  description: 'Autonomous inventory intelligence, optical matrix scanning, and real-time demand telemetry built for modern enterprises.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased selection:bg-white selection:text-[#141414]" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

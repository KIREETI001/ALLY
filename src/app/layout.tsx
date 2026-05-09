import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { createClient } from '@/lib/supabase/server';
import { AppProvider } from '@/context/AppContext';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'ALLY — Caregiver Co-Pilot',
  description: 'Your AI caregiving co-pilot for Singapore. Discharge parsing, care coordination, subsidy navigation, and burnout support in five languages.',
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const initialUser = user ? { id: user.id, email: user.email || '' } : null;

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AppProvider initialUser={initialUser}>{children}</AppProvider>
      </body>
    </html>
  );
}

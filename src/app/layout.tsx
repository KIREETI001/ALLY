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
  // Fail open, like the middleware: a root-layout crash takes down EVERY page
  // ("Application error: a server-side exception"). If the auth bootstrap
  // fails (missing env vars, unreachable Supabase), render with no initial
  // user — AppProvider re-checks auth client-side and redirects to /login.
  let initialUser: { id: string; email: string } | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    initialUser = user ? { id: user.id, email: user.email || '' } : null;
  } catch (err) {
    // Next marks routes dynamic by THROWING during prerender (cookies() →
    // digest DYNAMIC_SERVER_USAGE). That control-flow exception must
    // propagate or the build log fills with false "failures" and routes can
    // be mis-classified as static. Only swallow genuine runtime errors.
    if ((err as { digest?: string })?.digest === 'DYNAMIC_SERVER_USAGE') throw err;
    console.error('layout auth bootstrap failed:', err);
  }

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AppProvider initialUser={initialUser}>{children}</AppProvider>
      </body>
    </html>
  );
}

import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Fail OPEN, never 500 the whole site: if session refresh throws (missing
  // env vars, paused Supabase project, transient network failure), let the
  // request through. Two other layers still protect everything that matters —
  // page.tsx redirects unauthenticated users client-side, and Postgres RLS
  // makes data unreadable without a valid session. A middleware crash once
  // took down every route (MIDDLEWARE_INVOCATION_FAILED); never again.
  try {
    return await updateSession(request);
  } catch (err) {
    console.error('middleware session refresh failed:', err);
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: [
    // Skip static assets and Next internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

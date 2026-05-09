'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export async function sendReset(formData: FormData): Promise<{ error?: string }> {
  const email = String(formData.get('email') ?? '').trim();
  if (!email) return { error: 'Please enter your email.' };

  const supabase = await createClient();
  const h = await headers();
  const origin = h.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });
  if (error) return { error: error.message };
  return {};
}

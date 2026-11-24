'use client';
import { createBrowserClient } from '@supabase/ssr';

// Supabase in the browser, signed in as the visitor (if they are).
// Row level security decides what they can read and change.
export function supabaseBrowser() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookieOptions: { path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' },
  });
}

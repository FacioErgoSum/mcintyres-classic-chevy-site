import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Supabase on the server, signed in as the visitor from their cookies.
export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(list) {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, { ...options, path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' }));
        } catch {
          // Server components can't set cookies; middleware.ts refreshes them instead.
        }
      },
    },
  });
}

/** The signed-in visitor, or null. Never trust this from the browser; it's checked with Supabase. */
export async function currentUser() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return null;
  const { data } = await (await supabaseServer()).auth.getUser();
  return data.user ?? null;
}

/** Full access, for the server only (saving orders, reading shared lists). Uses SUPABASE_SECRET_KEY. */
export function supabaseAdmin() {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !secret) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, secret, { auth: { persistSession: false } });
}

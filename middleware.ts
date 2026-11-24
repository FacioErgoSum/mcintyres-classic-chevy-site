import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Keeps the sign-in fresh: Supabase's session token expires hourly and is
// renewed here on page loads. Pages work the same for guests.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  // Only bother when the visitor has a Supabase cookie (i.e. has signed in).
  if (!url || !key || !request.cookies.getAll().some((c) => c.name.startsWith('sb-'))) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, { ...options, path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' }));
      },
    },
  });
  // Do not remove: this is what renews the session.
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|api/stripe-webhook|favicon.ico|icon.png|apple-icon.png|brand/|photos/|parts/.*\\.webp|slides/).*)'],
};

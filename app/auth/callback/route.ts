import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

// Google, Facebook and the email links all come back here with a one-time code,
// which becomes the visitor's session. `next` is where they were headed.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next') || '/account';
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/account'; // only our own pages
  const host = request.headers.get('x-forwarded-host');
  const base = process.env.NODE_ENV !== 'development' && host ? `https://${host}` : origin;

  if (code) {
    const { error } = await (await supabaseServer()).auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${base}${next}`);
    console.error('[auth callback] code exchange failed:', error.message);
  } else {
    console.error('[auth callback] no code in the link; check the Supabase provider and redirect URL settings');
  }
  return NextResponse.redirect(`${base}/account/sign-in?error=1&next=${encodeURIComponent(next)}`);
}

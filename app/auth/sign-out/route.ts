import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

// POST from the "Sign out" button on the account page.
export async function POST(request: Request) {
  await (await supabaseServer()).auth.signOut();
  return NextResponse.redirect(new URL('/', request.url), { status: 303 });
}

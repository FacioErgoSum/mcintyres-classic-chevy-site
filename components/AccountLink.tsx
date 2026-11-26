'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';

// Header link: "Sign in" for guests, "Account" once signed in. Checked in the
// browser so every page stays cached and fast for everyone.
export default function AccountLink() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    const sb = supabaseBrowser();
    sb.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data } = sb.auth.onAuthStateChange((_e, session) => setSignedIn(!!session));
    return () => data.subscription.unsubscribe();
  }, []);
  const label = signedIn ? 'Account' : 'Sign in';
  return (
    <Link
      href={signedIn ? '/account' : '/account/sign-in'}
      aria-label={signedIn ? 'My account' : 'Sign in'}
      className="shrink-0 inline-flex h-[44px] sm:h-[50px] items-center gap-2 rounded-xl border-[3px] border-onyx bg-white px-3 text-base sm:text-lg font-bold text-onyx no-underline hover:bg-ivory hover:text-onyx"
    >
      <svg aria-hidden width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}

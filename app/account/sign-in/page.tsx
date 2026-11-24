import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { currentUser } from '@/lib/supabase/server';
import SignInForm from '@/components/account/SignInForm';

export const metadata: Metadata = { title: 'Sign in' };
export const dynamic = 'force-dynamic';

type SP = Promise<{ next?: string; error?: string }>;

export default async function SignInPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const next = sp.next && sp.next.startsWith('/') && !sp.next.startsWith('//') ? sp.next : '/account';
  if (await currentUser()) redirect(next);
  return (
    <div className="space-y-8 max-w-md">
      <div className="space-y-3">
        <h1>Sign in</h1>
        <p>An account lets you save parts to lists, share a list with family, and see your orders and tracking.</p>
        <p className="text-lg">You don’t need an account to buy parts. <Link href="/cart">Check out as a guest</Link>.</p>
      </div>
      {sp.error && (
        <p role="alert" className="rounded-lg bg-matador/10 border-[3px] border-matador p-4 text-lg">
          That sign-in didn’t go through. Please try again, or use a different way below.
        </p>
      )}
      <SignInForm next={next} />
    </div>
  );
}

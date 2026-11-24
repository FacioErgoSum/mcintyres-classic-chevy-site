import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { listParts } from '@/lib/lists';
import ListEditor from '@/components/account/ListEditor';

export const metadata: Metadata = { title: 'Your list', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function ListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await supabaseServer();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) redirect(`/account/sign-in?next=/lists/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  // Row level security only returns the signed-in customer's own list.
  const { data: list } = await sb
    .from('wishlists')
    .select('id, name, shared, share_id, wishlist_items(handle, qty, added_at)')
    .eq('id', id)
    .maybeSingle();
  if (!list) notFound();
  const items = [...list.wishlist_items].sort((a, b) => a.added_at.localeCompare(b.added_at));

  return (
    <div className="space-y-6">
      <p><Link href="/account">Back to your account</Link></p>
      <ListEditor list={{ id: list.id, name: list.name, shared: list.shared, shareId: list.share_id }} items={await listParts(items)} />
    </div>
  );
}

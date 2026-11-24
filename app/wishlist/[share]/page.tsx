import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { listParts } from '@/lib/lists';
import ListItems from '@/components/account/ListItems';
import { CAR_COLUMNS, carFromRow, carLabel, carMention } from '@/lib/cars';

export const dynamic = 'force-dynamic';
type P = Promise<{ share: string }>;

// A list someone shared. Read with the server's key, and only when the owner
// has turned sharing on. Visitors can buy from it but not change it.
async function load(share: string) {
  const db = supabaseAdmin();
  if (!db || !/^[0-9a-f]{32}$/i.test(share)) return null;
  const { data } = await db.from('wishlists').select(`name, user_id, ${CAR_COLUMNS}, wishlist_items(handle, qty, added_at)`).eq('share_id', share).eq('shared', true).maybeSingle();
  if (!data) return null;
  const { data: u } = await db.auth.admin.getUserById(data.user_id);
  const first = (u.user?.user_metadata?.full_name || u.user?.user_metadata?.name || '').toString().trim().split(' ')[0];
  return { ...data, owner: first || null };
}

export async function generateMetadata({ params }: { params: P }): Promise<Metadata> {
  const l = await load((await params).share);
  return { title: l ? `${l.owner ? `${l.owner}’s list: ` : ''}${l.name}` : 'List not found', robots: { index: false } };
}

export default async function SharedList({ params }: { params: P }) {
  const l = await load((await params).share);
  if (!l) notFound();
  const items = await listParts([...l.wishlist_items].sort((a, b) => a.added_at.localeCompare(b.added_at)));
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-lg text-onyx/80">{l.owner ? `${l.owner} shared a parts list with you` : 'A parts list shared with you'}</p>
        <h1>{l.name}</h1>
        {carFromRow(l) && carLabel(carFromRow(l)!) !== l.name && <p className="text-xl">For <strong>{carMention(carFromRow(l)!)}</strong></p>}
        <p className="max-w-[60ch]">Buying these as a gift? Add them to your cart and check out. You don’t need an account.</p>
      </div>
      {items.length ? <ListItems items={items} car={carFromRow(l)} /> : <p className="text-lg">This list is empty right now.</p>}
      <p className="text-lg">Not sure a part is right? <Link href="/ask">Ask us</Link> and we’ll check.</p>
    </div>
  );
}

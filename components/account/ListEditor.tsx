'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { ListPart } from '@/lib/lists';
import ListItems from './ListItems';

type Props = { list: { id: string; name: string; shared: boolean; shareId: string }; items: ListPart[] };

export default function ListEditor({ list, items: initial }: Props) {
  const router = useRouter();
  const [name, setName] = useState(list.name);
  const [editing, setEditing] = useState(false);
  const [shared, setShared] = useState(list.shared);
  const [items, setItems] = useState(initial);
  const [msg, setMsg] = useState('');
  const sb = supabaseBrowser();
  const shareUrl = typeof window === 'undefined' ? '' : `${window.location.origin}/wishlist/${list.shareId}`;

  async function rename(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim() || 'My wish list';
    const { error } = await sb.from('wishlists').update({ name: n }).eq('id', list.id);
    if (!error) {
      setName(n);
      setEditing(false);
    }
  }

  async function setSharing(on: boolean) {
    const { error } = await sb.from('wishlists').update({ shared: on }).eq('id', list.id);
    if (!error) setShared(on);
  }

  async function share() {
    // Phones get their own share sheet (text, email, Facebook…); computers copy the link.
    if (navigator.share) {
      try {
        await navigator.share({ title: name, text: `My parts list from McIntyre’s: ${name}`, url: shareUrl });
        return;
      } catch {
        /* closed the sheet, fall back to copying */
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setMsg('Link copied. Paste it in a text or email.');
    } catch {
      setMsg('Copy the link above to share it.');
    }
  }

  async function setQty(handle: string, qty: number) {
    if (qty < 1) {
      const { error } = await sb.from('wishlist_items').delete().eq('wishlist_id', list.id).eq('handle', handle);
      if (!error) setItems((xs) => xs.filter((x) => x.handle !== handle));
      return;
    }
    const { error } = await sb.from('wishlist_items').update({ qty }).eq('wishlist_id', list.id).eq('handle', handle);
    if (!error) setItems((xs) => xs.map((x) => (x.handle === handle ? { ...x, qty } : x)));
  }

  async function remove() {
    if (!window.confirm(`Delete the list “${name}”? The parts stay in the store; only the list goes.`)) return;
    const { error } = await sb.from('wishlists').delete().eq('id', list.id);
    if (!error) router.push('/account');
  }

  return (
    <div className="space-y-8">
      {editing ? (
        <form onSubmit={rename} className="space-y-3 max-w-md">
          <label htmlFor="list-name" className="label">List name</label>
          <input id="list-name" className="field" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <button type="submit" className="btn-main">Save name</button>
        </form>
      ) : (
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <h1>{name}</h1>
          <button type="button" className="text-lg font-bold underline underline-offset-4 decoration-2 text-brand-dark" onClick={() => setEditing(true)}>Rename</button>
        </div>
      )}

      <section className="space-y-3 rounded-xl border-[3px] border-brand p-5" aria-labelledby="share-h">
        <h2 id="share-h" className="text-xl">Share this list</h2>
        {shared ? (
          <>
            <p className="text-lg">Anyone with this link can see the list and buy the parts on it. They can’t change it.</p>
            <p className="break-all rounded-lg bg-ivory p-3 text-lg font-bold select-all">{shareUrl}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button type="button" className="btn-main" onClick={share}>Share the link</button>
              <button type="button" className="btn-plain" onClick={() => setSharing(false)}>Stop sharing</button>
            </div>
          </>
        ) : (
          <>
            <p className="text-lg">Only you can see this list. Share it with family who are shopping for you, or with a friend helping on the car.</p>
            <button type="button" className="btn-main" onClick={() => setSharing(true)}>Make a share link</button>
          </>
        )}
        {msg && <p role="status" className="text-lg">{msg}</p>}
      </section>

      {items.length ? (
        <ListItems items={items} onQty={setQty} />
      ) : (
        <p className="text-lg">This list is empty. Tap <strong>Save to a list</strong> on any part to add it. <Link href="/planner">Find parts for my car</Link></p>
      )}

      <button type="button" className="btn-plain" onClick={remove}>Delete this list</button>
    </div>
  );
}

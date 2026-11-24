'use client';
import { useState } from 'react';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase/client';
import { CAR_COLUMNS, carFromRow, carLabel, carName, partFitsCar, type Car } from '@/lib/cars';
import type { Fitment } from '@/lib/fitment';

type L = { id: string; name: string; has: boolean; car: Car | null };

// "Save to a list" on a part page. Guests are sent to sign in and come back here.
// fitment: which cars the part fits (Tri-Five parts only), to warn about a list's car.
export default function SaveToList({ handle, fitment }: { handle: string; fitment?: Fitment }) {
  const [lists, setLists] = useState<L[] | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [newName, setNewName] = useState('');
  const [note, setNote] = useState('');

  async function load() {
    const sb = supabaseBrowser();
    const { data: s } = await sb.auth.getSession();
    if (!s.session) {
      window.location.href = `/account/sign-in?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    setBusy(true);
    const { data, error } = await sb.from('wishlists').select(`id, name, ${CAR_COLUMNS}, wishlist_items(handle)`).order('created_at');
    if (error) {
      setNote('Lists aren’t available right now.');
      setBusy(false);
      setOpen(true);
      return;
    }
    type W = { id: string; name: string; wishlist_items: { handle: string }[] } & Parameters<typeof carFromRow>[0];
    let ls: L[] = ((data || []) as W[]).map((w) => ({ id: w.id, name: w.name, has: w.wishlist_items.some((i) => i.handle === handle), car: carFromRow(w) }));
    if (!ls.length) {
      // First save: make "My wish list" and put the part in it.
      const { data: w } = await sb.from('wishlists').insert({ name: 'My wish list' }).select('id, name').single();
      if (w) {
        await sb.from('wishlist_items').insert({ wishlist_id: w.id, handle });
        ls = [{ id: w.id, name: w.name, has: true, car: null }];
        setNote(`Saved to ${w.name}.`);
      }
    }
    setLists(ls);
    setBusy(false);
    setOpen(true);
  }

  async function toggle(l: L) {
    setBusy(true);
    const sb = supabaseBrowser();
    const { error } = l.has
      ? await sb.from('wishlist_items').delete().eq('wishlist_id', l.id).eq('handle', handle)
      : await sb.from('wishlist_items').insert({ wishlist_id: l.id, handle });
    if (!error) {
      setLists((ls) => ls!.map((x) => (x.id === l.id ? { ...x, has: !x.has } : x)));
      setNote(l.has ? `Removed from ${l.name}.` : `Saved to ${l.name}.`);
    }
    setBusy(false);
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    const sb = supabaseBrowser();
    const { data: w } = await sb.from('wishlists').insert({ name: newName.trim() }).select('id, name').single();
    if (w) {
      await sb.from('wishlist_items').insert({ wishlist_id: w.id, handle });
      setLists((ls) => [...(ls || []), { id: w.id, name: w.name, has: true, car: null }]);
      setNote(`Saved to ${w.name}.`);
      setNewName('');
    }
    setBusy(false);
  }

  const saved = lists?.some((l) => l.has);
  return (
    <div className="space-y-3">
      <button type="button" className="btn-plain" aria-expanded={open} disabled={busy && !open} onClick={() => (open ? setOpen(false) : load())}>
        <svg aria-hidden width="24" height="24" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" className={saved ? 'text-matador' : ''}>
          <path d="M12 21s-7.5-4.6-9.5-9.2C1 8.3 3.2 4.5 7 4.5c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.8 0 6 3.8 4.5 7.3C19.5 16.4 12 21 12 21z" />
        </svg>
        {saved ? 'Saved to a list' : 'Save to a list'}
      </button>
      {open && lists && (
        <div className="rounded-xl border-[3px] border-onyx/15 p-4 space-y-4 max-w-md">
          <fieldset className="space-y-2">
            <legend className="text-lg font-bold mb-2">Your lists</legend>
            {lists.map((l) => (
              <label key={l.id} className="flex items-center gap-3 text-lg min-h-[48px]">
                <input type="checkbox" className="h-7 w-7 accent-brand shrink-0" checked={l.has} disabled={busy} onChange={() => toggle(l)} />
                <span>
                  {l.name}
                  {l.car && carName(l.car) !== l.name && <span className="block text-base text-onyx/75">{carName(l.car)}</span>}
                  {l.car?.nickname && <span className="block text-base text-onyx/75">{carLabel(l.car)}</span>}
                  {l.car && fitment && !partFitsCar(fitment, l.car) && <span className="block text-base font-bold text-matador">May not fit this car</span>}
                </span>
              </label>
            ))}
          </fieldset>
          <form onSubmit={create} className="space-y-2">
            <label htmlFor={`nl-${handle}`} className="text-lg font-bold block">Or start a new list</label>
            <div className="flex gap-2">
              <input id={`nl-${handle}`} className="field" placeholder="List name" maxLength={80} value={newName} onChange={(e) => setNewName(e.target.value)} />
              <button type="submit" className="btn-main !w-auto" disabled={busy || !newName.trim()}>Add</button>
            </div>
          </form>
          <p className="text-lg"><Link href="/account">See all your lists</Link></p>
        </div>
      )}
      {note && <p role="status" className="text-lg">{note}</p>}
    </div>
  );
}

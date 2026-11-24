'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';

export default function NewListButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabaseBrowser().from('wishlists').insert({ name: name.trim() || 'My wish list' }).select('id').single();
    if (error || !data) {
      setError('We couldn’t make the list. Please try again.');
      setBusy(false);
      return;
    }
    router.push(`/lists/${data.id}`);
  }

  if (!open) return <button type="button" className="btn-plain" onClick={() => setOpen(true)}>+ Make a new list</button>;
  return (
    <form onSubmit={create} className="space-y-3 max-w-md">
      <label htmlFor="new-list" className="label">Name your list</label>
      <input id="new-list" className="field" placeholder="For example: ’57 Bel Air floor job" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      <div className="flex flex-col sm:flex-row gap-3">
        <button type="submit" className="btn-main" disabled={busy}>Make the list</button>
        <button type="button" className="btn-plain" onClick={() => setOpen(false)}>Cancel</button>
      </div>
      {error && <p role="alert" className="text-lg text-matador">{error}</p>}
    </form>
  );
}

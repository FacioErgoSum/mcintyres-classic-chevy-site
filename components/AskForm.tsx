'use client';
import { useState } from 'react';

type Props = { years: number[]; bodies: { id: string; name: string }[]; partName?: string; partHandle?: string };

export default function AskForm({ years, bodies, partName, partHandle }: Props) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');
  const [count, setCount] = useState(0);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('sending');
    setError('');
    const form = new FormData(e.currentTarget);
    const files = form.getAll('photos').filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length > 6) { setError('Please send 6 photos or fewer.'); setState('error'); return; }
    if (files.some((f) => f.size > 10 * 1024 * 1024)) { setError('Each photo needs to be under 10 MB.'); setState('error'); return; }
    try {
      const res = await fetch('/api/ask', { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Your message didn’t send.');
      setState('sent');
    } catch (err) {
      setError((err instanceof Error ? err.message : 'Your message didn’t send.') + ' Please try again.');
      setState('error');
    }
  }

  if (state === 'sent') {
    return (
      <div className="rounded-xl bg-brand-light p-6 space-y-2" role="status">
        <p className="text-2xl font-bold">Message sent</p>
        <p className="text-lg">Thanks. We’ll email you back, usually within two business days.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6 max-w-xl">
      {partHandle && (
        <>
          <input type="hidden" name="part" value={partHandle} />
          <p className="rounded-lg bg-ivory p-4 text-lg">About: <strong>{partName}</strong></p>
        </>
      )}
      <div>
        <label className="label" htmlFor="name">Your name</label>
        <input className="field" id="name" name="name" required autoComplete="name" />
      </div>
      <div>
        <label className="label" htmlFor="email">Your email</label>
        <input className="field" id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="year">Year</label>
          <select className="field" id="year" name="year" defaultValue="">
            <option value="">Not sure</option>
            {years.map((y) => <option key={y} value={y}>’{String(y).slice(-2)}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="body">Body style</label>
          <select className="field" id="body" name="body" defaultValue="">
            <option value="">Not sure</option>
            {bodies.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="message">What are you working on?</label>
        <textarea className="field min-h-[160px]" id="message" name="message" required placeholder="For example: The rear floor is rusted through behind the driver’s seat." />
      </div>
      <div>
        <p className="label" id="photos-label">Photos (up to 6)</p>
        <label htmlFor="photos" className="btn-plain cursor-pointer">Add photos</label>
        <input className="sr-only" id="photos" name="photos" type="file" accept="image/*" multiple aria-labelledby="photos-label"
          onChange={(e) => setCount(e.currentTarget.files?.length ?? 0)} />
        <p className="text-lg mt-2" aria-live="polite">{count ? `${count} photo${count === 1 ? '' : 's'} added.` : 'No photos added yet.'}</p>
        <p className="text-base text-onyx/75 mt-1">Take them in daylight, standing back a few feet so we can see where the part goes.</p>
      </div>
      {error && <p role="alert" className="rounded-lg bg-matador/10 border-[3px] border-matador p-4 text-lg">{error}</p>}
      <button className="btn-main text-xl" type="submit" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : 'Send my question'}
      </button>
    </form>
  );
}

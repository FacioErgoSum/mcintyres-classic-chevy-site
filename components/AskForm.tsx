'use client';
import { useState } from 'react';

type Props = { years: number[]; bodies: { id: string; name: string }[]; partName?: string; partHandle?: string };

// Phone photos are often 3–5 MB each, and the site's server only accepts about
// 6 MB per message. So photos are shrunk here, on the customer's phone, to
// about 1600 pixels across (still plenty to see rust), before sending.
const MAX_SIDE = 1600;
const MAX_TOTAL = 5.5 * 1024 * 1024;

async function shrink(file: File): Promise<Blob> {
  try {
    const img = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    img.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.82));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file; // a format the browser can't open; send it as it is
  }
}

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
    const small = await Promise.all(files.map(shrink));
    if (small.reduce((n, b) => n + b.size, 0) > MAX_TOTAL) {
      setError('Those photos are too big to send together. Please send fewer photos.');
      setState('error');
      return;
    }
    form.delete('photos');
    small.forEach((b, i) => form.append('photos', b, b === files[i] ? files[i].name : `photo-${i + 1}.jpg`));
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
      </div>
      {error && <p role="alert" className="rounded-lg bg-matador/10 border-[3px] border-matador p-4 text-lg">{error}</p>}
      <button className="btn-main text-xl" type="submit" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : 'Send my question'}
      </button>
    </form>
  );
}

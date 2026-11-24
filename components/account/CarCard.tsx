'use client';
import { useState } from 'react';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase/client';
import { BODIES, YEARS } from '@/lib/fitment';
import { decodeVin } from '@/lib/vin';
import { carFinderHref, carLabel, carToRow, type Car } from '@/lib/cars';

// The car a list is for (optional). Lets the owner add, change or remove it.
export default function CarCard({ listId, car, onChange }: { listId: string; car: Car | null; onChange: (c: Car | null) => void }) {
  const [editing, setEditing] = useState(false);
  const [year, setYear] = useState(car?.year ? String(car.year) : '');
  const [body, setBody] = useState(car?.body ?? '');
  const [serial, setSerial] = useState(car?.serial ?? '');
  const [nickname, setNickname] = useState(car?.nickname ?? '');
  const [error, setError] = useState('');

  async function save(next: Car | null) {
    const { error } = await supabaseBrowser().from('wishlists').update(carToRow(next)).eq('id', listId);
    if (error) return setError('We couldn’t save that. Please try again.');
    onChange(next);
    setEditing(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    let next: Car = { year: Number(year) || null, body: body || null, series: car?.series ?? null, engine: car?.engine ?? null, serial: null, nickname: nickname.trim() || null };
    const sn = serial.toUpperCase().replace(/[\s.\-–]/g, '');
    if (sn) {
      const r = decodeVin(sn);
      if (r.kind === 'error') return setError(r.message);
      if (r.kind === 'serial') next = { ...next, year: r.year, series: r.series, engine: r.v8 ? 'V8' : 'six-cylinder', serial: sn, body: next.body || (r.bodies.length === 1 ? r.bodies[0] : null) };
      if (r.kind === 'style') next = { ...next, year: r.year ?? next.year, body: r.body };
    }
    if (!next.year) return setError('Pick the year, or type the serial number.');
    await save(next);
  }

  if (editing) {
    return (
      <form onSubmit={submit} className="space-y-4 rounded-xl border-[3px] border-brand p-5">
        <h2 className="text-xl">Which car is this list for?</h2>
        <div>
          <label htmlFor="car-nick" className="label">Nickname (optional)</label>
          <input id="car-nick" className="field" placeholder="For example: Big Red" maxLength={40} value={nickname} onChange={(e) => setNickname(e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="car-year" className="label">Year</label>
            <select id="car-year" className="field" value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="">Choose</option>
              {YEARS.map((y) => <option key={y} value={y}>’{String(y).slice(-2)}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="car-body" className="label">Body style</label>
            <select id="car-body" className="field" value={body} onChange={(e) => setBody(e.target.value)}>
              <option value="">Not sure</option>
              {BODIES.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="car-serial" className="label">Serial number or cowl tag number (optional)</label>
          <input id="car-serial" className="field uppercase" placeholder="VC57B123456" autoComplete="off" spellCheck={false} value={serial} onChange={(e) => setSerial(e.target.value)} />
        </div>
        {error && <p role="alert" className="text-lg text-matador">{error}</p>}
        <div className="flex flex-col sm:flex-row gap-3">
          <button type="submit" className="btn-main">Save car</button>
          <button type="button" className="btn-plain" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </form>
    );
  }

  if (!car) {
    return (
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-ivory p-4">
        <p className="text-lg">Is this list for one car? Add it, and we’ll flag parts that might not fit.</p>
        <button type="button" className="btn-plain !w-auto" onClick={() => setEditing(true)}>Add a car</button>
      </section>
    );
  }

  return (
    <section className="space-y-3 rounded-xl border-[3px] border-brand bg-brand-light p-5" aria-label="Project car">
      <p className="text-base font-bold uppercase tracking-wide text-brand-dark">Project car</p>
      {car.nickname ? (
        <>
          <p className="text-2xl font-bold">{car.nickname}</p>
          <p className="text-xl">{carLabel(car)}</p>
        </>
      ) : (
        <p className="text-2xl font-bold">{carLabel(car)}</p>
      )}
      {(car.serial || car.engine) && (
        <p className="text-lg">{[car.engine, car.serial ? `Serial ${car.serial}` : ''].filter(Boolean).join(' · ')}</p>
      )}
      {!car.body && <p className="text-lg">Add the body style so we can check every part fits.</p>}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href={carFinderHref(car)} className="btn-main sm:!w-auto">Find parts for this car</Link>
        <button type="button" className="btn-plain sm:!w-auto" onClick={() => setEditing(true)}>Change car</button>
        <button type="button" className="btn-plain sm:!w-auto" onClick={() => save(null)}>Remove car</button>
      </div>
    </section>
  );
}

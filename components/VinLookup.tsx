'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { decodeVin, type VinResult } from '@/lib/vin';
import { BODIES } from '@/lib/fitment';
import { carName, carToRow, type Car } from '@/lib/cars';
import { supabaseBrowser } from '@/lib/supabase/client';

const bodyName = (id: string) => BODIES.find((b) => b.id === id)?.name ?? id;
const yy = (y: number) => `’${String(y).slice(-2)}`;

// "Not sure? Look it up": reads a Tri-Five serial number or cowl tag style number
// and sends the customer to the parts finder with their car filled in.
export default function VinLookup() {
  const [value, setValue] = useState('');
  const [result, setResult] = useState<VinResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [nickname, setNickname] = useState('');
  const [pickBody, setPickBody] = useState<string | null>(null);
  const [pickYear, setPickYear] = useState<number | null>(null);
  const lookUp = (v: string) => {
    setResult(decodeVin(v));
    setPickBody(null);
    setPickYear(null);
  };

  // Back from signing in (/planner?vin=…): fill in and read the number again.
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get('vin');
    if (v) {
      setValue(v);
      lookUp(v);
    }
  }, []);

  // Saves the car as a new list ("project car") and opens it.
  async function saveCar(base: Car) {
    const car = { ...base, nickname: nickname.trim() || null };
    setSaving(true);
    setSaveError('');
    const sb = supabaseBrowser();
    const { data: s } = await sb.auth.getSession();
    if (!s.session) {
      window.location.href = `/account/sign-in?next=${encodeURIComponent(`/planner?vin=${value.trim()}`)}`;
      return;
    }
    const { data, error } = await sb.from('wishlists').insert({ name: carName(car).slice(0, 80), ...carToRow(car) }).select('id').single();
    if (error || !data) {
      setSaveError('We couldn’t save your car. Please try again.');
      setSaving(false);
      return;
    }
    window.location.href = `/lists/${data.id}`;
  }

  return (
    <section className="space-y-4 rounded-xl border-[3px] border-brand p-5 max-w-xl" aria-labelledby="vin-h">
      <h2 id="vin-h" className="text-xl">Not sure? Look it up from your car’s numbers</h2>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          lookUp(value);
        }}
      >
        <label htmlFor="vin" className="label">Serial number or cowl tag style number</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input id="vin" className="field uppercase" placeholder="VC57B123456 or 57-1037D" autoComplete="off" autoCapitalize="characters" spellCheck={false} value={value} onChange={(e) => setValue(e.target.value)} />
          <button type="submit" className="btn-main sm:!w-auto shrink-0">Look it up</button>
        </div>
      </form>
      <ul className="text-base text-onyx/80 list-disc pl-6 space-y-1">
        <li><strong>Serial number:</strong> on the metal plate on the driver’s door hinge post. Tells us the year and model.</li>
        <li><strong>Cowl tag:</strong> the small plate on the firewall under the hood. The number after STYLE tells us the body style.</li>
      </ul>

      {result?.kind === 'error' && <p role="alert" className="rounded-lg bg-matador/10 border-[3px] border-matador p-4 text-lg">{result.message}</p>}

      {result?.kind === 'serial' && (
        <div role="status" className="space-y-4 rounded-lg bg-brand-light p-4">
          <p className="text-xl font-bold">{result.summary}</p>
          {result.bodies.length > 1 && (
            <>
              <p className="text-lg">The serial number doesn’t say the body style. Which one is it?</p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {result.bodies.map((b) => (
                  <li key={b}><Pick on={pickBody === b} onClick={() => setPickBody(b)}>{bodyName(b)}</Pick></li>
                ))}
              </ul>
              <p className="text-base">Or type the cowl tag style number above and we’ll know for sure.</p>
            </>
          )}
          {(pickBody || result.bodies.length === 1) && (
            <Next
              year={result.year}
              body={pickBody || result.bodies[0]}
              nickname={nickname}
              setNickname={setNickname}
              busy={saving}
              onSave={() => saveCar({ year: result.year, body: pickBody || result.bodies[0], series: result.series, engine: result.v8 ? 'V8' : 'six-cylinder', serial: value.toUpperCase().replace(/[\s.\-–]/g, '') })}
            />
          )}
        </div>
      )}

      {result?.kind === 'style' && (
        <div role="status" className="space-y-4 rounded-lg bg-brand-light p-4">
          <p className="text-xl font-bold">{result.summary}</p>
          {!result.year && (
            <>
              <p className="text-lg">Which year? (It’s the two digits before the style number on the tag, like 57-.)</p>
              <ul className="flex flex-wrap gap-2">
                {[1955, 1956, 1957].map((y) => (
                  <li key={y}><Pick on={pickYear === y} onClick={() => setPickYear(y)}>{yy(y)}</Pick></li>
                ))}
              </ul>
            </>
          )}
          {(result.year || pickYear) && (
            <Next
              year={(result.year || pickYear)!}
              body={result.body}
              nickname={nickname}
              setNickname={setNickname}
              busy={saving}
              onSave={() => saveCar({ year: (result.year || pickYear)!, body: result.body, series: null, engine: null, serial: null })}
            />
          )}
        </div>
      )}
      {saveError && <p role="alert" className="text-lg text-matador">{saveError}</p>}
    </section>
  );
}

// A choice that stays selected (it doesn't leave the page).
function Pick({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`w-full rounded-xl border-[3px] px-4 py-3 text-left text-lg font-bold ${on ? 'border-brand bg-brand text-white' : 'border-brand bg-white text-onyx hover:bg-white/70'}`}
    >
      {on && <span aria-hidden>✓ </span>}
      {children}
    </button>
  );
}

// After the car is known: save it to the account, or just search.
function Next({ year, body, busy, onSave, nickname, setNickname }: { year: number; body: string; busy: boolean; onSave: () => void; nickname: string; setNickname: (s: string) => void }) {
  return (
    <div className="pt-4 border-t-[3px] border-brand/20 space-y-3">
      <p className="text-xl font-bold">Your car: {yy(year)} {bodyName(body)}</p>
      <p className="text-lg">Save it to your account to keep a parts list for this car, or go straight to the parts.</p>
      <div>
        <label htmlFor="car-nickname" className="label">Give it a nickname (optional)</label>
        <input id="car-nickname" className="field" placeholder="For example: Big Red" maxLength={40} value={nickname} onChange={(e) => setNickname(e.target.value)} />
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <button type="button" className="btn-main sm:!w-auto" disabled={busy} onClick={onSave}>
          {busy ? 'Saving…' : 'Save this car to my account'}
        </button>
        <Link className="btn-plain sm:!w-auto" href={`/planner?year=${year}&body=${body}`}>No, just search</Link>
      </div>
    </div>
  );
}

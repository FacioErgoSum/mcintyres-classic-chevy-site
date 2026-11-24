'use client';
import { useState } from 'react';
import Link from 'next/link';
import { decodeVin, type VinResult } from '@/lib/vin';
import { BODIES } from '@/lib/fitment';

const bodyName = (id: string) => BODIES.find((b) => b.id === id)?.name ?? id;
const yy = (y: number) => `’${String(y).slice(-2)}`;

// "Not sure? Look it up": reads a Tri-Five serial number or cowl tag style number
// and sends the customer to the parts finder with their car filled in.
export default function VinLookup() {
  const [value, setValue] = useState('');
  const [result, setResult] = useState<VinResult | null>(null);

  return (
    <section className="space-y-4 rounded-xl border-[3px] border-brand p-5 max-w-xl" aria-labelledby="vin-h">
      <h2 id="vin-h" className="text-xl">Not sure? Look it up from your car’s numbers</h2>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          setResult(decodeVin(value));
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
        <div role="status" className="space-y-3 rounded-lg bg-brand-light p-4">
          <p className="text-xl font-bold">{result.summary}</p>
          {result.bodies.length === 1 ? (
            <Link className="btn-main" href={`/planner?year=${result.year}&body=${result.bodies[0]}`}>Show parts for my {yy(result.year)} {bodyName(result.bodies[0])}</Link>
          ) : (
            <>
              <p className="text-lg">The serial number doesn’t say the body style. Which one is it?</p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {result.bodies.map((b) => (
                  <li key={b}><Link className="choice !min-h-0 !py-3" href={`/planner?year=${result.year}&body=${b}`}><span className="choice-title !text-lg">{bodyName(b)}</span></Link></li>
                ))}
              </ul>
              <p className="text-base">Or type the cowl tag style number above and we’ll know for sure.</p>
            </>
          )}
        </div>
      )}

      {result?.kind === 'style' && (
        <div role="status" className="space-y-3 rounded-lg bg-brand-light p-4">
          <p className="text-xl font-bold">{result.summary}</p>
          {result.year ? (
            <Link className="btn-main" href={`/planner?year=${result.year}&body=${result.body}`}>Show parts for my {yy(result.year)} {bodyName(result.body)}</Link>
          ) : (
            <>
              <p className="text-lg">Which year? (It’s the two digits before the style number on the tag, like 57-.)</p>
              <ul className="flex flex-wrap gap-2">
                {[1955, 1956, 1957].map((y) => (
                  <li key={y}><Link className="btn-plain !w-auto" href={`/planner?year=${y}&body=${result.body}`}>{yy(y)}</Link></li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </section>
  );
}

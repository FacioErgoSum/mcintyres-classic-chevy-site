import Link from 'next/link';
import type { Metadata } from 'next';
import { findOtherParts } from '@/lib/catalog';
import { OTHER_LINES, lineName } from '@/lib/lines';
import PartRow from '@/components/PartRow';

export const metadata: Metadata = { title: 'Non-Tri-Five parts' };

const PAGE = 30;
type SP = Promise<{ line?: string; q?: string; show?: string }>;

// Golden Star's other vehicle lines. Not the focus of the site, but orderable.
export default async function OtherParts({ searchParams }: { searchParams: SP }) {
  const { line, q, show } = await searchParams;
  const validLine = OTHER_LINES.some((l) => l.id === line) ? line : undefined;
  const limit = Math.max(PAGE, Number(show) || PAGE);
  const browsing = validLine || q;
  const { parts, total } = browsing ? await findOtherParts({ line: validLine, q, limit }) : { parts: [], total: 0 };

  const keep = (extra: Record<string, string>) =>
    '?' + new URLSearchParams(Object.entries({ line: validLine, q, ...extra }).filter(([, v]) => v) as [string, string][]).toString();

  return (
    <div className="space-y-6">
      <h1>{validLine ? lineName(validLine) : 'Non-Tri-Five parts'}</h1>
      <p className="max-w-[60ch]">
        We specialize in ’55–’57 Chevrolets, but we can also order sheet metal and parts for these cars.
        {' '}<Link href="/planner">Looking for Tri-Five parts?</Link>
      </p>

      <form action="/other" method="get" role="search" className="space-y-3 max-w-xl">
        <label htmlFor="q" className="label">Search parts for other cars</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input id="q" name="q" defaultValue={q} placeholder="For example: ’69 Camaro quarter panel" className="field" />
          {validLine && <input type="hidden" name="line" value={validLine} />}
          <button className="btn-main sm:w-48" type="submit">Search</button>
        </div>
      </form>

      {!browsing && (
        <section className="space-y-4">
          <h2 className="text-xl">Or pick a car</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {OTHER_LINES.map((l) => (
              <li key={l.id}>
                <Link className="choice" href={`/other?line=${l.id}`}><span className="choice-title text-lg">{l.name}</span></Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {browsing && (
        <>
          <p className="text-lg font-bold" aria-live="polite">
            {total === 0 ? 'No parts match.' : total === 1 ? '1 part' : `${total.toLocaleString()} parts`}
            {validLine && <>. <Link href="/other" className="font-normal">Pick a different car</Link></>}
          </p>
          {total === 0 && (
            <p className="text-lg">Try fewer words, or <Link href="/ask">send us a message</Link> and we’ll look for it.</p>
          )}
          <ul className="space-y-4">{parts.map((p) => <PartRow key={p.handle} part={p} />)}</ul>
          {total > parts.length && (
            <Link href={keep({ show: String(limit + PAGE) })} scroll={false} className="btn-plain">
              Show {Math.min(PAGE, total - parts.length)} more parts
            </Link>
          )}
        </>
      )}
    </div>
  );
}

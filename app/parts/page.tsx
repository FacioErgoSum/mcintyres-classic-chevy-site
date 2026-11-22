import Link from 'next/link';
import type { Metadata } from 'next';
import { findParts } from '@/lib/catalog';
import { BODIES } from '@/lib/fitment';
import { areaName } from '@/lib/areas';
import PartRow from '@/components/PartRow';

export const metadata: Metadata = { title: 'Parts' };

const PAGE = 30;
type SP = Promise<{ q?: string; year?: string; body?: string; area?: string; show?: string }>;

export default async function PartsPage({ searchParams }: { searchParams: SP }) {
  const { q, year, body, area, show } = await searchParams;
  const yearNum = year ? Number(year) : undefined;
  const parts = await findParts({ q, year: yearNum, body, area });
  const limit = Math.max(PAGE, Number(show) || PAGE);
  const shown = parts.slice(0, limit);

  const bodyName = BODIES.find((b) => b.id === body)?.name.toLowerCase();
  const car = [yearNum, bodyName].filter(Boolean).join(' ');
  const heading = area ? areaName(area) : q ? `Results for “${q}”` : car ? 'Parts that fit' : 'Search parts';

  const keep = (extra: Record<string, string>) =>
    '?' + new URLSearchParams(Object.entries({ q, year, body, area, ...extra }).filter(([, v]) => v) as [string, string][]).toString();

  return (
    <div className="space-y-6">
      <h1>{heading}</h1>
      {car && (
        <p className="text-xl">
          For your <strong>{car}</strong> Chevy. <Link href="/planner">Start over with a different car</Link>
        </p>
      )}

      <form action="/parts" method="get" role="search" className="space-y-3 max-w-xl">
        <label htmlFor="q" className="label">Search by part name or number</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input id="q" name="q" defaultValue={q} placeholder="For example: floor pan, or FP13-552" className="field" />
          {year && <input type="hidden" name="year" value={year} />}
          {body && <input type="hidden" name="body" value={body} />}
          {area && <input type="hidden" name="area" value={area} />}
          <button className="btn-main sm:w-48" type="submit">Search</button>
        </div>
      </form>

      <p className="text-lg font-bold" aria-live="polite">
        {parts.length === 0 ? 'No parts match.' : parts.length === 1 ? '1 part' : `${parts.length} parts`}
      </p>

      {parts.length === 0 && (
        <div className="space-y-3 text-lg">
          <p>Try fewer words, or search the part number from your old part.</p>
          <p>Still can’t find it? <Link href="/ask">Send us a photo</Link> and we’ll find it for you.</p>
        </div>
      )}

      <ul className="space-y-4">
        {shown.map((p) => <PartRow key={p.handle} part={p} />)}
      </ul>

      {parts.length > shown.length && (
        <Link href={keep({ show: String(limit + PAGE) })} scroll={false} className="btn-plain">
          Show {Math.min(PAGE, parts.length - shown.length)} more parts
        </Link>
      )}
    </div>
  );
}

import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { BODIES, YEARS } from '@/lib/fitment';
import { AREAS } from '@/lib/areas';
import { findParts } from '@/lib/catalog';

export const metadata: Metadata = { title: 'Find parts for my car' };

type SP = Promise<{ year?: string; body?: string; area?: string }>;

const qs = (o: Record<string, string | undefined>) =>
  '?' + new URLSearchParams(Object.entries(o).filter(([, v]) => v) as [string, string][]).toString();

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-6">
      <p className="text-lg font-bold text-brand-dark">Step {n} of 3</p>
      <h1>{title}</h1>
      {children}
    </section>
  );
}

export default async function Planner({ searchParams }: { searchParams: SP }) {
  const { year, body, area } = await searchParams;

  if (!year) {
    return (
      <Step n={1} title="What year is your car?">
        <ul className="grid gap-4 max-w-lg">
          {YEARS.map((y) => (
            <li key={y}><Link className="choice" href={qs({ year: String(y) })}><span className="choice-title text-2xl">’{String(y).slice(-2)}</span></Link></li>
          ))}
          <li><Link className="choice" href={qs({ year: 'any' })}><span className="choice-title">I’m not sure</span><span className="choice-note">Show parts for all three years</span></Link></li>
        </ul>
      </Step>
    );
  }

  const yearNum = year === 'any' ? undefined : Number(year);
  const yearText = yearNum ? `’${String(yearNum).slice(-2)}` : '’55–’57';

  if (!body) {
    const bodies = BODIES.filter((b) => !(b.id === '4-door-hardtop' && yearNum === 1955));
    return (
      <Step n={2} title={`What kind of ${yearText} Chevy is it?`}>
        <ul className="grid gap-4 max-w-lg">
          {bodies.map((b) => (
            <li key={b.id}>
              <Link className="choice" href={qs({ year, body: b.id })}>
                <span className="choice-title">{b.name}</span>
                {b.note && <span className="choice-note">{b.note}</span>}
              </Link>
            </li>
          ))}
          <li><Link className="choice" href={qs({ year, body: 'any' })}><span className="choice-title">I’m not sure</span><span className="choice-note">Show parts for every body style</span></Link></li>
        </ul>
        <p><Link href="/planner">Change the year</Link></p>
      </Step>
    );
  }

  const bodyId = body === 'any' ? undefined : body;
  const bodyName = BODIES.find((b) => b.id === bodyId)?.name.toLowerCase() ?? 'Chevy';

  if (!area) {
    const fitting = await findParts({ year: yearNum, body: bodyId });
    return (
      <Step n={3} title="What part of the car are you working on?">
        <p className="text-xl">Your car: <strong>{yearText} {bodyName}</strong>. <Link href={qs({ year })}>Change</Link></p>
        <ul className="grid gap-4 max-w-xl">
          {AREAS.map((a) => {
            const n = fitting.filter((p) => p.areas.includes(a.id)).length;
            if (!n) return null;
            return (
              <li key={a.id}>
                <Link className="choice" href={qs({ year, body, area: a.id })}>
                  <span className="choice-title">{a.name}</span>
                  <span className="choice-note">{a.hint}. {n} {n === 1 ? 'part' : 'parts'}.</span>
                </Link>
              </li>
            );
          })}
          <li><Link className="choice" href={qs({ year, body, area: 'all' })}><span className="choice-title">Show me everything</span><span className="choice-note">All {fitting.length} parts that fit this car</span></Link></li>
        </ul>
      </Step>
    );
  }

  redirect('/parts' + qs({ year: yearNum ? String(yearNum) : undefined, body: bodyId, area: area === 'all' ? undefined : area }));
}

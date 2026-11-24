// A project car on a list. Everything is optional except the year.
// nickname is the customer's own name for it, like "Big Red".
// Safe in the browser and on the server.
import { BODIES, fits, type Fitment } from './fitment';

export type Car = {
  year: number | null;
  body: string | null;
  series: string | null;
  engine: string | null;
  serial: string | null;
  nickname?: string | null;
};

/** Columns on the wishlists table. */
export const CAR_COLUMNS = 'car_year, car_body, car_series, car_engine, car_serial, car_nickname';
type Row = { car_year?: number | null; car_body?: string | null; car_series?: string | null; car_engine?: string | null; car_serial?: string | null; car_nickname?: string | null };

export const carFromRow = (r: Row): Car | null =>
  r.car_year ? { year: r.car_year, body: r.car_body ?? null, series: r.car_series ?? null, engine: r.car_engine ?? null, serial: r.car_serial ?? null, nickname: r.car_nickname ?? null } : null;

export const carToRow = (c: Car | null) => ({
  car_year: c?.year ?? null,
  car_body: c?.body ?? null,
  car_series: c?.series ?? null,
  car_engine: c?.engine ?? null,
  car_serial: c?.serial ?? null,
  car_nickname: c?.nickname?.trim().slice(0, 40) || null,
});

/** "’56 Chevy 210 2-door hardtop" */
export function carLabel(c: Car): string {
  const yy = c.year ? `’${String(c.year).slice(-2)}` : '';
  const body = BODIES.find((b) => b.id === c.body)?.name;
  const series = c.series && c.series !== 'Sedan Delivery' ? c.series : '';
  return [yy, 'Chevy', series, body ?? (c.series === 'Sedan Delivery' ? 'sedan delivery' : '')].filter(Boolean).join(' ');
}

/** The nickname if there is one, otherwise "’56 Chevy 210 2-door hardtop". */
export const carName = (c: Car) => c.nickname?.trim() || carLabel(c);

/** For sentences: "Big Red (’57 Chevy Bel Air)" or "the ’57 Chevy Bel Air". */
export const carMention = (c: Car) => (c.nickname?.trim() ? `${c.nickname.trim()} (${carLabel(c)})` : `the ${carLabel(c)}`);

/** Parts finder link for this car. */
export const carFinderHref = (c: Car) => `/planner?year=${c.year}${c.body ? `&body=${c.body}` : ''}`;

/** False only when we know the part doesn't fit this car. */
export const partFitsCar = (f: Fitment, c: Car | null) => !c || fits(f, c.year ?? undefined, c.body ?? undefined);

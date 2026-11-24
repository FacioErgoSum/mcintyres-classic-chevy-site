'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase/client';
import { CAR_COLUMNS, carFinderHref, carFromRow, carLabel, carName, type Car } from '@/lib/cars';

// Parts finder shortcut for signed-in customers: one tap per saved project car.
export default function MyCars() {
  const [cars, setCars] = useState<{ id: string; name: string; car: Car }[]>([]);
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    const sb = supabaseBrowser();
    sb.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: rows } = await sb.from('wishlists').select(`id, name, ${CAR_COLUMNS}`).not('car_year', 'is', null).order('created_at');
      setCars(((rows || []) as ({ id: string; name: string } & Parameters<typeof carFromRow>[0])[]).map((r) => ({ id: r.id, name: r.name, car: carFromRow(r)! })));
    });
  }, []);
  if (!cars.length) return null;
  return (
    <section className="space-y-3 rounded-xl bg-brand-light p-4 max-w-xl" aria-labelledby="mycars-h">
      <h2 id="mycars-h" className="text-xl">Your cars</h2>
      <ul className="grid gap-2">
        {cars.map(({ id, name, car }) => (
          <li key={id}>
            <Link className="choice !min-h-0 !py-3" href={carFinderHref(car)}>
              <span className="choice-title !text-lg">{carName(car)}</span>
              {car.nickname && <span className="choice-note">{carLabel(car)}</span>}
              {name !== carName(car) && name !== carLabel(car) && <span className="choice-note">List: {name}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

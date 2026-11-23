import type { Metadata } from 'next';
import Link from 'next/link';
import { allMerch } from '@/lib/merch';
import { money } from '@/lib/catalog';
import Img from '@/components/Img';

export const metadata: Metadata = { title: 'Merch' };
export const revalidate = 600;

export default async function MerchPage() {
  const items = await allMerch();
  return (
    <div className="space-y-6">
      <h1>McIntyre’s merch</h1>
      {items.length ? (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {items.map((m) => (
            <li key={m.handle}>
              <Link
                href={`/merch/${m.handle}`}
                className="no-underline flex h-full flex-col gap-2 rounded-xl border-[3px] border-onyx/10 bg-white p-3 hover:border-brand focus-visible:border-brand"
              >
                <span className="aspect-square w-full rounded-lg bg-ivory overflow-hidden flex items-center justify-center">
                  {m.images[0] ? (
                    <Img srcs={[m.images[0]]} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-base text-onyx/60">Photo coming</span>
                  )}
                </span>
                <span className="text-lg font-bold leading-snug underline decoration-brand underline-offset-4">{m.name}</span>
                <span className="mt-auto text-xl font-bold">{money(m.price)}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-lg">New merch is on the way.</p>
      )}
    </div>
  );
}

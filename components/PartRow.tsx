import Link from 'next/link';
import type { Part } from '@/lib/catalog';
import { money } from '@/lib/catalog';
import { describeFitment } from '@/lib/fitment';
import { lineName } from '@/lib/lines';
import Img from './Img';

// Name across the full width first, so long Golden Star titles stay readable
// on a phone; photo, price and fit underneath.
export default function PartRow({ part }: { part: Part }) {
  return (
    <li>
      <Link href={`/parts/${part.handle}`} className="block rounded-xl border-[3px] border-onyx/15 bg-white p-4 no-underline text-onyx hover:border-brand hover:text-onyx">
        <span className="block text-xl font-bold leading-snug underline decoration-2 underline-offset-4 decoration-brand">{part.name}</span>
        <span className="mt-3 flex gap-4 items-center">
          <span className="shrink-0 w-28 h-28 sm:w-32 sm:h-32 rounded-lg bg-ivory overflow-hidden flex items-center justify-center">
            <Img srcs={[part.images[0]?.thumb, part.images[0]?.original]} alt="" className="w-full h-full object-contain" />
          </span>
          <span className="min-w-0">
            <span className="block text-2xl font-bold">{money(part.price)}</span>
            <span className="block text-base text-onyx/80 mt-1">{part.triFive ? `Fits ${describeFitment(part.fitment)}` : `For ${lineName(part.line)}`}</span>
            {part.mcintyreMade && <span className="inline-block mt-2 rounded-md bg-matador px-3 py-1 text-base font-bold text-white">Made by McIntyre’s</span>}
            {part.stock.status === 'out' && <span className="inline-block mt-2 rounded-md bg-onyx px-3 py-1 text-base font-bold text-white">Out of stock</span>}
          </span>
        </span>
      </Link>
    </li>
  );
}

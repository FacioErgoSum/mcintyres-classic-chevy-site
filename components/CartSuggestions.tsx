'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { addToCart } from '@/lib/cart';
import Img from './Img';

type Suggestion = { handle: string; name: string; price: number; freight: boolean; mcintyreMade: boolean; maxQty?: number; images: string[]; reason: string };
const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: Number.isInteger(n) ? 0 : 2 });

// "Add these to your order": the other side, McIntyre-Made parts and the
// small parts that go with the job. One tap adds it to the cart.
export default function CartSuggestions({ handles }: { handles: string[] }) {
  const [items, setItems] = useState<Suggestion[]>([]);
  const key = [...handles].sort().join(',');

  useEffect(() => {
    if (!key) return setItems([]);
    let live = true;
    fetch('/api/recommend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ handles: key.split(',') }) })
      .then((r) => r.json())
      .then((d) => live && setItems(d.suggestions || []))
      .catch(() => live && setItems([]));
    return () => { live = false; };
  }, [key]);

  if (!items.length) return null;
  return (
    <section className="space-y-4 rounded-xl bg-brand-light p-4 sm:p-5" aria-labelledby="suggest-heading">
      <h2 id="suggest-heading" className="text-xl">You might also need</h2>
      <ul className="grid grid-cols-2 gap-3">
        {items.slice(0, 4).map((s) => (
          <li key={s.handle} className="rounded-xl bg-white border-[3px] border-onyx/10 p-3 flex flex-col gap-2">
            <span className="aspect-square w-full rounded-lg bg-ivory overflow-hidden flex items-center justify-center">
              <Img srcs={s.images} alt="" className="w-full h-full object-contain" />
            </span>
            <Link href={`/parts/${s.handle}`} className="text-base font-bold leading-snug">{s.name}</Link>
            <p className="text-xl font-bold mt-auto">{money(s.price)}</p>
            <button
              type="button"
              className="btn-main !min-h-[52px] !py-2 !px-2 !text-base whitespace-nowrap"
              onClick={() => addToCart({ handle: s.handle, name: s.name, price: s.price, images: s.images, freight: s.freight, maxQty: s.maxQty })}
            >
              Add to order
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

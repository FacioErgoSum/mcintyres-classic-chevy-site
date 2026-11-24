'use client';
import { useState } from 'react';
import Link from 'next/link';
import { addToCart } from '@/lib/cart';
import type { ListPart } from '@/lib/lists';
import Img from '@/components/Img';

const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: Number.isInteger(n) ? 0 : 2 });

// The parts on a list, with "Add all to cart". onQty is given only to the owner.
export default function ListItems({ items, onQty }: { items: ListPart[]; onQty?: (handle: string, qty: number) => void }) {
  const [added, setAdded] = useState<string | null>(null);
  const buyable = items.filter((i) => i.part && i.part.stock.status !== 'out');
  const total = buyable.reduce((s, i) => s + i.part!.price * Math.min(i.qty, i.part!.stock.maxQty), 0);

  function addAll() {
    for (const i of buyable) {
      const p = i.part!;
      addToCart({ handle: i.handle, name: p.name, price: p.price, images: p.images, freight: p.freight, maxQty: p.stock.status === 'in' ? p.stock.maxQty : undefined }, i.qty);
    }
    const skipped = items.length - buyable.length;
    setAdded(`Added ${buyable.length} ${buyable.length === 1 ? 'part' : 'parts'} to the cart.${skipped ? ` ${skipped} out of stock or no longer sold, so left out.` : ''}`);
  }

  return (
    <section className="space-y-5" aria-label="Parts on this list">
      <ul className="space-y-3">
        {items.map((i) => (
          <li key={i.handle} className="rounded-xl border-[3px] border-onyx/15 bg-white p-4 space-y-3">
            <div className="flex gap-4">
              <span className="w-24 h-24 rounded-lg bg-ivory shrink-0 overflow-hidden flex items-center justify-center">
                <Img srcs={i.part?.images || []} alt="" className="w-full h-full object-contain" />
              </span>
              <div className="min-w-0 space-y-1">
                {i.part ? <Link href={`/parts/${i.handle}`} className="text-xl font-bold leading-snug">{i.part.name}</Link> : <p className="text-xl font-bold">No longer sold</p>}
                {i.part && <p className="text-lg">{money(i.part.price)} each{!onQty && i.qty > 1 ? ` · wants ${i.qty}` : ''}</p>}
                {i.part?.stock.status === 'out' && <p className="inline-block rounded-md bg-onyx px-3 py-1 text-base font-bold text-white">Out of stock</p>}
              </div>
            </div>
            {onQty && (
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" className="btn-plain !w-16 !px-0 text-2xl" aria-label={`One fewer ${i.part?.name || ''}`} onClick={() => onQty(i.handle, i.qty - 1)}>−</button>
                <span className="w-12 text-center text-2xl font-bold">{i.qty}</span>
                <button type="button" className="btn-plain !w-16 !px-0 text-2xl" aria-label={`One more ${i.part?.name || ''}`} onClick={() => onQty(i.handle, Math.min(50, i.qty + 1))}>+</button>
                <button type="button" className="btn-plain !w-auto" onClick={() => onQty(i.handle, 0)}>Remove</button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {buyable.length > 0 && (
        <div className="space-y-3">
          <p className="text-xl"><strong>{money(total)}</strong> for everything in stock, before shipping.</p>
          <button type="button" className="btn-buy text-xl sm:min-w-[18rem]" onClick={addAll}>Add all to cart</button>
          {added && <p role="status" className="text-lg rounded-lg bg-brand-light p-4">{added} <Link href="/cart">Go to cart</Link></p>}
        </div>
      )}
    </section>
  );
}

'use client';
import { useState } from 'react';
import Link from 'next/link';
import { addToCart, type CartLine } from '@/lib/cart';

// maxQty: the most this customer can order (Golden Star's stock less a cushion).
export default function AddToCart({ line, maxQty }: { line: Omit<CartLine, 'qty' | 'maxQty'>; maxQty?: number }) {
  const max = maxQty ?? Infinity;
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState<number | null>(null);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="text-lg font-bold" id="qty-label">How many?</span>
        <div className="flex items-center gap-2" role="group" aria-labelledby="qty-label">
          <button type="button" className="btn-plain !w-16 !px-0 text-2xl" aria-label="One fewer" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
          <span className="w-12 text-center text-2xl font-bold" aria-live="polite">{qty}</span>
          <button type="button" className="btn-plain !w-16 !px-0 text-2xl" aria-label="One more" disabled={qty >= max} onClick={() => setQty((q) => Math.min(max, q + 1))}>+</button>
        </div>
      </div>
      {Number.isFinite(max) && qty >= max && (
        <p className="text-lg">That’s as many as we can promise right now. <Link href={`/ask?part=${encodeURIComponent(line.handle)}`}>Ask us</Link> if you need more.</p>
      )}
      <button type="button" className="btn-buy text-xl sm:w-auto sm:min-w-[18rem]" onClick={() => setAdded(addToCart({ ...line, maxQty }, qty))}>
        Add to cart
      </button>
      {added != null && (
        <p className="text-lg rounded-lg bg-brand-light p-4" role="status">
          {added < qty ? `You have ${added} in your cart, the most we can promise right now. ` : 'Added to your cart. '}
          <Link href="/cart">Go to cart and check out</Link>
        </p>
      )}
    </div>
  );
}

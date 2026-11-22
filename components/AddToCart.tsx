'use client';
import { useState } from 'react';
import Link from 'next/link';
import { addToCart, type CartLine } from '@/lib/cart';

export default function AddToCart({ line }: { line: Omit<CartLine, 'qty'> }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="text-lg font-bold" id="qty-label">How many?</span>
        <div className="flex items-center gap-2" role="group" aria-labelledby="qty-label">
          <button type="button" className="btn-plain !w-16 !px-0 text-2xl" aria-label="One fewer" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
          <span className="w-12 text-center text-2xl font-bold" aria-live="polite">{qty}</span>
          <button type="button" className="btn-plain !w-16 !px-0 text-2xl" aria-label="One more" onClick={() => setQty((q) => q + 1)}>+</button>
        </div>
      </div>
      <button type="button" className="btn-buy text-xl sm:w-auto sm:min-w-[18rem]" onClick={() => { addToCart(line, qty); setAdded(true); }}>
        Add to cart
      </button>
      {added && (
        <p className="text-lg rounded-lg bg-brand-light p-4" role="status">
          Added to your cart. <Link href="/cart">Go to cart and check out</Link>
        </p>
      )}
    </div>
  );
}

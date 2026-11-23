'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { setQty, useCart } from '@/lib/cart';
import { shippingFor } from '@/lib/shipping';
import Img from '@/components/Img';
import CartSuggestions from '@/components/CartSuggestions';

const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: Number.isInteger(n) ? 0 : 2 });

export default function CartPage() {
  const saved = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fresh, setFresh] = useState<Record<string, { name: string; price: number; freight: boolean }>>({});

  // The cart is saved in the browser; check today's prices and shipping with the store.
  const key = saved.map((l) => l.handle).sort().join(',');
  useEffect(() => {
    if (!key) return;
    let live = true;
    fetch('/api/cart-check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ handles: key.split(',') }) })
      .then((r) => r.json())
      .then((d) => live && setFresh(d.parts || {}))
      .catch(() => {});
    return () => { live = false; };
  }, [key]);
  const lines = saved.map((l) => (fresh[l.handle] ? { ...l, ...fresh[l.handle] } : l));

  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const ship = shippingFor(lines.map((l) => l.freight));

  async function checkout() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: lines.map((l) => ({ handle: l.handle, qty: l.qty })) }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Checkout is not available right now.');
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout is not available right now.');
      setBusy(false);
    }
  }

  if (!lines.length) {
    return (
      <div className="space-y-6">
        <h1>Your cart is empty</h1>
        <Link href="/planner" className="btn-main">Find parts for my car</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1>Your cart</h1>
      <ul className="space-y-4">
        {lines.map((l) => (
          <li key={l.handle} className="rounded-xl border-[3px] border-onyx/15 p-4 space-y-3">
            <div className="flex gap-4">
              <span className="w-24 h-24 rounded-lg bg-ivory shrink-0 overflow-hidden flex items-center justify-center">
                <Img srcs={l.images?.length ? l.images : l.image ? [l.image, l.image.replace(/-thumb\.webp$/, '.jpg'), l.image.replace(/-thumb\.webp$/, '.png')] : []} alt="" className="w-full h-full object-contain" />
              </span>
              <div>
                <Link href={`/parts/${l.handle}`} className="text-xl font-bold">{l.name}</Link>
                <p className="text-lg">{money(l.price)} each</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className="btn-plain !w-16 !px-0 text-2xl" aria-label={`One fewer ${l.name}`} onClick={() => setQty(l.handle, l.qty - 1)}>−</button>
              <span className="w-12 text-center text-2xl font-bold">{l.qty}</span>
              <button type="button" className="btn-plain !w-16 !px-0 text-2xl" aria-label={`One more ${l.name}`} onClick={() => setQty(l.handle, l.qty + 1)}>+</button>
              <button type="button" className="btn-plain !w-auto" onClick={() => setQty(l.handle, 0)}>Remove</button>
            </div>
          </li>
        ))}
      </ul>

      <CartSuggestions handles={lines.map((l) => l.handle)} />

      <dl className="text-xl space-y-2 max-w-md">
        <div className="flex justify-between"><dt>Parts</dt><dd>{money(subtotal)}</dd></div>
        <div className="flex justify-between gap-4"><dt>{ship.label}</dt><dd>{money(ship.amount)}</dd></div>
        <div className="flex justify-between font-bold text-2xl border-t-[3px] border-onyx pt-2"><dt>Total</dt><dd>{money(subtotal + ship.amount)}</dd></div>
      </dl>
      <p className="text-lg text-onyx/80">Sales tax, if any, is added at checkout.</p>

      {error && <p role="alert" className="rounded-lg bg-matador/10 border-[3px] border-matador p-4 text-lg">{error}</p>}
      <button type="button" className="btn-buy text-xl sm:min-w-[18rem]" disabled={busy} onClick={checkout}>
        {busy ? 'Opening secure checkout…' : 'Check out'}
      </button>
      <p className="text-lg">You’ll pay on a secure Stripe page. We order your parts as soon as payment goes through.</p>
    </div>
  );
}

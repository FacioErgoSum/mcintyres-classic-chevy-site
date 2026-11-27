'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { setQty, useCart } from '@/lib/cart';
import { shippingForOrder } from '@/lib/shipping';
import Img from '@/components/Img';
import CartSuggestions from '@/components/CartSuggestions';
import type { CartCheck } from '@/app/api/cart-check/route';

const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: Number.isInteger(n) ? 0 : 2 });

export default function CartPage() {
  const saved = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fresh, setFresh] = useState<Record<string, CartCheck>>({});

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
  const isMerch = (l: (typeof lines)[number]) => l.handle.startsWith('merch:');
  // Parts with no stock limit (McIntyre Made) have a large maxQty; out of stock is 0.
  const outOfStock = lines.filter((l) => !isMerch(l) && l.maxQty === 0);
  const overLimit = lines.filter((l) => !isMerch(l) && l.maxQty != null && l.maxQty > 0 && l.qty > l.maxQty);
  const ship = shippingForOrder({
    parts: lines.filter((l) => !isMerch(l)).map((l) => ({ freight: l.freight, qty: l.qty, goldenStar: fresh[l.handle]?.goldenStar ?? !l.handle.startsWith('mcintyre-') })),
    mailerMerch: lines.filter((l) => isMerch(l) && l.kind !== 'printed').length,
    printedMerch: lines.filter((l) => isMerch(l) && l.kind === 'printed').length,
  });

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
                <Link href={l.href || `/parts/${l.handle}`} className="text-xl font-bold">{l.name}</Link>
                <p className="text-lg">{money(l.price)} each</p>
                {l.maxQty === 0 && <p className="inline-block mt-1 rounded-md bg-onyx px-3 py-1 text-base font-bold text-white">Out of stock</p>}
              </div>
            </div>
            {l.maxQty === 0 ? (
              <p className="text-lg">This part sold out since you added it. Please remove it to check out.</p>
            ) : l.maxQty != null && l.qty > l.maxQty ? (
              <p className="text-lg">We can only promise {l.maxQty} of these right now. Please lower the number to check out.</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className="btn-plain !w-16 !px-0 text-2xl" aria-label={`One fewer ${l.name}`} onClick={() => setQty(l.handle, l.qty - 1)}>−</button>
              <span className="w-12 text-center text-2xl font-bold">{l.qty}</span>
              <button type="button" className="btn-plain !w-16 !px-0 text-2xl" aria-label={`One more ${l.name}`} disabled={l.maxQty != null && l.qty >= l.maxQty} onClick={() => setQty(l.handle, l.qty + 1)}>+</button>
              <button type="button" className="btn-plain !w-auto" onClick={() => setQty(l.handle, 0)}>Remove</button>
            </div>
          </li>
        ))}
      </ul>

      <CartSuggestions handles={lines.filter((l) => !isMerch(l)).map((l) => l.handle)} />

      <dl className="text-xl space-y-2 max-w-md">
        <div className="flex justify-between"><dt>Items</dt><dd>{money(subtotal)}</dd></div>
        {ship.lines.map((s) => (
          <div key={s.label} className="flex justify-between gap-4"><dt>{s.label}</dt><dd>{money(s.amount)}</dd></div>
        ))}
        <div className="flex justify-between font-bold text-2xl border-t-[3px] border-onyx pt-2"><dt>Total</dt><dd>{money(subtotal + ship.amount)}</dd></div>
      </dl>
      {process.env.NEXT_PUBLIC_STRIPE_TAX === 'on' && <p className="text-lg text-onyx/80">Sales tax is added at checkout.</p>}

      {error && <p role="alert" className="rounded-lg bg-matador/10 border-[3px] border-matador p-4 text-lg">{error}</p>}
      {(outOfStock.length > 0 || overLimit.length > 0) && (
        <div role="alert" className="rounded-lg bg-matador/10 border-[3px] border-matador p-4 text-lg space-y-1">
          <p className="font-bold">Before you can check out:</p>
          <ul className="list-disc pl-6">
            {outOfStock.map((l) => <li key={l.handle}>Remove <strong>{l.name}</strong>. It sold out.</li>)}
            {overLimit.map((l) => <li key={l.handle}>Lower <strong>{l.name}</strong> to {l.maxQty} or fewer.</li>)}
          </ul>
        </div>
      )}
      <button type="button" className="btn-buy text-xl sm:min-w-[18rem]" disabled={busy || outOfStock.length > 0 || overLimit.length > 0} onClick={checkout}>
        {busy ? 'Opening secure checkout…' : 'Check out'}
      </button>
      <p className="text-lg">You’ll pay on a secure Stripe page. We order your parts as soon as payment goes through.</p>
      <p className="text-lg">
        Freight orders: please check every box before you sign for it. <Link href="/shipping-returns">Shipping and returns</Link>
      </p>
    </div>
  );
}

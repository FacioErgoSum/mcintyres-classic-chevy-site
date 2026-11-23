'use client';
import { useState } from 'react';
import Link from 'next/link';
import { addToCart } from '@/lib/cart';

type Props = {
  handle: string;
  name: string;
  price: number;
  images: string[];
  kind: 'mailer' | 'printed';
  options: { label: string; price?: number | null }[];
};

export default function MerchBuy({ handle, name, price, images, kind, options }: Props) {
  const [size, setSize] = useState<string | null>(options.length === 1 ? options[0].label : null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [needSize, setNeedSize] = useState(false);

  // "Size", "Color" or "Color and size", depending on what the options are
  const sizeLike = (l: string) => /^(XXS|XS|S|M|L|XL|\dXL|One size|\d+(\.\d+)?″?["x×]?.*)$/i.test(l.trim());
  const both = options.some((o) => o.label.includes(' / '));
  const legend = both ? 'Color and size' : options.every((o) => sizeLike(o.label)) ? 'Size' : 'Color';
  const pickMsg = both ? 'Pick a color and size' : `Pick a ${legend.toLowerCase()}`;

  function add() {
    if (options.length && !size) return setNeedSize(true);
    const opt = options.find((o) => o.label === size);
    addToCart(
      {
        handle: `merch:${handle}:${size ?? ''}`,
        name: size && options.length > 1 ? `${name} (${size})` : name,
        price: opt?.price ?? price,
        images,
        freight: false,
        href: `/merch/${handle}`,
        kind,
      },
      qty,
    );
    setAdded(true);
  }

  return (
    <div className="space-y-5">
      {options.length > 1 && (
        <fieldset className="space-y-3">
          <legend className="text-lg font-bold">{legend}</legend>
          <div className="flex flex-wrap gap-2">
            {options.map((o) => (
              <button
                key={o.label}
                type="button"
                aria-pressed={size === o.label}
                onClick={() => { setSize(o.label); setNeedSize(false); }}
                className={`min-w-[64px] min-h-[52px] rounded-lg border-[3px] px-4 text-lg font-bold ${size === o.label ? 'border-brand bg-brand text-white' : 'border-onyx/30 bg-white'}`}
              >
                {o.label}
              </button>
            ))}
          </div>
          {needSize && <p role="alert" className="text-lg font-bold text-matador">{pickMsg}</p>}
        </fieldset>
      )}
      <div className="flex items-center gap-4">
        <span className="text-lg font-bold" id="qty-label">How many?</span>
        <div className="flex items-center gap-2" role="group" aria-labelledby="qty-label">
          <button type="button" className="btn-plain !w-16 !px-0 text-2xl" aria-label="One fewer" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
          <span className="w-12 text-center text-2xl font-bold" aria-live="polite">{qty}</span>
          <button type="button" className="btn-plain !w-16 !px-0 text-2xl" aria-label="One more" onClick={() => setQty((q) => q + 1)}>+</button>
        </div>
      </div>
      <button type="button" className="btn-buy text-xl sm:w-auto sm:min-w-[18rem]" onClick={add}>
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

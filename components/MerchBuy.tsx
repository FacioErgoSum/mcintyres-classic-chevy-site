'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { addToCart } from '@/lib/cart';

const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: Number.isInteger(n) ? 0 : 2 });

type Option = { label: string; price?: number | null; color_hex?: string | null };
type Props = {
  handle: string;
  name: string;
  price: number;
  images: string[];
  kind: 'mailer' | 'printed';
  options: Option[];
};

// Printful's garment-dyed colors start with "G. Dyed"; shoppers don't need that.
const pretty = (c: string) => c.replace(/^G\.\s*Dyed\s+/i, '').trim();

// Used until the merch sync has saved Printful's own color codes.
const FALLBACK_HEX: Record<string, string> = {
  black: '#1f1f1f', 'black rock': '#2a2a2a', anthracite: '#4a4a4a', 'deep teal': '#4a5d74',
  'green bay': '#6f8a7d', 'kaffa coffee': '#7a5a4a', white: '#ffffff', navy: '#22304a',
};
const hexFor = (color: string, given?: string | null) =>
  given || FALLBACK_HEX[pretty(color).toLowerCase()] || '#b8b2a7';

const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
const sizeRank = (s: string) => {
  const i = SIZE_ORDER.indexOf(s.toUpperCase());
  return i < 0 ? 99 : i;
};
const sizeLike = (l: string) => /^(XXS|XS|S|M|L|XL|\dXL|One size|\d+(\.\d+)?″?["x×]?.*)$/i.test(l.trim());

export default function MerchBuy({ handle, name, price, images, kind, options }: Props) {
  // Split "Color / Size" labels into two pickers.
  const split = options.length > 1 && options.every((o) => o.label.includes(' / '));
  const parsed = useMemo(
    () =>
      options.map((o) => {
        if (!split) return { ...o, color: null as string | null, size: o.label };
        const i = o.label.lastIndexOf(' / ');
        return { ...o, color: o.label.slice(0, i), size: o.label.slice(i + 3) };
      }),
    [options, split],
  );
  const colors = useMemo(() => {
    const seen = new Map<string, string>();
    for (const o of parsed) if (o.color && !seen.has(o.color)) seen.set(o.color, hexFor(o.color, o.color_hex));
    return [...seen].map(([color, hex]) => ({ color, hex }));
  }, [parsed]);
  const sizes = useMemo(
    () => [...new Set(parsed.map((o) => o.size))].sort((a, b) => sizeRank(a) - sizeRank(b)),
    [parsed],
  );

  const onlyColor = !split && options.length > 1 && !options.every((o) => sizeLike(o.label));
  const [color, setColor] = useState<string | null>(colors.length === 1 ? colors[0].color : null);
  const [size, setSize] = useState<string | null>(options.length === 1 ? options[0].label : sizes.length === 1 && split ? sizes[0] : null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [missing, setMissing] = useState<string | null>(null);

  const chosen = split
    ? parsed.find((o) => o.color === color && o.size === size) || null
    : parsed.find((o) => o.label === size) || null;
  const hasSize = (s: string) => !split || !color || parsed.some((o) => o.color === color && o.size === s);
  const unitPrice = chosen?.price ?? price;

  function pickColor(c: string) {
    setColor(c);
    setMissing(null);
    if (size && !parsed.some((o) => o.color === c && o.size === size)) setSize(null);
  }

  function add() {
    if (options.length) {
      if (split && !color) return setMissing('Pick a color');
      if (!size) return setMissing(onlyColor ? 'Pick a color' : 'Pick a size');
      if (!chosen) return setMissing('That size isn’t made in this color');
    }
    const label = chosen?.label ?? '';
    const shown = split && chosen ? `${pretty(chosen.color!)} / ${chosen.size}` : label;
    addToCart(
      {
        handle: `merch:${handle}:${label}`,
        name: label && options.length > 1 ? `${name} (${shown})` : name,
        price: unitPrice,
        images,
        freight: false,
        href: `/merch/${handle}`,
        kind,
      },
      qty,
    );
    setAdded(true);
  }

  const chip = (on: boolean, disabled = false) =>
    `min-w-[64px] min-h-[52px] rounded-lg border-[3px] px-4 text-lg font-bold ${
      on ? 'border-brand bg-brand text-white' : disabled ? 'border-onyx/15 bg-white text-onyx/35 line-through' : 'border-onyx/30 bg-white'
    }`;

  return (
    <div className="space-y-6">
      {split && colors.length > 1 && (
        <fieldset className="space-y-3">
          <legend className="text-lg font-bold">
            Color{color && <span className="font-normal">: {pretty(color)}</span>}
          </legend>
          <div className="flex flex-wrap gap-3">
            {colors.map(({ color: c, hex }) => (
              <button
                key={c}
                type="button"
                title={pretty(c)}
                aria-label={pretty(c)}
                aria-pressed={color === c}
                onClick={() => pickColor(c)}
                className={`h-12 w-12 rounded-full border-2 border-onyx/25 ${color === c ? 'ring-[3px] ring-brand ring-offset-2' : 'hover:ring-2 hover:ring-onyx/30 hover:ring-offset-2'}`}
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
        </fieldset>
      )}

      {options.length > 1 && (
        <fieldset className="space-y-3">
          <legend className="text-lg font-bold">{onlyColor ? 'Color' : 'Size'}</legend>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => {
              const ok = hasSize(s);
              return (
                <button
                  key={s}
                  type="button"
                  disabled={!ok}
                  aria-pressed={size === s}
                  onClick={() => { setSize(s); setMissing(null); }}
                  className={chip(size === s, !ok)}
                >
                  {split ? s : pretty(s)}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {missing && <p role="alert" className="text-lg font-bold text-matador">{missing}</p>}

      {chosen && chosen.price != null && chosen.price !== price && (
        <p className="text-lg font-bold">{money(unitPrice)} for this size</p>
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

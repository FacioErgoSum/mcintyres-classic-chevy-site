'use client';
import { useState } from 'react';
import Gallery from './Gallery';
import MerchBuy, { colorsOf, colorSlug, photosForColor } from './MerchBuy';

type Props = React.ComponentProps<typeof MerchBuy> & {
  /** Shown between the photos and the color/size pickers (price, shipping). */
  children?: React.ReactNode;
};

// Photos + buy box for one merch item. Clicking a color swaps the photos to that
// color's (files named like /merch/<item>/<color>-front.webp).
export default function MerchShop({ children, ...buy }: Props) {
  const colors = colorsOf(buy.options);
  // The default color is the one in the main photo (e.g. kaffa-coffee-front-back.webp), already picked.
  const firstFile = buy.images[0]?.split('/').pop() || '';
  const defaultColor = colors.length === 1 ? colors[0] : colors.find((c) => firstFile.startsWith(colorSlug(c) + '-')) ?? null;
  const [color, setColor] = useState<string | null>(defaultColor);
  const shown = color;
  const photos = photosForColor(buy.images, shown).map((u) => ({ thumb: u, large: u, original: u }));

  return (
    <>
      <Gallery key={shown ?? 'all'} photos={photos} name={buy.name} />
      {children}
      <MerchBuy {...buy} color={color} onColorChange={setColor} />
    </>
  );
}

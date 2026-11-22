'use client';
import { useState } from 'react';

// Shows the first image that loads: the small compressed copy first, then the
// original if the copy hasn't been made yet. Hides itself if none load.
export default function Img({ srcs, alt, className, eager = false }: { srcs: string[]; alt: string; className?: string; eager?: boolean }) {
  const list = srcs.filter(Boolean);
  const [i, setI] = useState(0);
  if (i >= list.length) return <span className="text-base text-onyx/60 text-center px-2">Photo coming</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={list[i]}
      alt={alt}
      className={className}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={eager ? 'high' : 'auto'}
      onError={() => setI((n) => n + 1)}
    />
  );
}

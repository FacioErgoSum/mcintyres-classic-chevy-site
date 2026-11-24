'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { Slide } from '@/lib/slides';

const SECONDS = 6;

// Auto-rotating banner. Pauses while the pointer or keyboard focus is on it,
// has a Pause button (people who read slowly need it), and doesn't move at all
// for visitors whose device asks for reduced motion.
export default function Slideshow({ slides }: { slides: Slide[] }) {
  const [at, setAt] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const n = slides.length;

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setPaused(true);
  }, []);
  useEffect(() => {
    if (n < 2 || paused || hover) return;
    const t = setTimeout(() => setAt((i) => (i + 1) % n), SECONDS * 1000);
    return () => clearTimeout(t);
  }, [at, n, paused, hover]);

  if (!n) return null;
  const go = (i: number) => setAt((i + n) % n);

  return (
    <section aria-roledescription="carousel" aria-label="What’s new at McIntyre’s" className="-mx-4 sm:mx-0 space-y-3">
      <div
        ref={box}
        className="relative overflow-hidden sm:rounded-xl bg-onyx aspect-[1600/838]"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={(e) => !box.current?.contains(e.relatedTarget as Node) && setHover(false)}
      >
        {slides.map((s, i) => (
          <Link
            key={s.href + s.image}
            href={s.href}
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${n}: ${s.title || s.alt}`}
            aria-hidden={i !== at}
            tabIndex={i === at ? 0 : -1}
            className={`absolute inset-0 block no-underline text-white transition-opacity duration-700 ${i === at ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none'}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={s.image}
              srcSet={s.imageLarge ? `${s.image} 800w, ${s.imageLarge} 1600w` : undefined}
              sizes="(min-width: 768px) 736px, 100vw"
              alt={s.alt}
              loading={i === 0 ? 'eager' : 'lazy'}
              className="w-full h-full object-cover"
            />
            {(s.title || s.text || s.button) && (
              <span className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-1 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-4 pb-3 pt-10 sm:px-6 sm:pb-5 sm:pt-12">
                {s.title && <span className="text-xl sm:text-2xl font-bold leading-tight drop-shadow">{s.title}</span>}
                {s.text && <span className="hidden sm:block text-lg leading-snug drop-shadow">{s.text}</span>}
                {s.button && <span className="mt-2 rounded-lg bg-white px-4 py-2 text-base sm:text-lg font-bold text-onyx">{s.button} →</span>}
              </span>
            )}
          </Link>
        ))}
      </div>

      {n > 1 && (
        <div className="flex items-center justify-center gap-2 px-4 sm:px-0">
          <button type="button" className="btn-plain !w-14 !min-h-[52px] !px-0 !py-0 text-2xl" aria-label="Previous slide" onClick={() => go(at - 1)}>‹</button>
          <ul className="flex items-center gap-1" aria-label="Choose a slide">
            {slides.map((s, i) => (
              <li key={i}>
                <button
                  type="button"
                  aria-label={`Show slide ${i + 1}: ${s.title || s.alt}`}
                  aria-current={i === at}
                  onClick={() => go(i)}
                  className="flex h-11 w-9 items-center justify-center"
                >
                  <span className={`block h-3.5 w-3.5 rounded-full border-2 border-brand-dark ${i === at ? 'bg-brand-dark' : 'bg-white'}`} />
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="btn-plain !w-14 !min-h-[52px] !px-0 !py-0 text-2xl" aria-label="Next slide" onClick={() => go(at + 1)}>›</button>
          <button type="button" className="btn-plain !w-auto !min-h-[52px] !py-0 !px-4 !text-base ml-2" aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
            {paused ? 'Play' : 'Pause'}
          </button>
        </div>
      )}
    </section>
  );
}

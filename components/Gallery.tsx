'use client';
import { useState } from 'react';
import Img from './Img';

type Photo = { thumb: string; large: string; original: string };

// One big photo with the rest as tappable thumbnails underneath.
export default function Gallery({ photos, name }: { photos: Photo[]; name: string }) {
  const [at, setAt] = useState(0);
  if (!photos.length) return <div className="rounded-xl bg-ivory p-10 text-center text-lg">Photo coming soon</div>;
  const big = photos[at];

  return (
    <div className="space-y-3">
      <div className="aspect-[4/3] w-full rounded-xl bg-ivory border-[3px] border-onyx/10 overflow-hidden flex items-center justify-center">
        <Img key={big.original} srcs={[big.large, big.original]} eager={at === 0} alt={at === 0 ? name : `${name}, photo ${at + 1}`} className="w-full h-full object-contain" />
      </div>

      {photos.length > 1 && (
        <ul className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {photos.map((ph, i) => (
              <li key={ph.original}>
                <button
                  type="button"
                  onClick={() => setAt(i)}
                  aria-label={`Show photo ${i + 1}`}
                  aria-current={i === at}
                  className={`block w-full aspect-square rounded-lg bg-ivory overflow-hidden flex items-center justify-center border-[3px] ${
                    i === at ? 'border-brand' : 'border-onyx/10'
                  }`}
                >
                  <Img srcs={[ph.thumb, ph.original]} alt="" className="w-full h-full object-contain" />
                </button>
              </li>
            ))}
          </ul>
      )}
    </div>
  );
}

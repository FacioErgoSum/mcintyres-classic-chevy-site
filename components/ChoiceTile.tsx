import Link from 'next/link';

// A picture tile for the parts finder: picture on top, name on a green bar.
// The bar stretches so every tile in a row lines up, however long its name.
// `shape` is 'car' (wide side view) or 'part' (square).
export default function ChoiceTile({ href, title, note, art, shape }: { href: string; title: string; note?: string; art?: string; shape: 'car' | 'part' }) {
  return (
    <Link href={href} className="group flex h-full flex-col overflow-hidden rounded-xl border-[3px] border-onyx/15 bg-white no-underline text-onyx hover:border-brand hover:text-onyx focus-visible:border-brand">
      <span className={`flex items-center justify-center bg-white ${shape === 'car' ? 'aspect-[5/2] p-2' : 'aspect-square p-2'}`}>
        {art ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={art} alt="" loading="lazy" className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-[1.04]" />
        ) : (
          <span className="text-2xl font-bold text-onyx/30" aria-hidden>{title}</span>
        )}
      </span>
      <span className="flex flex-1 flex-col justify-center bg-brand px-3 py-3 text-center text-white group-hover:bg-brand-dark">
        <span className="block text-lg sm:text-xl font-bold leading-tight">{title}</span>
        {note && <span className="block text-base leading-snug text-white/85 mt-0.5">{note}</span>}
      </span>
    </Link>
  );
}

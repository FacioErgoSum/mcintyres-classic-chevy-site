import Link from 'next/link';
import Img from '@/components/Img';
import Slideshow from '@/components/Slideshow';
import ChoiceTile from '@/components/ChoiceTile';
import { AREAS } from '@/lib/areas';
import ART from '@/lib/planner-art.json';
import { currentSlides } from '@/lib/slides';
import { allParts, money } from '@/lib/catalog';

export const revalidate = 600;

// Category pictures are the same ones the Project Planner uses (public/planner/).
const art = (name: string): string | undefined => (ART as Record<string, string>)[name];

export default async function Home() {
  const parts = await allParts();
  const ours = parts.filter((p) => p.mcintyreMade);
  const areas = AREAS.map((a) => ({ a, n: parts.filter((p) => p.areas.includes(a.id)).length })).filter((x) => x.n);
  return (
    <div className="space-y-10 sm:space-y-12">
      <section className="space-y-4">
        <Slideshow slides={currentSlides()} />
        <h1 className="sr-only">Parts for your ’55, ’56 or ’57 Chevy</h1>
      </section>

      {/* Categories right up top, so you can start shopping without scrolling. */}
      <section id="categories" className="space-y-4 scroll-mt-4">
        <h2 className="script-title text-center">Shop by Category</h2>
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {areas.map(({ a, n }) => (
            <li key={a.id}>
              <ChoiceTile href={`/parts?area=${a.id}`} title={a.name} note={`${n.toLocaleString()} ${n === 1 ? 'part' : 'parts'}`} art={art(`area-${a.id}`) ?? parts.find((p) => p.areas.includes(a.id) && p.images[0])?.images[0].large} shape="part" />
            </li>
          ))}
        </ul>
        <p className="text-center">
          <Link href="/parts">See all {parts.length.toLocaleString()} Tri-Five parts</Link>
          <span className="text-onyx/50"> · </span>
          <Link href="/other">Non Tri-Five parts</Link>
        </p>
      </section>

      <section className="rounded-xl bg-ivory p-5 sm:p-6 space-y-4">
        <h2>Not sure what you need?</h2>
        <p className="max-w-[50ch]">Tell us your car and what you’re fixing. We’ll show you only the parts that fit it.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/planner" className="btn-main">Find parts for my car</Link>
          <Link href="/ask" className="btn-plain">Ask us a question with photos</Link>
        </div>
      </section>

      {ours.length > 0 && (
        <section className="space-y-5">
          <h2 className="script-title text-center">Made by McIntyre’s</h2>
          <p className="text-center">Repair panels we design and make ourselves in the USA.</p>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {ours.map((p) => (
              <li key={p.handle}>
                <Link
                  href={`/parts/${p.handle}`}
                  className="no-underline flex h-full flex-col gap-2 rounded-xl border-[3px] border-onyx/10 bg-white p-3 hover:border-brand focus-visible:border-brand"
                >
                  <span className="aspect-square w-full rounded-lg bg-ivory overflow-hidden flex items-center justify-center">
                    {p.images[0] ? (
                      <Img srcs={[p.images[0].large, p.images[0].original]} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-base text-onyx/60">Photo coming</span>
                    )}
                  </span>
                  <span className="font-bold leading-snug underline decoration-brand underline-offset-4">{p.name}</span>
                  <span className="mt-auto text-lg font-bold">{money(p.price)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-4">
        <h2>Who we are</h2>
        <p className="max-w-[60ch]">
          McIntyre’s is a family shop in Kansas. Geoff McIntyre came home from the hospital in his dad’s ’57 Bel Air,
          bought his own yellow ’57 in 1984, and has bought and sold well over a hundred Tri-Fives since.
          Sheet metal repair is the heart of our shop, and Tri-Fives are what we know best. We carry parts for other classic Chevys too.
        </p>
        <Link href="/about" className="btn-plain">Read Geoff’s story</Link>
      </section>
    </div>
  );
}

import Link from 'next/link';
import Img from '@/components/Img';
import Slideshow from '@/components/Slideshow';
import { currentSlides } from '@/lib/slides';
import { allParts, money } from '@/lib/catalog';
import { EXTRA_PART_USD, FREIGHT_USD, GS_PACKING_FEE_USD, SMALL_PARCEL_USD } from '@/lib/shipping';

export const revalidate = 600;

export default async function Home() {
  const parts = await allParts();
  const ours = parts.filter((p) => p.mcintyreMade);
  return (
    <div className="space-y-14">
      <section className="space-y-6">
        <Slideshow slides={currentSlides()} />
        <h1>Parts for your ’55, ’56 or ’57 Chevy</h1>
        <p className="text-xl max-w-[34ch]">Tell us your car and what you’re fixing. We’ll show you the parts that fit it.</p>
        <div className="flex flex-col gap-4 max-w-md">
          <Link href="/planner" className="btn-main text-xl">Find parts for my car</Link>
          <Link href="/ask" className="btn-plain">Ask us a question with photos</Link>
        </div>
        <p className="text-lg text-onyx/80">
          {parts.length.toLocaleString()} parts for Tri-Five Chevrolets, from floor pans to fender emblems.
          Working on something else? <Link href="/other">Non Tri-Five parts</Link>
        </p>
      </section>

      {ours.length > 0 && (
        <section className="space-y-5">
          <h2>Made by McIntyre’s</h2>
          <p className="max-w-[60ch]">Repair panels we design and make ourselves in the USA.</p>
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
                  <span className="text-lg font-bold leading-snug underline decoration-brand underline-offset-4">{p.name}</span>
                  <span className="mt-auto text-xl font-bold">{money(p.price)}</span>
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
          Sheet metal repair is the heart of our shop, and we only sell parts for these three years, so we know how they go together.
        </p>
        <Link href="/about" className="btn-plain">Read Geoff’s story</Link>
      </section>

      <section className="space-y-4">
        <h2>How shipping works</h2>
        <ul className="list-disc pl-7 space-y-2 max-w-[60ch]">
          <li>Small parts ship in a box for {money(SMALL_PARCEL_USD)}, plus {money(EXTRA_PART_USD)} for each extra part.</li>
          <li>Big sheet metal, like floor pans, quarter panels and hoods, ships by truck freight for {money(FREIGHT_USD)} per order, no matter how many parts.</li>
          <li>Our warehouse charges a {money(GS_PACKING_FEE_USD)} packing fee on every order.</li>
        </ul>
      </section>
    </div>
  );
}

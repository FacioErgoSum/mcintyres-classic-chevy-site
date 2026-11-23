import Link from 'next/link';
import { allParts, money } from '@/lib/catalog';
import { FREIGHT_USD, SMALL_PARCEL_USD } from '@/lib/shipping';

export const revalidate = 600;

export default async function Home() {
  const parts = await allParts();
  const ours = parts.filter((p) => p.mcintyreMade);
  return (
    <div className="space-y-14">
      <section className="space-y-6">
        <h1>Parts for your ’55, ’56 or ’57 Chevy</h1>
        <p className="text-xl max-w-[34ch]">Tell us your car and what you’re fixing. We’ll show you the parts that fit it.</p>
        <div className="flex flex-col gap-4 max-w-md">
          <Link href="/planner" className="btn-main text-xl">Find parts for my car</Link>
          <Link href="/ask" className="btn-plain">Ask us a question with photos</Link>
        </div>
        <figure className="-mx-4 sm:mx-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/photos/yard-800.webp"
            srcSet="/photos/yard-800.webp 800w, /photos/yard-1600.webp 1600w"
            sizes="(min-width: 768px) 736px, 100vw"
            width={1600}
            height={838}
            alt="A row of ’55, ’56 and ’57 Chevrolets parked on the grass outside the McIntyre’s shop"
            loading="lazy"
            className="w-full h-auto sm:rounded-xl"
          />
          <figcaption className="px-4 sm:px-0 pt-2 text-base text-onyx/75">Some of the Tri-Fives at the shop.</figcaption>
        </figure>
        <p className="text-lg text-onyx/80">
          {parts.length.toLocaleString()} parts for Tri-Five Chevrolets, from floor pans to fender emblems.
          Working on something else? <Link href="/other">Non-Tri-Five parts</Link>
        </p>
      </section>

      {ours.length > 0 && (
        <section className="space-y-5">
          <h2>Made by McIntyre’s</h2>
          <p className="max-w-[60ch]">Repair panels we design and make ourselves in the USA, for the spots other suppliers don’t cover.</p>
          <ul className="space-y-3">
            {ours.map((p) => (
              <li key={p.handle}>
                <Link href={`/parts/${p.handle}`} className="text-xl font-bold">{p.name}</Link>
                <span className="text-xl font-bold"> — {money(p.price)}</span>
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
          <li>Small parts ship in a box for {money(SMALL_PARCEL_USD)} per order.</li>
          <li>Big sheet metal, like floor pans, quarter panels and hoods, ships by truck freight for {money(FREIGHT_USD)} per order, no matter how many panels.</li>
          <li>Check every panel when it arrives, before you sign for it. Write any damage on the delivery receipt.</li>
        </ul>
      </section>
    </div>
  );
}

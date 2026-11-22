import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPart, money } from '@/lib/catalog';
import { describeFitment } from '@/lib/fitment';
import { FREIGHT_USD, SMALL_PARCEL_USD } from '@/lib/shipping';
import AddToCart from '@/components/AddToCart';
import Img from '@/components/Img';

export const revalidate = 600;
type P = Promise<{ handle: string }>;

export async function generateMetadata({ params }: { params: P }): Promise<Metadata> {
  const part = await getPart((await params).handle);
  return part ? { title: part.name, description: part.description.slice(0, 160) } : {};
}

export default async function PartPage({ params }: { params: P }) {
  const part = await getPart((await params).handle);
  if (!part) notFound();

  return (
    <article className="space-y-8">
      <p><Link href="/parts">Back to all parts</Link></p>
      <h1 className="text-2xl sm:text-3xl">{part.name}</h1>

      <div className="space-y-3">
        {part.images.length ? (
          part.images.map((ph, i) => (
            <Img key={ph.original} srcs={[ph.large, ph.original]} eager={i === 0} alt={i === 0 ? part.name : `${part.name}, photo ${i + 1}`} className="w-full max-h-[70vh] object-contain rounded-xl bg-ivory border-[3px] border-onyx/10" />
          ))
        ) : (
          <div className="rounded-xl bg-ivory p-10 text-center text-lg">Photo coming soon</div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-3xl font-bold">{money(part.price)}</p>
        <p className="text-lg">
          {part.freight
            ? `Ships by truck freight: ${money(FREIGHT_USD)} per order, however many panels you order.`
            : `Ships in a box: ${money(SMALL_PARCEL_USD)} per order.`}
        </p>
      </div>

      <AddToCart line={{ handle: part.handle, name: part.name, price: part.price, images: part.images[0] ? [part.images[0].thumb, part.images[0].original] : [], freight: part.freight }} />

      <section className="space-y-3 rounded-xl border-[3px] border-brand p-5">
        <h2 className="text-xl">Fits</h2>
        <p className="text-xl">{describeFitment(part.fitment)}</p>
        <p className="text-lg">Not sure it’s right for your car? <Link href={`/ask?part=${encodeURIComponent(part.handle)}`}>Send us a photo of your old part</Link> and we’ll check.</p>
      </section>

      {part.mcintyreMade && (
        <p className="rounded-xl bg-matador text-white p-5 text-lg font-bold">Designed and made in the USA by McIntyre’s.</p>
      )}

      <section className="space-y-3">
        <h2 className="text-xl">About this part</h2>
        <p className="max-w-[65ch]">{part.description}</p>
        {part.partNumber && <p className="text-lg">Part number: <strong>{part.partNumber}</strong></p>}
      </section>
    </article>
  );
}

import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPart, money } from '@/lib/catalog';
import { describeFitment } from '@/lib/fitment';
import { lineName } from '@/lib/lines';
import { FREIGHT_USD, SMALL_PARCEL_USD } from '@/lib/shipping';
import AddToCart from '@/components/AddToCart';
import Gallery from '@/components/Gallery';

export const revalidate = 600;
type P = Promise<{ handle: string }>;

export async function generateMetadata({ params }: { params: P }): Promise<Metadata> {
  const part = await getPart((await params).handle);
  return part ? { title: part.mcintyreMade ? part.name : part.title, description: (part.description || part.name).slice(0, 160) } : {};
}

export default async function PartPage({ params }: { params: P }) {
  const part = await getPart((await params).handle);
  if (!part) notFound();

  return (
    <article className="space-y-8">
      <p><Link href={part.triFive ? '/parts' : `/other?line=${part.line}`}>{part.triFive ? 'Back to all parts' : `Back to ${lineName(part.line)}`}</Link></p>
      <h1 className="text-2xl sm:text-3xl">{part.name}</h1>

      <Gallery photos={part.images} name={part.name} />

      <div className="space-y-2">
        <p className="text-3xl font-bold">{money(part.price)}</p>
        <p className="text-lg">
          {part.freight
            ? `Freight Shipping: ${money(FREIGHT_USD)}`
            : `Ground Shipping: ${money(SMALL_PARCEL_USD)}`}
        </p>
      </div>

      <AddToCart line={{ handle: part.handle, name: part.name, price: part.price, images: part.images[0] ? [part.images[0].thumb, part.images[0].original] : [], freight: part.freight }} />

      <section className="space-y-3 rounded-xl border-[3px] border-brand p-5">
        <h2 className="text-xl">Fits</h2>
        <p className="text-xl">{part.triFive ? describeFitment(part.fitment) : `${lineName(part.line)}. Check the part name above for the exact years and models.`}</p>
        <p className="text-lg">Not sure it’s right for your car? <Link href={`/ask?part=${encodeURIComponent(part.handle)}`}>Send us a photo of your old part</Link> and we’ll check.</p>
      </section>

      {part.mcintyreMade && (
        <p className="rounded-xl bg-matador text-white p-5 text-lg font-bold">Designed and made in the USA by McIntyre’s.</p>
      )}

      <section className="space-y-3">
        <h2 className="text-xl">About this part</h2>
        {part.description && <p className="max-w-[65ch]">{part.description}</p>}
        {part.facts.length > 0 && (
          <dl className="space-y-2 max-w-[65ch] text-lg">
            {part.facts
              .filter((f) => !(part.triFive && f.label === 'Years'))
              .map((f) => (
                <div key={f.label}>
                  <dt className="inline font-bold">{f.label}: </dt>
                  <dd className="inline">{f.value}</dd>
                </div>
              ))}
          </dl>
        )}
        {part.partNumber && <p className="text-lg">Part number: <strong>{part.partNumber}</strong></p>}
      </section>
    </article>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMerch } from '@/lib/merch';
import { money } from '@/lib/catalog';
import { MERCH_MAILER_USD, PRINTFUL_SHIPPING_USD } from '@/lib/shipping';
import Gallery from '@/components/Gallery';
import MerchBuy from '@/components/MerchBuy';

export const revalidate = 600;

type P = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const m = await getMerch((await params).handle);
  return m ? { title: m.name, description: m.description.slice(0, 160) } : {};
}

export default async function MerchItemPage({ params }: P) {
  const m = await getMerch((await params).handle);
  if (!m) notFound();
  const photos = m.images.map((u) => ({ thumb: u, large: u, original: u }));
  return (
    <div className="space-y-8">
      <Link href="/merch" className="text-lg">Back to merch</Link>
      <h1>{m.name}</h1>
      <Gallery photos={photos} name={m.name} />
      <div className="space-y-2">
        <p className="text-3xl font-bold">{money(m.price)}</p>
        <p className="text-lg">
          {m.fulfillment === 'printed'
            ? `Merch Shipping: ${money(PRINTFUL_SHIPPING_USD)}`
            : `Merch Shipping: ${money(MERCH_MAILER_USD)}, free with a parts order`}
        </p>
      </div>
      <MerchBuy
        handle={m.handle}
        name={m.name}
        price={m.price}
        images={m.images.slice(0, 1)}
        kind={m.fulfillment}
        options={m.options.map((o) => ({ label: o.label, price: o.price }))}
      />
      {m.description && (
        <section className="space-y-3">
          <h2 className="text-2xl">About this item</h2>
          <p className="max-w-[65ch]">{m.description}</p>
        </section>
      )}
    </div>
  );
}

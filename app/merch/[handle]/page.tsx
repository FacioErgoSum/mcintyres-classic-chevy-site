import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMerch } from '@/lib/merch';
import { money } from '@/lib/catalog';
import { MERCH_MAILER_USD, PRINTFUL_SHIPPING_USD } from '@/lib/shipping';
import MerchShop from '@/components/MerchShop';
import ShareButtons from '@/components/ShareButtons';
import { siteUrl } from '@/lib/site';

export const revalidate = 600;

type P = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const m = await getMerch((await params).handle);
  if (!m) return {};
  const description = m.description.slice(0, 160) || `${m.name} from McIntyre’s Classic Chevy.`;
  // Our own photos get a JPEG copy at build time (scripts/merch-thumbs.mjs) for link previews.
  const photo = m.images[0];
  const image = photo ? (photo.startsWith('/merch/') ? photo.replace(/\.(webp|png|jpe?g)$/i, '-share.jpg') : photo) : undefined;
  return {
    title: m.name,
    description,
    alternates: { canonical: `/merch/${m.handle}` },
    openGraph: { type: 'website', title: m.name, description, url: `/merch/${m.handle}`, ...(image ? { images: [{ url: image, alt: m.name }] } : {}) },
    twitter: { card: 'summary_large_image', title: m.name, description, ...(image ? { images: [image] } : {}) },
  };
}

export default async function MerchItemPage({ params }: P) {
  const m = await getMerch((await params).handle);
  if (!m) notFound();
  return (
    <div className="space-y-8">
      <Link href="/merch" className="text-lg">Back to merch</Link>
      <h1>{m.name}</h1>
      <MerchShop
        handle={m.handle}
        name={m.name}
        price={m.price}
        images={m.images}
        kind={m.fulfillment}
        options={m.options.map((o) => ({ label: o.label, price: o.price, color_hex: o.color_hex }))}
      >
        <div className="space-y-2">
          <p className="text-3xl font-bold">{money(m.price)}</p>
          <p className="text-lg">
            {m.fulfillment === 'printed'
              ? `Merch Shipping: ${money(PRINTFUL_SHIPPING_USD)}`
              : `Merch Shipping: ${money(MERCH_MAILER_USD)}, free with a parts order`}
          </p>
        </div>
      </MerchShop>
      {m.description && (
        <section className="space-y-3">
          <h2 className="text-2xl">About this item</h2>
          <p className="max-w-[65ch]">{m.description}</p>
        </section>
      )}
      <ShareButtons url={`${siteUrl()}/merch/${m.handle}`} title={m.name} what="item" />
    </div>
  );
}

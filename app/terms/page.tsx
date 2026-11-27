import type { Metadata } from 'next';
import Link from 'next/link';
import { CONTACT_EMAIL, POLICY_UPDATED } from '@/lib/policy';

export const metadata: Metadata = {
  title: 'Terms of sale',
  description: 'The terms for buying parts and merch from McIntyre’s Classic Chevy.',
};

export default function Terms() {
  return (
    <article className="space-y-8 max-w-[65ch]">
      <div className="space-y-2">
        <h1>Terms of sale</h1>
        <p className="text-lg text-onyx/80">Last updated {POLICY_UPDATED}</p>
      </div>
      <p>
        McIntyre’s Classic Chevy is a family business in Scranton, Kansas. When you buy from this website, these terms apply along with
        our <Link href="/shipping-returns">shipping and returns policy</Link> and <Link href="/privacy">privacy policy</Link>.
      </p>

      <section className="space-y-3">
        <h2>Prices and payment</h2>
        <p>
          Prices are in US dollars. You pay on Stripe’s secure checkout page; we never see your card number. Sales tax is added at
          checkout where it applies. If a price on the site is clearly wrong, we’ll tell you before your order ships and you can cancel
          for a full refund.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Stock</h2>
        <p>
          We show what’s in stock and only take orders for parts we expect to ship. Stock can still run out between when you order and
          when we place it with the warehouse. If that happens we’ll email you right away, and you can wait for it or get a full refund.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Fitment</h2>
        <p>
          We list which years and body styles each part fits as carefully as we can. Cars this old have been repaired and changed over
          the years, so please compare with your old part and test fit before welding or painting. Not sure? <Link href="/ask">Send us a photo</Link> and we’ll check before you buy.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Reproduction parts</h2>
        <p>
          Most parts we sell are new reproductions, not original GM parts. Some may need trimming or adjusting to fit, which is normal
          for restoration sheet metal. Installation, labor, paint and other costs aren’t covered by any refund or replacement.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Warranty</h2>
        <p>
          If a part has a defect in materials or workmanship, tell us and we’ll replace it. This doesn’t cover damage from an accident,
          installation, modification, or a part that wasn’t sealed, primed or painted after installing.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Names and trademarks</h2>
        <p>Chevrolet, Bel Air and Nomad are trademarks of General Motors. McIntyre’s is not affiliated with GM.</p>
      </section>

      <section className="space-y-3">
        <h2>Questions</h2>
        <p>Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> or <Link href="/ask">send us a message</Link>.</p>
      </section>
    </article>
  );
}

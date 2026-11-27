import type { Metadata } from 'next';
import Link from 'next/link';
import { EXTRA_PART_USD, FREIGHT_USD, GS_PACKING_FEE_USD, MERCH_MAILER_USD, PRINTFUL_SHIPPING_USD, SMALL_PARCEL_USD } from '@/lib/shipping';
import { CONTACT_EMAIL, CONTACT_PHONE, DAMAGE_REPORT_HOURS, POLICY_UPDATED, RETURN_DAYS } from '@/lib/policy';

export const metadata: Metadata = {
  title: 'Shipping and returns',
  description: 'How McIntyre’s ships Tri-Five parts, what freight costs, what to do if a part arrives damaged, and how returns work.',
};

const usd = (n: number) => `$${n}`;

export default function ShippingReturns() {
  return (
    <article className="space-y-8 max-w-[65ch]">
      <div className="space-y-2">
        <h1>Shipping and returns</h1>
        <p className="text-lg text-onyx/80">Last updated {POLICY_UPDATED}</p>
      </div>

      <section className="space-y-3">
        <h2>Where your parts ship from</h2>
        <p>
          Most reproduction sheet metal ships straight from our supplier’s warehouse in Lewisville, Texas. Parts we make ourselves
          (McIntyre Made) ship from our shop in Scranton, Kansas. Printed shirts and hats are printed and shipped by our print shop.
          An order can arrive in more than one package. We ship to addresses in the United States only.
        </p>
      </section>

      <section className="space-y-3">
        <h2>What shipping costs</h2>
        <ul className="list-disc pl-7 space-y-2">
          <li><strong>Small parts by ground:</strong> {usd(SMALL_PARCEL_USD)} per order, plus {usd(EXTRA_PART_USD)} for each extra part.</li>
          <li><strong>Large panels by truck freight:</strong> {usd(FREIGHT_USD)} per order, no matter how many parts. Floor pans, quarter panels, fenders, hoods and other big pieces go this way.</li>
          <li><strong>Warehouse packing fee:</strong> {usd(GS_PACKING_FEE_USD)} per order with parts from the warehouse.</li>
          <li><strong>Merch:</strong> {usd(PRINTFUL_SHIPPING_USD)} for printed shirts and hats, or {usd(MERCH_MAILER_USD)} for small merch on its own. Small merch ships free with parts.</li>
          <li><strong>Complete bodies:</strong> quoted for your address before you pay anything.</li>
        </ul>
        <p>Your cart shows the exact shipping before you check out.</p>
      </section>

      <section className="space-y-3">
        <h2>When it ships</h2>
        <p>
          We order your parts as soon as your payment goes through. Ground orders usually ship within a few business days. Freight
          takes longer to schedule, and the freight company calls the phone number you gave at checkout to set up delivery. We email
          you tracking once your order ships. You can also see it in <Link href="/account">your account</Link> if you have one.
        </p>
      </section>

      <section className="space-y-3 rounded-xl border-[3px] border-matador p-5">
        <h2>Freight deliveries: check before you sign</h2>
        <p>Sheet metal is big and thin, and freight trucks are rough. Please do this when it arrives:</p>
        <ol className="list-decimal pl-7 space-y-2">
          <li>Open or look over every box <strong>before you sign</strong> for it, with the driver there.</li>
          <li>If anything is bent, crushed or torn, write “damaged” and what you see on the delivery receipt before signing. You can also refuse a damaged box.</li>
          <li>Take photos of the boxes and the parts.</li>
          <li>Send us the photos within {DAMAGE_REPORT_HOURS} hours of delivery at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> or through <Link href="/ask">Ask a question</Link>.</li>
        </ol>
        <p>
          If damage is written on the receipt and reported in time, we’ll replace the part at no cost to you. If the receipt is signed
          clean, the freight company won’t pay for damage, so we may not be able to either.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Returns</h2>
        <ul className="list-disc pl-7 space-y-2">
          <li>Ask for a return within <strong>{RETURN_DAYS} days of placing your order</strong>. Message us first; we’ll tell you where to send it. Parts sent back without asking can’t be refunded.</li>
          <li>The part has to be new and as it arrived: not welded, drilled, cut, painted, primed, undercoated or installed.</li>
          <li>There’s no restocking fee.</li>
          <li>If we sent the wrong part or it’s defective, we pay to ship it back and send the right one.</li>
          <li>If you ordered the wrong part, you pay to ship it back, and the original shipping and packing fee aren’t refunded.</li>
          <li>Printed shirts and hats are made for your order, so they can only be returned if they arrive damaged or wrong.</li>
          <li>Complete bodies can’t be returned once they’ve shipped.</li>
        </ul>
        <p>Refunds go back to the card you paid with once the part reaches the warehouse, usually within a week.</p>
      </section>

      <section className="space-y-3">
        <h2>Test fit before you finish</h2>
        <p>
          Reproduction panels sometimes need a little trimming or massaging to fit. Please test fit every panel before welding,
          painting or undercoating. Once a part has been modified or finished it can’t be returned.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Questions</h2>
        <p>
          <Link href="/ask">Send us a message and photos</Link>, email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>, or
          leave a voicemail at <a href="tel:+17858173939">{CONTACT_PHONE}</a>.
        </p>
      </section>
    </article>
  );
}

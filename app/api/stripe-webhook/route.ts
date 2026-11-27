import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { goldenStarCart, orderFromSession, sendToPrintful } from '@/lib/orders';
import { orderEmail, sendOrderEmail } from '@/lib/order-email';
import { saveOrder } from '@/lib/order-store';
import { stillForSale } from '@/lib/reserved';

// Stripe calls this right after a customer pays.
// 1. Printed merch goes to Printful.
// 2. You get an email with the ship-to address, what to order from Golden Star
//    (with a one-tap cart link), and what ships from Scranton.
//
// Setup: Stripe Dashboard → Developers → Webhooks → Add endpoint
//   URL: https://<your site>/api/stripe-webhook
//   Event: checkout.session.completed
// Then put its signing secret (whsec_…) in Netlify as STRIPE_WEBHOOK_SECRET.

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!key || !secret) {
    console.error('Stripe webhook: STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET is missing');
    return NextResponse.json({ error: 'not configured' }, { status: 500 });
  }
  const stripe = new Stripe(key);

  // The signature proves the message really came from Stripe.
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), req.headers.get('stripe-signature') || '', secret);
  } catch (e) {
    console.error('Stripe webhook: bad signature', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'bad signature' }, { status: 400 });
  }

  if (event.type !== 'checkout.session.completed' && event.type !== 'checkout.session.async_payment_succeeded') {
    return NextResponse.json({ ignored: event.type });
  }
  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== 'paid') return NextResponse.json({ waiting: session.payment_status });

  try {
    const order = await orderFromSession(stripe, session.id);
    // Two customers can pay for the last few of a part at nearly the same time.
    // Check again now, and warn in the email before anything is ordered.
    const gsParts = order.lines.filter((l) => l.kind === 'part' && l.supplier === 'golden_star' && l.handle);
    const left = await stillForSale(gsParts.map((l) => l.handle!), { live: order.live, exceptOrder: order.id });
    const stockWarnings = gsParts
      .filter((l) => left.has(l.handle!) && l.qty > left.get(l.handle!)!)
      .map((l) => `${l.name}${l.partNumber ? ` (${l.partNumber})` : ''}: ordered ${l.qty}, but only ${left.get(l.handle!)} looked available. Check Golden Star has them before ordering, and refund the customer in Stripe if not.`);
    await saveOrder(order); // for the customer's account page; never blocks the email
    const [gs, printful] = await Promise.all([goldenStarCart(order), sendToPrintful(order)]);
    await sendOrderEmail(orderEmail(order, gs, printful, stockWarnings));
    console.log(`Order ${order.id}: emailed; Printful ${printful.status}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    // A 500 makes Stripe try again later (Printful ignores the repeat).
    console.error('Stripe webhook: order handling failed', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'order handling failed' }, { status: 500 });
  }
}

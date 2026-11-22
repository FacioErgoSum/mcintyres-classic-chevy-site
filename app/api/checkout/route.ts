import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getPart } from '@/lib/catalog';
import { shippingFor } from '@/lib/shipping';

// Builds a Stripe Checkout page. Prices always come from the catalog on the
// server, never from the browser.
export async function POST(req: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error('Stripe checkout failed: STRIPE_SECRET_KEY is missing from .env.local (restart the site after adding it)');
    return NextResponse.json({ error: 'Online checkout isn’t set up yet: the Stripe key is missing. Please send us a message instead.' }, { status: 503 });
  }
  if (!/^sk_(test|live)_/.test(key)) {
    console.error('Stripe checkout failed: STRIPE_SECRET_KEY should start with sk_test_ or sk_live_ (the publishable pk_ key will not work here)');
    return NextResponse.json({ error: 'Checkout isn’t set up correctly: use the Stripe secret key (sk_test_…), not the publishable key.' }, { status: 503 });
  }

  let body: { items?: { handle: string; qty: number }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Your cart could not be read.' }, { status: 400 });
  }
  const items = (body.items || []).filter((i) => i && typeof i.handle === 'string' && Number.isInteger(i.qty) && i.qty > 0 && i.qty <= 50);
  if (!items.length) return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 });

  const lines = [];
  for (const i of items) {
    const part = await getPart(i.handle);
    if (!part) return NextResponse.json({ error: 'A part in your cart is no longer for sale. Remove it and try again.' }, { status: 400 });
    lines.push({ part, qty: i.qty });
  }

  const ship = shippingFor(lines.map((l) => l.part.freight));
  const site = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  const stripe = new Stripe(key);

  let session: Stripe.Checkout.Session;
  try {
  session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lines.map(({ part, qty }) => ({
      quantity: qty,
      price_data: {
        currency: 'usd',
        unit_amount: Math.round(part.price * 100),
        product_data: {
          name: part.name,
          description: part.partNumber ? `Part number ${part.partNumber}` : undefined,
          images: part.images.slice(0, 1).map((ph) => ph.original),
          metadata: { handle: part.handle },
        },
      },
    })),
    shipping_address_collection: { allowed_countries: ['US'] },
    shipping_options: [
      { shipping_rate_data: { display_name: ship.label, type: 'fixed_amount', fixed_amount: { amount: Math.round(ship.amount * 100), currency: 'usd' } } },
    ],
    phone_number_collection: { enabled: true }, // freight carriers call before delivery
    metadata: { handles: lines.map((l) => `${l.part.handle} x${l.qty}`).join(', ').slice(0, 490) },
    success_url: `${site}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/checkout/cancelled`,
  });
  } catch (err) {
    // Shows up in the terminal running the site, and in the cart page's red box.
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Stripe checkout failed:', msg);
    return NextResponse.json({ error: `Checkout couldn’t start: ${msg}` }, { status: 502 });
  }

  return NextResponse.json({ url: session.url });
}

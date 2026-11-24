import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getPart } from '@/lib/catalog';
import { shippingForOrder } from '@/lib/shipping';
import { getMerchLine } from '@/lib/merch';

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
  const items = (body.items || []).filter((i) => i && typeof i.handle === 'string' && Number.isInteger(i.qty) && i.qty > 0 && i.qty <= 50).slice(0, 40);
  if (!items.length) return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 });

  // Every line carries what the order email needs (in Stripe's metadata), so
  // the email and the Golden Star / Printful orders never depend on the browser.
  type Line = {
    qty: number;
    name: string;
    price: number;
    image?: string;
    description?: string;
    meta: Record<string, string>;
    freight: boolean;
    goldenStar?: boolean;
    group: 'part' | 'mailer' | 'printed';
  };
  const lines: Line[] = [];
  // The site's address; tolerate it being set without https:// or with a trailing slash.
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || '').trim();
  const site = raw ? (/^https?:\/\//.test(raw) ? raw : `https://${raw}`).replace(/\/+$/, '') : new URL(req.url).origin;
  const abs = (u?: string) => (!u ? undefined : u.startsWith('/') ? site + u : u);

  for (const i of items) {
    if (i.handle.startsWith('merch:')) {
      const m = await getMerchLine(i.handle);
      if (!m) return NextResponse.json({ error: 'An item in your cart is no longer for sale. Remove it and try again.' }, { status: 400 });
      if (m.item.fulfillment === 'printed' && !m.option?.printful_sync_variant_id && m.item.options.length) {
        console.error(`Merch ${i.handle} has no Printful sync variant id; the order will need to be placed by hand.`);
      }
      lines.push({
        qty: i.qty,
        name: m.name,
        price: m.price,
        image: abs(m.item.images[0]),
        meta: {
          kind: m.item.fulfillment,
          key: m.key,
          printful_sync_variant_id: String(m.option?.printful_sync_variant_id ?? ''),
        },
        freight: false,
        group: m.item.fulfillment,
      });
      continue;
    }
    const part = await getPart(i.handle);
    if (!part) return NextResponse.json({ error: 'A part in your cart is no longer for sale. Remove it and try again.' }, { status: 400 });
    if (part.stock.maxQty === 0) return NextResponse.json({ error: `${part.name} is out of stock right now. Remove it and try again.` }, { status: 409 });
    if (i.qty > part.stock.maxQty) return NextResponse.json({ error: `We can only promise ${part.stock.maxQty} of ${part.name} right now. Lower the number and try again.` }, { status: 409 });
    lines.push({
      qty: i.qty,
      name: part.name,
      price: part.price,
      image: abs(part.images[0]?.original),
      description: part.partNumber ? `Part number ${part.partNumber}` : undefined,
      meta: {
        kind: 'part',
        handle: part.handle,
        supplier: part.mcintyreMade ? 'mcintyre' : 'golden_star',
        stock: part.stock.status === 'in' ? String(part.stock.qty) : part.stock.status,
        part_number: part.partNumber ?? '',
        freight: part.freight ? 'yes' : 'no',
      },
      freight: part.freight,
      goldenStar: !part.mcintyreMade,
      group: 'part',
    });
  }

  const ship = shippingForOrder({
    parts: lines.filter((l) => l.group === 'part').map((l) => ({ freight: l.freight, qty: l.qty, goldenStar: !!l.goldenStar })),
    mailerMerch: lines.filter((l) => l.group === 'mailer').length,
    printedMerch: lines.filter((l) => l.group === 'printed').length,
  });
  const stripe = new Stripe(key);

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lines.map((l) => ({
        quantity: l.qty,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(l.price * 100),
          product_data: {
            name: l.name,
            description: l.description,
            images: l.image ? [l.image] : [],
            metadata: l.meta,
          },
        },
      })),
      shipping_address_collection: { allowed_countries: ['US'] },
      shipping_options: [
        { shipping_rate_data: { display_name: ship.label.slice(0, 100), type: 'fixed_amount', fixed_amount: { amount: Math.round(ship.amount * 100), currency: 'usd' } } },
      ],
      phone_number_collection: { enabled: true }, // freight carriers call before delivery
      ...(process.env.STRIPE_TAX === 'on' ? { automatic_tax: { enabled: true } } : {}),
      metadata: { shipping: ship.lines.map((s) => `${s.label} $${s.amount}`).join(', ') },
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

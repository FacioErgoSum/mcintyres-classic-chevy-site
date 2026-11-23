import 'server-only';
import type Stripe from 'stripe';

// Turns a paid Stripe checkout into an order: who it goes to, and what has to be
// ordered from whom. Used by app/api/stripe-webhook.

export type OrderLine = {
  name: string;
  qty: number;
  unit: number; // what the customer paid each, USD
  kind: 'part' | 'mailer' | 'printed';
  supplier?: 'golden_star' | 'mcintyre';
  handle?: string;
  partNumber?: string;
  freight?: boolean;
  printfulSyncVariantId?: number;
};

export type Address = { line1: string; line2?: string; city: string; state: string; zip: string; country: string };

export type Order = {
  id: string; // Stripe checkout session id
  paymentIntent?: string;
  created: Date;
  customer: { name: string; email?: string; phone?: string };
  shipTo: { name: string; address: Address };
  lines: OrderLine[];
  totals: { items: number; shipping: number; tax: number; total: number };
  shippingLabel: string;
  live: boolean;
};

const usd = (cents?: number | null) => (cents ?? 0) / 100;

export async function orderFromSession(stripe: Stripe, sessionId: string): Promise<Order> {
  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['shipping_cost.shipping_rate'] });
  const items = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 100, expand: ['data.price.product'] });

  // Stripe moved shipping details in newer API versions; read either place.
  const s = session as unknown as {
    collected_information?: { shipping_details?: { name?: string; address?: Stripe.Address } };
    shipping_details?: { name?: string; address?: Stripe.Address };
  };
  const shipping = s.collected_information?.shipping_details || s.shipping_details || null;
  const cd = session.customer_details;
  const addr = shipping?.address || cd?.address;

  const lines: OrderLine[] = items.data.map((li) => {
    const product = li.price?.product as Stripe.Product | undefined;
    const m = product?.metadata || {};
    const kind = (m.kind as OrderLine['kind']) || 'part';
    return {
      name: product?.name || li.description || 'Item',
      qty: li.quantity ?? 1,
      unit: usd(li.price?.unit_amount),
      kind,
      supplier: kind === 'part' ? ((m.supplier as OrderLine['supplier']) || 'golden_star') : undefined,
      handle: m.handle || undefined,
      partNumber: m.part_number || undefined,
      freight: m.freight === 'yes',
      printfulSyncVariantId: m.printful_sync_variant_id ? Number(m.printful_sync_variant_id) : undefined,
    };
  });

  const rate = session.shipping_cost?.shipping_rate;
  return {
    id: session.id,
    paymentIntent: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
    created: new Date(session.created * 1000),
    customer: { name: cd?.name || shipping?.name || '', email: cd?.email || undefined, phone: cd?.phone || undefined },
    shipTo: {
      name: shipping?.name || cd?.name || '',
      address: {
        line1: addr?.line1 || '',
        line2: addr?.line2 || undefined,
        city: addr?.city || '',
        state: addr?.state || '',
        zip: addr?.postal_code || '',
        country: addr?.country || 'US',
      },
    },
    lines,
    totals: {
      items: usd(session.amount_subtotal),
      shipping: usd(session.shipping_cost?.amount_total),
      tax: usd(session.total_details?.amount_tax),
      total: usd(session.amount_total),
    },
    shippingLabel: (rate && typeof rate !== 'string' && rate.display_name) || 'Shipping',
    live: session.livemode,
  };
}

// ---------- Golden Star: one-tap cart link ----------

const GS = 'https://goldenstarauto.site';

/**
 * Golden Star's store is Shopify, so a link like /cart/<variant>:<qty>,… opens
 * their checkout with the parts already in the cart, and the ship-to address
 * filled in. The variant numbers are looked up live from Golden Star's public
 * product pages, so they're always current.
 */
export async function goldenStarCart(order: Order): Promise<{ url: string | null; missing: OrderLine[] }> {
  const gs = order.lines.filter((l) => l.kind === 'part' && l.supplier === 'golden_star');
  if (!gs.length) return { url: null, missing: [] };
  const found: string[] = [];
  const missing: OrderLine[] = [];
  await Promise.all(
    gs.map(async (l) => {
      try {
        if (!l.handle) throw new Error('no handle');
        const res = await fetch(`${GS}/products/${encodeURIComponent(l.handle)}.js`, { headers: { Accept: 'application/json' }, cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const p = (await res.json()) as { variants?: { id: number; sku?: string }[] };
        const v = p.variants?.find((x) => !l.partNumber || x.sku === l.partNumber) || p.variants?.[0];
        if (!v) throw new Error('no variant');
        found.push(`${v.id}:${l.qty}`);
      } catch {
        missing.push(l);
      }
    }),
  );
  if (!found.length) return { url: null, missing };

  const [first, ...rest] = order.shipTo.name.trim().split(/\s+/);
  const a = order.shipTo.address;
  const q = new URLSearchParams({
    'checkout[shipping_address][first_name]': first || '',
    'checkout[shipping_address][last_name]': rest.join(' '),
    'checkout[shipping_address][address1]': a.line1,
    'checkout[shipping_address][address2]': a.line2 || '',
    'checkout[shipping_address][city]': a.city,
    'checkout[shipping_address][province]': a.state,
    'checkout[shipping_address][zip]': a.zip,
    'checkout[shipping_address][country]': a.country === 'US' ? 'United States' : a.country,
  });
  return { url: `${GS}/cart/${found.join(',')}?${q.toString()}`, missing };
}

// ---------- Printful: printed merch ----------

export async function sendToPrintful(order: Order): Promise<{ status: 'none' | 'sent' | 'skipped' | 'failed'; detail: string }> {
  const printed = order.lines.filter((l) => l.kind === 'printed');
  if (!printed.length) return { status: 'none', detail: '' };
  const token = process.env.PRINTFUL_API_TOKEN;
  if (!token) return { status: 'skipped', detail: 'PRINTFUL_API_TOKEN is not set, so this needs to be ordered in Printful by hand.' };
  const noId = printed.filter((l) => !l.printfulSyncVariantId);
  if (noId.length) return { status: 'skipped', detail: `No Printful variant id for: ${noId.map((l) => l.name).join(', ')}. Order these in Printful by hand.` };

  const confirm = process.env.PRINTFUL_AUTO_CONFIRM === 'on';
  const a = order.shipTo.address;
  const headers: Record<string, string> = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  if (process.env.PRINTFUL_STORE_ID) headers['X-PF-Store-Id'] = process.env.PRINTFUL_STORE_ID;
  try {
    const res = await fetch(`https://api.printful.com/orders${confirm ? '?confirm=true' : ''}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        // Printful refuses a second order with the same external id, so a repeated
        // webhook can't print the same shirts twice.
        external_id: order.id.slice(-32),
        shipping: 'STANDARD',
        recipient: {
          name: order.shipTo.name,
          address1: a.line1,
          address2: a.line2 || undefined,
          city: a.city,
          state_code: a.state,
          country_code: a.country,
          zip: a.zip,
          phone: order.customer.phone,
          email: order.customer.email,
        },
        items: printed.map((l) => ({ sync_variant_id: l.printfulSyncVariantId, quantity: l.qty, retail_price: l.unit.toFixed(2) })),
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { result?: { id?: number; status?: string } | string; error?: { message?: string } };
    if (!res.ok) {
      const msg = body.error?.message || (typeof body.result === 'string' ? body.result : `HTTP ${res.status}`);
      if (/external.?id/i.test(msg)) return { status: 'sent', detail: 'Already sent to Printful earlier.' };
      return { status: 'failed', detail: `Printful refused the order: ${msg}` };
    }
    const r = typeof body.result === 'object' ? body.result : undefined;
    return {
      status: 'sent',
      detail: confirm
        ? `Printful order #${r?.id} placed (${r?.status}). Printful prints and ships it.`
        : `Printful draft order #${r?.id} created. Open Printful → Orders and click Confirm to print and ship it.`,
    };
  } catch (e) {
    return { status: 'failed', detail: `Couldn’t reach Printful: ${e instanceof Error ? e.message : e}` };
  }
}

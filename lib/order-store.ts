import 'server-only';
import { supabaseAdmin } from './supabase/server';
import type { Order } from './orders';

// Saves a paid order so the customer can see it (and its tracking) in their
// account. Safe to run twice for the same order (Stripe sometimes retries).
// Never throws: the order email matters more than this.
export async function saveOrder(order: Order): Promise<void> {
  const db = supabaseAdmin();
  if (!db) {
    console.warn(`Order ${order.id}: not saved for the account page (SUPABASE_SECRET_KEY is not set).`);
    return;
  }
  try {
    const { error } = await db.from('orders').upsert(
      {
        id: order.id,
        user_id: order.userId ?? null,
        email: order.customer.email ?? null,
        created_at: order.created.toISOString(),
        customer_name: order.customer.name || null,
        phone: order.customer.phone ?? null,
        ship_to: order.shipTo,
        shipping_label: order.shippingLabel,
        items_total: order.totals.items,
        shipping_total: order.totals.shipping,
        tax_total: order.totals.tax,
        total: order.totals.total,
        live: order.live,
      },
      { onConflict: 'id', ignoreDuplicates: false },
    );
    if (error) throw new Error(error.message);
    await db.from('order_items').delete().eq('order_id', order.id);
    const { error: e2 } = await db.from('order_items').insert(
      order.lines.map((l) => ({
        order_id: order.id,
        handle: l.handle ?? null,
        name: l.name,
        part_number: l.partNumber ?? null,
        qty: l.qty,
        unit_price: l.unit,
        kind: l.kind,
        supplier: l.supplier ?? null,
      })),
    );
    if (e2) throw new Error(e2.message);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`Order ${order.id}: couldn’t save for the account page: ${msg}${/relation|does not exist/.test(msg) ? ' (run supabase/accounts.sql)' : ''}`);
  }
}

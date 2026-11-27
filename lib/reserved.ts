import 'server-only';
import { supabaseAdmin } from './supabase/server';
import { MAX_PER_ORDER, STOCK_BUFFER } from './stock';

// Golden Star's stock is only read every so often (the scraper's `npm run stock`).
// Parts sold here since that read haven't come off Golden Star's count yet, so
// they're counted here. Otherwise two customers could each buy the last few.
//
// Returns, for each Golden Star part with a known stock count, how many can still
// be sold. Parts without a count (McIntyre Made, never checked) are left out.
// If the orders table isn't reachable it returns nothing, and checkout works as before.
export async function stillForSale(handles: string[], opts: { live: boolean; exceptOrder?: string }): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  const db = supabaseAdmin();
  if (!db || !handles.length) return out;
  try {
    const { data: products, error } = await db
      .from('products')
      .select('handle, supplier_id, stock_status, stock_qty, stock_checked_at')
      .in('handle', handles);
    if (error || !products) return out;
    const counted = (products as { handle: string; supplier_id: string; stock_status: string | null; stock_qty: number | null; stock_checked_at: string | null }[])
      .filter((p) => p.supplier_id !== 'mcintyre' && (p.stock_status === 'in' || p.stock_status === 'out'));
    if (!counted.length) return out;

    const oldest = counted.map((p) => p.stock_checked_at).filter(Boolean).sort()[0];
    const sold = new Map<string, number>();
    if (oldest) {
      const { data: items, error: e2 } = await db
        .from('order_items')
        .select('handle, qty, order_id, orders!inner(created_at, live, status)')
        .in('handle', counted.map((p) => p.handle))
        .eq('orders.live', opts.live)
        .neq('orders.status', 'cancelled')
        .gte('orders.created_at', oldest);
      if (!e2 && items) {
        for (const it of items as unknown as { handle: string; qty: number; order_id: string; orders: { created_at: string } }[]) {
          if (it.order_id === opts.exceptOrder) continue;
          const checked = counted.find((p) => p.handle === it.handle)?.stock_checked_at;
          if (checked && it.orders.created_at < checked) continue; // already off Golden Star's count
          sold.set(it.handle, (sold.get(it.handle) || 0) + it.qty);
        }
      }
    }
    for (const p of counted) {
      const left = p.stock_status === 'out' || !p.stock_qty ? 0 : Math.max(0, p.stock_qty - STOCK_BUFFER - (sold.get(p.handle) || 0));
      out.set(p.handle, Math.min(MAX_PER_ORDER, left));
    }
  } catch (e) {
    console.error('Stock check against recent orders failed:', e instanceof Error ? e.message : e);
  }
  return out;
}

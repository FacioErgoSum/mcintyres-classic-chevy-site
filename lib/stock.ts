// Golden Star's stock, read from goldenstarauto.com by the scraper's
// `npm run stock` (columns stock_status / stock_qty in Supabase).
// Safe to import in the browser and on the server.

// Keep a cushion so we don't sell a part Golden Star runs out of between
// stock checks: if Golden Star shows 10 in stock, sell at most 8 (Dad, Nov 2026).
export const STOCK_BUFFER = 2;
// Most of one part per order when stock isn't known (McIntyre Made, other makes).
export const MAX_PER_ORDER = 50;

export type Stock = {
  status: 'in' | 'out' | 'unknown';
  qty: number | null; // what Golden Star shows; 10 means "10+"
  maxQty: number; // most a customer can order; 0 when out of stock
};

export function stockFor(status: string | null | undefined, qty: number | null | undefined, mcintyreMade: boolean): Stock {
  if (mcintyreMade || (status !== 'in' && status !== 'out')) return { status: 'unknown', qty: null, maxQty: MAX_PER_ORDER };
  if (status === 'out' || !qty || qty <= 0) return { status: 'out', qty: 0, maxQty: 0 };
  // At least 1 when Golden Star still shows some in stock.
  return { status: 'in', qty, maxQty: Math.min(MAX_PER_ORDER, Math.max(1, qty - STOCK_BUFFER)) };
}

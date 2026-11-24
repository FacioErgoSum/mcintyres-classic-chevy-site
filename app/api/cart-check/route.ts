import { NextResponse } from 'next/server';
import { getPart } from '@/lib/catalog';
import { getMerchLine } from '@/lib/merch';

export type CartCheck = {
  name: string;
  price: number;
  freight: boolean;
  kind?: 'mailer' | 'printed';
  goldenStar?: boolean; // ships from Golden Star (their packing fee applies)
  maxQty?: number; // most that can be ordered right now; 0 = out of stock
};

// POST { handles } -> today's price, shipping type and stock for each part in a
// cart, so a cart saved in the browser last week still shows the right numbers.
export async function POST(req: Request) {
  let handles: string[] = [];
  try {
    handles = ((await req.json()).handles || []).filter((h: unknown) => typeof h === 'string').slice(0, 50);
  } catch {
    return NextResponse.json({ parts: {} });
  }
  const parts: Record<string, CartCheck> = {};
  for (const h of handles) {
    if (h.startsWith('merch:')) {
      const m = await getMerchLine(h);
      if (m) parts[h] = { name: m.name, price: m.price, freight: false, kind: m.item.fulfillment };
      continue;
    }
    const p = await getPart(h);
    if (p) parts[h] = { name: p.name, price: p.price, freight: p.freight, goldenStar: !p.mcintyreMade, maxQty: p.stock.maxQty };
  }
  return NextResponse.json({ parts });
}

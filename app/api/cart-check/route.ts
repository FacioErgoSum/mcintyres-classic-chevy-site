import { NextResponse } from 'next/server';
import { getPart } from '@/lib/catalog';

// POST { handles } -> today's price and shipping type for each part in a cart,
// so a cart saved in the browser last week still shows the right numbers.
export async function POST(req: Request) {
  let handles: string[] = [];
  try {
    handles = ((await req.json()).handles || []).filter((h: unknown) => typeof h === 'string').slice(0, 50);
  } catch {
    return NextResponse.json({ parts: {} });
  }
  const parts: Record<string, { name: string; price: number; freight: boolean }> = {};
  for (const h of handles) {
    const p = await getPart(h);
    if (p) parts[h] = { name: p.name, price: p.price, freight: p.freight };
  }
  return NextResponse.json({ parts });
}

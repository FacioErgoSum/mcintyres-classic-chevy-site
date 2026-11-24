import { NextResponse } from 'next/server';
import { recommend } from '@/lib/recommend';

// POST { handles: string[] } -> suggestions for the cart
export async function POST(req: Request) {
  let handles: string[] = [];
  try {
    const body = await req.json();
    handles = (body.handles || []).filter((h: unknown) => typeof h === 'string').slice(0, 30);
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
  const suggestions = await recommend(handles);
  return NextResponse.json({
    suggestions: suggestions.map(({ part, reason }) => ({
      handle: part.handle,
      name: part.name,
      price: part.price,
      freight: part.freight,
      mcintyreMade: part.mcintyreMade,
      maxQty: part.stock.status === 'in' ? part.stock.maxQty : undefined,
      images: part.images[0] ? [part.images[0].thumb, part.images[0].original] : [],
      reason,
    })),
  });
}

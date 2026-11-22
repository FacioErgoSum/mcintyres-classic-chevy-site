import 'server-only';
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { fitmentFromTitle, fits, type Fitment } from './fitment';
import { areasFor, type AreaId } from './areas';
import { needsFreight } from './shipping';

export type Photo = { thumb: string; large: string; original: string };

export type Part = {
  handle: string;
  partNumber: string | null;
  name: string; // plain name when Dad has written one, otherwise the supplier title
  title: string;
  description: string;
  price: number;
  images: Photo[]; // each photo: small copy for lists, large copy for the part page, original as fallback
  areas: AreaId[];
  fitment: Fitment;
  mcintyreMade: boolean;
  freight: boolean;
};

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const BUCKET = 'product-images';

type Row = {
  handle: string;
  supplier_id: string;
  part_number: string | null;
  title: string;
  plain_name: string | null;
  description: string | null;
  our_description: string | null;
  retail_price: number | null;
  available: boolean | null;
  product_images: { position: number; source_url: string | null; storage_path: string | null }[];
  product_categories: { category_path: string }[];
};

// Golden Star's copy repeats the title and advertises Golden Star; keep the facts.
function cleanDescription(text: string, title: string): string {
  let t = text.replace(/\s+/g, ' ').trim();
  while (t.toLowerCase().startsWith(title.toLowerCase())) t = t.slice(title.length).trim();
  return t
    .split(/(?<=[.!?])\s+/)
    .filter((s) => !/golden star|at the price you want|we are proud to offer/i.test(s))
    .join(' ')
    .trim();
}

function toPart(r: Row): Part | null {
  if (r.retail_price == null || r.retail_price <= 0) return null;
  const images: Photo[] = [...(r.product_images || [])]
    .sort((a, b) => a.position - b.position)
    .flatMap((i): Photo[] => {
      if (i.storage_path && URL) {
        // copies made by the scraper's `npm run sizes`: 1.jpg -> 1-thumb.webp, 1-large.webp
        const base = `${URL}/storage/v1/object/public/${BUCKET}/`;
        const stem = i.storage_path.replace(/\.\w+$/, '');
        return [{ thumb: `${base}${stem}-thumb.webp`, large: `${base}${stem}-large.webp`, original: base + i.storage_path }];
      }
      return i.source_url ? [{ thumb: i.source_url, large: i.source_url, original: i.source_url }] : [];
    });
  const cats = (r.product_categories || []).map((c) => c.category_path);
  return {
    handle: r.handle,
    partNumber: r.part_number,
    name: r.plain_name || r.title,
    title: r.title,
    description: r.our_description || (r.supplier_id === 'mcintyre' ? r.description || '' : cleanDescription(r.description || '', r.title)),
    price: Number(r.retail_price),
    images,
    areas: areasFor(cats, r.title),
    fitment: fitmentFromTitle(r.title),
    mcintyreMade: r.supplier_id === 'mcintyre',
    freight: r.supplier_id === 'mcintyre' ? false : needsFreight(r.title, Number(r.retail_price)),
  };
}

async function fromSupabase(): Promise<Part[]> {
  const db = createClient(URL!, KEY!, { auth: { persistSession: false } });
  const rows: Row[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db
      .from('products')
      .select('handle, supplier_id, part_number, title, plain_name, description, our_description, retail_price, available, product_images(position, source_url, storage_path), product_categories(category_path)')
      .eq('is_published', true)
      .order('title')
      .range(from, from + 999);
    if (error) throw new Error(`Supabase: ${error.message}`);
    rows.push(...(data as unknown as Row[]));
    if (!data || data.length < 1000) break;
  }
  return rows.map(toPart).filter((p): p is Part => !!p);
}

// Local development without Supabase: read the scraper's products.json.
function fromLocalJson(file: string): Part[] {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, any>;
  const rows: Row[] = Object.values(raw).map((p: any) => ({
    handle: p.handle,
    supplier_id: 'golden_star',
    part_number: p.part_number,
    title: p.title,
    plain_name: null,
    description: p.description,
    our_description: null,
    retail_price: p.price,
    available: p.available,
    product_images: (p.images || []).map((u: string, i: number) => ({ position: i + 1, source_url: u, storage_path: null })),
    product_categories: (p.categories || []).map((c: string) => ({ category_path: c })),
  }));
  rows.unshift({
    handle: 'mcintyre-lower-inner-quarter-patch',
    supplier_id: 'mcintyre',
    part_number: 'T5000013',
    title: '1955-1957 Chevy Lower Inner Quarter Patch Panel, Left or Right',
    plain_name: 'Lower inner quarter patch panel (left or right)',
    our_description: null,
    description: 'Made in USA exclusively by McIntyre’s Classic Chevy. 18 ga. laser-cut steel. Sold individually. Fits all 1955-57 2-door models except convertible: perfect fit on sedan, wagon, sedan delivery and Nomad; hardtop needs minor trimming. If you are replacing the floor, you probably need these.',
    retail_price: 60,
    available: true,
    product_images: [],
    product_categories: [{ category_path: '/tri-five/Body-Components/Quarter-Panels' }],
  });
  return rows.map(toPart).filter((p): p is Part => !!p);
}

let cache: { at: number; parts: Part[] } | null = null;
const TTL_MS = 10 * 60 * 1000;

export async function allParts(): Promise<Part[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.parts;
  let parts: Part[];
  if (URL && KEY) parts = await fromSupabase();
  else if (process.env.LOCAL_PRODUCTS_JSON) parts = fromLocalJson(process.env.LOCAL_PRODUCTS_JSON);
  else throw new Error('No catalog: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env');
  cache = { at: Date.now(), parts };
  return parts;
}

export async function getPart(handle: string) {
  return (await allParts()).find((p) => p.handle === handle) ?? null;
}

export type Filter = { year?: number; body?: string; area?: string; q?: string };

export async function findParts({ year, body, area, q }: Filter): Promise<Part[]> {
  const words = (q || '').toLowerCase().split(/\s+/).filter(Boolean);
  return (await allParts()).filter((p) => {
    if (!fits(p.fitment, year, body)) return false;
    if (area && !p.areas.includes(area as AreaId)) return false;
    if (words.length) {
      const hay = `${p.name} ${p.title} ${p.partNumber ?? ''}`.toLowerCase();
      if (!words.every((w) => hay.includes(w))) return false;
    }
    return true;
  });
}

export const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: Number.isInteger(n) ? 0 : 2 });

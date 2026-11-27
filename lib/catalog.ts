import 'server-only';
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { fitmentFromTitle, fits, type Fitment } from './fitment';
import { areasFor, type AreaId } from './areas';
import { needsFreight } from './shipping';
import { lineFromCategories } from './lines';
import { shortYears } from './years';
import { stockFor, type Stock } from './stock';

export type Photo = { thumb: string; large: string; original: string };

export type Part = {
  handle: string;
  partNumber: string | null;
  name: string; // plain name when Dad has written one, otherwise the supplier title
  title: string;
  description: string;
  facts: { label: string; value: string }[]; // short spec lines such as Placement or Dimensions
  price: number;
  images: Photo[]; // each photo: small copy for lists, large copy for the part page, original as fallback
  areas: AreaId[];
  fitment: Fitment;
  line: string; // 'tri-five' or a Golden Star section such as 'impala'
  triFive: boolean;
  mcintyreMade: boolean;
  freight: boolean;
  /** Complete bodies: freight is quoted per order, so they can't be bought online. */
  quoteOnly: boolean;
  stock: Stock; // Golden Star's stock and the most a customer can order
};

// Complete bodies ship by special truck freight that Golden Star quotes per order
// ("Freight - Need special quote"), so the flat freight rate can't cover them.
export const isQuoteOnly = (title: string, cats: string[]) =>
  cats.some((c) => c.startsWith('/body-shells')) || /body shell|body skel/i.test(title);

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const LOCAL = process.env.LOCAL_PRODUCTS_JSON;
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
  vehicle_line?: string | null;
  stock_status?: string | null;
  stock_qty?: number | null;
  product_images: { position: number; source_url: string | null; storage_path: string | null }[];
  product_categories: { category_path: string }[];
};

const BASE_COLUMNS =
  'handle, supplier_id, part_number, title, plain_name, description, our_description, retail_price, available, vehicle_line, product_images(position, source_url, storage_path), product_categories(category_path)';
// Stock columns come from the scraper's supabase/2026-11-stock.sql. Until that's
// been run, the site reads without them and sells every part as before.
let hasStockColumns = true;
const columns = () => (hasStockColumns ? BASE_COLUMNS.replace('vehicle_line, ', 'vehicle_line, stock_status, stock_qty, ') : BASE_COLUMNS);
// Runs a query, and once more without the stock columns if they don't exist yet.
async function withColumns<T extends { error: { message: string } | null }>(run: (cols: string) => PromiseLike<T>): Promise<T> {
  const res = await run(columns());
  if (res.error && hasStockColumns && /stock_/.test(res.error.message)) {
    hasStockColumns = false;
    console.warn('Supabase has no stock columns yet (run golden-star-scraper/supabase/2026-11-stock.sql); selling without stock limits.');
    return run(columns());
  }
  return res;
}

// Golden Star's copy repeats the title and advertises Golden Star; keep the facts.
function cleanDescription(text: string, title: string): string {
  let t = text.replace(/\s+/g, ' ').trim();
  while (t.toLowerCase().startsWith(title.toLowerCase())) t = t.slice(title.length).trim();
  return t
    .split(/(?<=[.!?])\s+/)
    .filter((s) => !/golden star|at the price you want|we are proud to offer/i.test(s))
    .map((s) => s.replace(/Available Shipping:?\s*(oversized\s+ground|ground|freight)\s*/i, ''))
    .join(' ')
    .trim();
}

// Golden Star's descriptions are a flattened spec list wrapped in sales copy:
//   "<title> by Golden Star Auto. If your old … Information: Fender Brace Backed by a
//    limited warranty Years: 1970, 1971 Placement: Left Hand - Driver's Side Available
//    Shipping: Ground Over the years your original … at the price you want!"
// Keep the facts, drop the labels and the sales copy.
const LABELS = /(Information|PLEASE NOTE|Month and Years|Years|Placement|Color|[A-Z][\w ]{0,30}?Dimensions|Available Shipping|Installation video)\s*:/g;

function spanYears(list: string): string {
  const ys = (list.match(/\b(19|20)\d\d\b/g) || []).map(Number);
  if (!ys.length) return list.trim();
  const run = ys.every((y, i) => i === 0 || y === ys[i - 1] + 1);
  const short = (y: number) => `’${String(y).slice(-2)}`;
  return ys.length > 1 && run ? `${short(ys[0])}–${short(ys[ys.length - 1])}` : ys.map(short).join(', ');
}

function parseGoldenStar(text: string, title: string): { description: string; facts: Part['facts'] } | null {
  const t = text.replace(/\s+/g, ' ');
  const start = t.search(/Information\s*:/);
  if (start < 0) return null;
  const end = t.indexOf('Over the years your original', start);
  const body = t.slice(start, end < 0 ? undefined : end).replace(/Backed by a limited warranty\.?/gi, ' ');
  const parts: { label: string; value: string }[] = [];
  const marks = [...body.matchAll(LABELS)];
  marks.forEach((m, i) => {
    const from = m.index! + m[0].length;
    const to = i + 1 < marks.length ? marks[i + 1].index! : body.length;
    parts.push({ label: m[1].trim(), value: body.slice(from, to).trim() });
  });
  const get = (re: RegExp) => parts.find((p) => re.test(p.label))?.value || '';
  const facts: Part['facts'] = [];
  const placement = get(/^Placement$/);
  if (placement && !/per product specifications/i.test(placement)) facts.push({ label: 'Placement', value: placement });
  for (const d of parts.filter((p) => /Dimensions$/.test(p.label) && p.value)) facts.push({ label: d.label, value: d.value });
  const color = get(/^Color$/);
  if (color) facts.push({ label: 'Color', value: color });
  const years = get(/Years$/);
  if (years) facts.push({ label: 'Years', value: spanYears(years) });
  const note = get(/^PLEASE NOTE$/)
    .split(/(?<=[.!?])\s+/)
    .filter((x) => x && !/golden star|call or email us/i.test(x))
    .join(' ');
  if (note) facts.push({ label: 'Note', value: note });
  let description = get(/^Information$/);
  if (description.toLowerCase() === title.toLowerCase()) description = '';
  return { description, facts };
}

// Golden Star's photos live on Shopify's image server, which resizes on request.
function shopifySized(url: string, width: number) {
  if (!/cdn\.shopify\.com/.test(url)) return url;
  return url + (url.includes('?') ? '&' : '?') + `width=${width}`;
}

function toPart(r: Row): Part | null {
  if (r.retail_price == null || r.retail_price <= 0) return null;
  const images: Photo[] = [...(r.product_images || [])]
    .sort((a, b) => a.position - b.position)
    .flatMap((i): Photo[] => {
      if (i.storage_path && URL) {
        // copies made by the scraper's `npm run sizes`: 1.jpg -> 1-thumb.webp, 1-large.webp.
        // The full-size original stays on Golden Star's image server.
        const base = `${URL}/storage/v1/object/public/${BUCKET}/`;
        const stem = i.storage_path.replace(/\.\w+$/, '');
        return [{ thumb: `${base}${stem}-thumb.webp`, large: `${base}${stem}-large.webp`, original: i.source_url || base + i.storage_path }];
      }
      const u = i.source_url;
      if (!u) return [];
      // our own photos kept with the site: /photos/parts/name-1-large.webp (+ -thumb.webp)
      if (u.startsWith('/')) return [{ thumb: u.replace('-large.', '-thumb.'), large: u, original: u }];
      return [{ thumb: shopifySized(u, 400), large: shopifySized(u, 1400), original: u }];
    });
  const cats = (r.product_categories || []).map((c) => c.category_path);
  const line = r.supplier_id === 'mcintyre' ? 'tri-five' : r.vehicle_line || lineFromCategories(cats, r.title);
  const triFive = line === 'tri-five';
  return {
    handle: r.handle,
    partNumber: r.part_number,
    name: shortYears(r.plain_name || r.title),
    title: r.title,
    ...describe(r),
    price: Number(r.retail_price),
    images,
    areas: triFive ? areasFor(cats, r.title) : [],
    fitment: fitmentFromTitle(r.title),
    line,
    triFive,
    mcintyreMade: r.supplier_id === 'mcintyre',
    freight: r.supplier_id === 'mcintyre' ? false : needsFreight(r.title, Number(r.retail_price), r.description),
    quoteOnly: isQuoteOnly(r.title, cats),
    stock: stockFor(r.stock_status, r.stock_qty, r.supplier_id === 'mcintyre'),
  };
}

function describe(r: Row): { description: string; facts: Part['facts'] } {
  if (r.our_description) return { description: shortYears(r.our_description), facts: [] };
  if (r.supplier_id === 'mcintyre') return { description: shortYears(r.description || ''), facts: [] };
  const parsed = parseGoldenStar(r.description || '', r.title);
  if (parsed) return { description: shortYears(parsed.description), facts: parsed.facts };
  return { description: shortYears(cleanDescription(r.description || '', r.title)), facts: [] };
}

const db = () => createClient(URL!, KEY!, { auth: { persistSession: false } });

// ---------- Tri-Five: the whole line is kept in memory (about 800 parts) ----------

async function triFiveFromSupabase(): Promise<Part[]> {
  const rows: Row[] = [];
  for (let from = 0; ; from += 1000) {
    let res: { data: unknown[] | null; error: { message: string } | null } = await withColumns((cols) =>
      db()
        .from('products')
        .select(cols)
        .eq('is_published', true)
        .or('vehicle_line.eq.tri-five,vehicle_line.is.null')
        .order('title')
        .range(from, from + 999),
    );
    if (res.error && /vehicle_line/.test(res.error.message)) {
      // supabase/2026-11-full-catalog.sql hasn't been run yet: everything is Tri-Five
      res = await db().from('products').select(BASE_COLUMNS.replace('vehicle_line, ', '')).eq('is_published', true).order('title').range(from, from + 999);
    }
    if (res.error) throw new Error(`Supabase: ${res.error.message}`);
    rows.push(...(res.data as unknown as Row[]));
    if (!res.data || res.data.length < 1000) break;
  }
  return rows.map(toPart).filter((p): p is Part => !!p && p.triFive);
}

// Local development without Supabase: read the scraper's products.json.
let localRows: Row[] | null = null;
function localAll(): Row[] {
  if (localRows) return localRows;
  const raw = JSON.parse(fs.readFileSync(LOCAL!, 'utf8')) as Record<string, any>;
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
    vehicle_line: lineFromCategories(p.categories || [], p.title),
    product_images: (p.images || []).map((u: string, i: number) => ({ position: i + 1, source_url: u, storage_path: null })),
    product_categories: (p.categories || []).map((c: string) => ({ category_path: c })),
  }));
  const ours = (handle: string, title: string, plain: string, price: number, description: string): Row => ({
    handle, supplier_id: 'mcintyre', part_number: null, title, plain_name: plain, description, our_description: null,
    retail_price: price, available: true, vehicle_line: 'tri-five', product_images: [],
    product_categories: [{ category_path: '/tri-five/Body-Components/Quarter-Panels' }],
  });
  const patch = 'Made in USA by McIntyre’s Classic Chevy. 18 ga. laser-cut steel. Fits all ’55–’57 2-door models except convertible. If you are replacing the floor, you probably need these.';
  rows.unshift(
    ours('mcintyre-lower-inner-quarter-patch-lh', '1955-1957 Chevy 2 Door Sedan/Wagon/Nomad/Sedan Delivery/Hardtop Lower Inner Quarter Patch, LH (Except Convertible)', 'Lower inner quarter patch panel, left (driver side)', 60, patch),
    ours('mcintyre-lower-inner-quarter-patch-rh', '1955-1957 Chevy 2 Door Sedan/Wagon/Nomad/Sedan Delivery/Hardtop Lower Inner Quarter Patch, RH (Except Convertible)', 'Lower inner quarter patch panel, right (passenger side)', 60, patch),
    { ...ours('mcintyre-convertible-rear-seat-back-bracket', '1955-1957 Chevy Convertible Rear Seat Back Brackets, Pair', 'Convertible rear seat back brackets (pair)', 45, 'Made in USA by McIntyre’s. Sold as a pair. Weld to the floor of ’55–’57 convertibles.'), product_categories: [{ category_path: '/tri-five/Interior/Seat-Related' }],
      product_images: [1, 2].map((n) => ({ position: n, source_url: `/photos/parts/convertible-seat-back-brackets-${n}-large.webp`, storage_path: null })) },
  );
  return (localRows = rows);
}

let cache: { at: number; parts: Part[] } | null = null;
const TTL_MS = 10 * 60 * 1000;

/** Every published Tri-Five part (the site's focus). */
export async function allParts(): Promise<Part[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.parts;
  let parts: Part[];
  if (URL && KEY) parts = await triFiveFromSupabase();
  else if (LOCAL) parts = localAll().map(toPart).filter((p): p is Part => !!p && p.triFive);
  else throw new Error('No catalog: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env');
  cache = { at: Date.now(), parts };
  return parts;
}

/** Any published part, Tri-Five or not. */
export async function getPart(handle: string): Promise<Part | null> {
  const tri = (await allParts()).find((p) => p.handle === handle);
  if (tri) return tri;
  if (URL && KEY) {
    const { data } = await withColumns((cols) => db().from('products').select(cols).eq('is_published', true).eq('handle', handle).maybeSingle());
    return data ? toPart(data as unknown as Row) : null;
  }
  if (LOCAL) {
    const r = localAll().find((x) => x.handle === handle);
    return r ? toPart(r) : null;
  }
  return null;
}

export type Filter = { year?: number; body?: string; area?: string; q?: string };

const wordsOf = (q?: string) => (q || '').toLowerCase().split(/\s+/).map((w) => w.replace(/[^a-z0-9.\-/&]/g, '')).filter(Boolean);

const esc = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const SMALL_BITS = /\b(braces?|brackets?|patch(es)?|supports?|clips?|extensions?|reinforcements?|gaskets?|seals?|plugs?|hardware|bolts?|screws?)\b/i;

// How well a part matches a search, so the part people mean comes first:
// the exact phrase beats the words apart, whole words beat parts of words
// ("pan" in "panel"), and the main panel beats its braces and patches
// unless those were searched for.
function searchScore(p: Part, words: string[]): number {
  // "2 Door" and "4 Door" describe the car, not the part
  const text = `${p.name} ${p.title}`.toLowerCase().replace(/\b\d\s*-?\s*(door|dr)s?\b/g, ' ');
  const pn = (p.partNumber ?? '').toLowerCase();
  let score = 0;
  if (pn && words.join(' ') === pn) score += 1000;
  else if (pn && words.some((w) => pn.startsWith(w) && w.length > 3)) score += 300;
  const phrase = words.join(' ');
  if (words.length > 1 && new RegExp(`\\b${esc(phrase)}(s|es)?\\b`).test(text)) score += 100;
  for (const w of words) {
    if (new RegExp(`\\b${esc(w)}(s|es)?\\b`).test(text)) score += 20;
    else if (new RegExp(`\\b${esc(w)}`).test(text)) score += 5;
  }
  // "Kit with Factory Style Hood" or "Hood Latch" are not the hood itself
  const title = p.title.toLowerCase().replace(/\b\d\s*-?\s*(door|dr)s?\b/g, ' ').replace(/\s*\(.*?\)\s*/g, ' ').replace(/[,\s]+(lh|rh|pair|set)\s*$/i, '').trim();
  const at = title.search(new RegExp(`\\b${esc(words[0])}`));
  const joiner = title.search(/\b(with|w\/|incl|for|to|fits?|inside|behind|under)\b/);
  if (joiner >= 0 && at > joiner) score -= 25;
  if (new RegExp(`\\b${esc(words[words.length - 1])}(s|es)?$`).test(title)) score += 10;
  const small = SMALL_BITS.exec(p.title);
  if (small && !words.some((w) => small[0].toLowerCase().startsWith(w))) score -= 30;
  return score;
}

/** Tri-Five parts matching the planner or a search, best match first. */
export async function findParts({ year, body, area, q }: Filter): Promise<Part[]> {
  const words = wordsOf(q);
  const found = (await allParts()).filter((p) => {
    if (!fits(p.fitment, year, body)) return false;
    if (area && !p.areas.includes(area as AreaId)) return false;
    if (words.length) {
      const hay = `${p.name} ${p.title} ${p.partNumber ?? ''}`.toLowerCase();
      if (!words.every((w) => hay.includes(w))) return false;
    }
    return true;
  });
  if (!words.length) return found;
  const scores = new Map(found.map((p) => [p.handle, searchScore(p, words)]));
  return found.sort((a, b) => scores.get(b.handle)! - scores.get(a.handle)! || a.title.localeCompare(b.title));
}

// ---------- Non Tri-Five: looked up from the database on request ----------

/** Non Tri-Five parts, optionally in one vehicle line and/or matching a search. */
export async function findOtherParts({ line, q, limit = 30 }: { line?: string; q?: string; limit?: number }): Promise<{ parts: Part[]; total: number }> {
  const words = wordsOf(q);
  if (URL && KEY) {
    const { data, count, error } = await withColumns((cols) => {
      let query = db().from('products').select(cols, { count: 'exact' }).eq('is_published', true).not('vehicle_line', 'is', null).neq('vehicle_line', 'tri-five');
      if (line) query = query.eq('vehicle_line', line);
      for (const w of words) query = query.or(`title.ilike.%${w}%,part_number.ilike.%${w}%`);
      return query.order('title').range(0, limit - 1);
    });
    if (error) {
      if (/vehicle_line/.test(error.message)) return { parts: [], total: 0 }; // full catalog not loaded yet
      throw new Error(`Supabase: ${error.message}`);
    }
    return { parts: (data as unknown as Row[]).map(toPart).filter((p): p is Part => !!p), total: count ?? 0 };
  }
  if (LOCAL) {
    const all = localAll()
      .filter((r) => r.vehicle_line !== 'tri-five' && (!line || r.vehicle_line === line))
      .filter((r) => !words.length || words.every((w) => `${r.title} ${r.part_number ?? ''}`.toLowerCase().includes(w)))
      .sort((a, b) => a.title.localeCompare(b.title));
    return { parts: all.slice(0, limit).map(toPart).filter((p): p is Part => !!p), total: all.length };
  }
  return { parts: [], total: 0 };
}

export const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: Number.isInteger(n) ? 0 : 2 });

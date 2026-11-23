import 'server-only';
import { createClient } from '@supabase/supabase-js';

// McIntyre's merch, kept in the Supabase table `merch`
// (golden-star-scraper/supabase/2026-11-merch-and-orders.sql).
//
// fulfillment:
//   'mailer'  – small things we stock and mail from Scranton (pins, keychains, decals, patches)
//   'printed' – printed and shipped by Printful (shirts, totes, posters)
// options: sizes or styles, e.g. [{ "label": "M", "printful_sync_variant_id": 4321 }]
//   For Printful items every option needs its Printful "sync variant" id.

export type MerchOption = { label: string; printful_sync_variant_id?: number | null; price?: number | null };
export type MerchItem = {
  handle: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  fulfillment: 'mailer' | 'printed';
  options: MerchOption[]; // empty = one size
};

export type MerchLine = {
  key: string; // merch:<handle>:<option>
  item: MerchItem;
  option: MerchOption | null;
  name: string;
  price: number;
};

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

type Row = {
  handle: string;
  name: string;
  description: string | null;
  price: number;
  images: string[] | null;
  fulfillment: 'mailer' | 'printed';
  options: MerchOption[] | null;
};

const toItem = (r: Row): MerchItem => ({
  handle: r.handle,
  name: r.name,
  description: r.description || '',
  price: Number(r.price),
  images: r.images || [],
  fulfillment: r.fulfillment,
  options: r.options || [],
});

// Example items for local testing without Supabase (LOCAL_PRODUCTS_JSON mode only).
const SAMPLE: MerchItem[] = [
  {
    handle: 'motel-keychain-room-57',
    name: 'Motel Keychain, Room 57',
    description: 'Classic motel-style key tag with the McIntyre’s logo.',
    price: 12,
    images: [],
    fulfillment: 'mailer',
    options: [],
  },
  {
    handle: 'clover-tee',
    name: 'Clover T-Shirt',
    description: 'Soft cotton tee with the McIntyre’s Tri-Five clover.',
    price: 28,
    images: [],
    fulfillment: 'printed',
    options: ['S', 'M', 'L', 'XL', '2XL'].map((label) => ({ label, printful_sync_variant_id: null })),
  },
];

let cache: { at: number; items: MerchItem[] } | null = null;

/** Published merch, in display order. Empty if the merch table doesn't exist yet. */
export async function allMerch(): Promise<MerchItem[]> {
  if (cache && Date.now() - cache.at < 10 * 60 * 1000) return cache.items;
  let items: MerchItem[] = [];
  if (URL && KEY) {
    const { data, error } = await createClient(URL, KEY, { auth: { persistSession: false } })
      .from('merch')
      .select('handle, name, description, price, images, fulfillment, options')
      .eq('is_published', true)
      .order('sort')
      .order('name');
    if (error) {
      if (!/merch/.test(error.message)) console.error('Merch:', error.message);
    } else items = (data as Row[]).map(toItem);
  } else if (process.env.LOCAL_PRODUCTS_JSON) {
    items = SAMPLE;
  }
  cache = { at: Date.now(), items };
  return items;
}

export async function getMerch(handle: string) {
  return (await allMerch()).find((m) => m.handle === handle) || null;
}

export const merchKey = (handle: string, option?: string) => `merch:${handle}:${option ?? ''}`;

/** Resolve a cart key like "merch:clover-tee:L" to today's item, option and price. */
export async function getMerchLine(key: string): Promise<MerchLine | null> {
  const m = key.match(/^merch:([^:]+):(.*)$/);
  if (!m) return null;
  const item = await getMerch(m[1]);
  if (!item) return null;
  const option = m[2] ? item.options.find((o) => o.label === m[2]) || null : null;
  if (item.options.length && !option) return null; // that size is gone
  return {
    key,
    item,
    option,
    name: option && item.options.length > 1 ? `${item.name} (${option.label})` : item.name,
    price: option?.price ?? item.price,
  };
}

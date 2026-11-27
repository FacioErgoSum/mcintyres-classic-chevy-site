import type { MetadataRoute } from 'next';
import { allParts } from '@/lib/catalog';
import { allMerch } from '@/lib/merch';
import { AREAS } from '@/lib/areas';
import { siteUrl } from '@/lib/site';

export const revalidate = 3600;

// /sitemap.xml: every Tri-Five part, merch item and main page, so search engines
// can find a part when someone searches for it by name.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = siteUrl();
  const pages = ['', '/planner', '/parts', '/other', '/mcintyre-made', '/merch', '/about', '/ask', '/shipping-returns', '/terms', '/privacy'];
  const [parts, merch] = await Promise.all([allParts().catch(() => []), allMerch().catch(() => [])]);
  return [
    ...pages.map((p) => ({ url: `${site}${p}`, changeFrequency: 'weekly' as const, priority: p === '' ? 1 : 0.7 })),
    ...AREAS.map((a) => ({ url: `${site}/parts?area=${a.id}`, changeFrequency: 'weekly' as const, priority: 0.6 })),
    ...parts.map((p) => ({ url: `${site}/parts/${p.handle}`, changeFrequency: 'weekly' as const, priority: 0.5 })),
    ...merch.map((m) => ({ url: `${site}/merch/${m.handle}`, changeFrequency: 'monthly' as const, priority: 0.4 })),
  ];
}

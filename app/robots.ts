import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';

// /robots.txt: let search engines in, but keep them out of carts, accounts and checkout.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/cart', '/checkout/', '/account', '/lists/', '/wishlist/', '/auth/'] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}

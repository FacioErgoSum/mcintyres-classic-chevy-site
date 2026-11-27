// The site's public address, from NEXT_PUBLIC_SITE_URL (with or without https://).
export function siteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || '').trim();
  if (!raw || /localhost/.test(raw)) return 'https://mcintyresclassicchevy.com';
  return (/^https?:\/\//.test(raw) ? raw : `https://${raw}`).replace(/\/+$/, '');
}

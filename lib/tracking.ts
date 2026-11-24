// A link to the carrier's tracking page. Freight companies vary, so anything
// we don't recognise becomes a web search for the carrier and number.
export function trackingUrl(carrier: string | null | undefined, number: string): string {
  const n = encodeURIComponent(number.trim());
  const c = (carrier || '').trim().toLowerCase();
  if (c.includes('usps') || c.includes('postal')) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${n}`;
  if (c === 'ups' || c.startsWith('ups ')) return `https://www.ups.com/track?tracknum=${n}`;
  if (c.includes('fedex')) return `https://www.fedex.com/fedextrack/?trknbr=${n}`;
  return `https://www.google.com/search?q=${encodeURIComponent(`${carrier || ''} tracking ${number}`.trim())}`;
}

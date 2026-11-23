// Shipping rules. Golden Star ships big sheet metal by freight and charged
// McIntyre's $200–$460 per order for it, so big panels must carry freight.
// Change these numbers here; checkout and the cart both read them.

export const SMALL_PARCEL_USD = 20; // per order, parts that fit a normal box (Dad, Nov 2026)
export const FREIGHT_USD = 275; // per order containing any big panel (Dad, Nov 2026)

const BIG = /floor pan|trunk floor|cargo floor|quarter panel|hood|fender|door shell|door skin|bumper|body shell|frame assembly|roof panel|tailgate|trunk lid|firewall|front end|sheet metal kit|radiator support|inner quarter panel complete|deck filler|rocker panel|wheelhouse|toe board|dash panel/i;
const SMALL = /bracket|patch|molding|moulding|clip|hinge|latch|gasket|retainer|emblem|script|bezel|handle|louver|splash|guard|bullet|insert|rod|plate|tool|hardware|cover|extension tube|support bar|filler neck|strap|nut|bolt/i;

// Golden Star labels every part in its description: "Available Shipping: Ground",
// "Freight" or "Oversized Ground". Their label decides; only truck freight costs
// the freight rate. Oversized ground (door skins and the like) still goes in a box.
export function shippingLabel(description: string | null | undefined): 'freight' | 'ground' | null {
  const m = (description || '').match(/Available Shipping:?\s*(oversized\s+ground|ground|freight)/i);
  if (!m) return null;
  return /^freight/i.test(m[1]) ? 'freight' : 'ground';
}

export function needsFreight(title: string, price: number, description?: string | null): boolean {
  const label = shippingLabel(description);
  if (label) return label === 'freight';
  // No label (rare): only big, expensive panels go by truck.
  if (price >= 400) return true;
  return price >= 200 && BIG.test(title) && !SMALL.test(title);
}

// Merch ships separately from parts:
// - Small merch (pins, keychains, decals, patches) goes out from Scranton in a
//   mailer. It rides free when the order also has parts.
// - Printed merch (shirts, totes, posters) is printed and shipped by Printful.
export const MERCH_MAILER_USD = 5; // small merch only, no parts in the order
export const PRINTFUL_SHIPPING_USD = 6; // per order with printed merch; match Printful's real rate once set up

export type ShippingLine = { label: string; amount: number };

// The whole order: parts (freight flags), small merch from Scranton, printed merch.
export function shippingForOrder(o: { partsFreight: boolean[]; mailerMerch: number; printedMerch: number }) {
  const lines: ShippingLine[] = [];
  if (o.partsFreight.length) {
    lines.push(o.partsFreight.some(Boolean) ? { label: 'Freight Shipping', amount: FREIGHT_USD } : { label: 'Ground Shipping', amount: SMALL_PARCEL_USD });
  } else if (o.mailerMerch > 0) {
    lines.push({ label: 'Merch Shipping', amount: MERCH_MAILER_USD });
  }
  if (o.printedMerch > 0) lines.push({ label: o.partsFreight.length || o.mailerMerch ? 'Printed Merch Shipping' : 'Merch Shipping', amount: PRINTFUL_SHIPPING_USD });
  const amount = lines.reduce((s, l) => s + l.amount, 0);
  return { lines, amount, label: lines.map((l) => l.label).join(' + ') || 'Shipping', freight: o.partsFreight.some(Boolean) };
}

// Parts only (older callers)
export function shippingFor(freightFlags: boolean[]) {
  const r = shippingForOrder({ partsFreight: freightFlags, mailerMerch: 0, printedMerch: 0 });
  return { label: r.label, amount: r.amount, freight: r.freight };
}

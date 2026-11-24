// Shipping rules. Golden Star ships big sheet metal by freight and charged
// McIntyre's $200–$460 per order for it, so big panels must carry freight.
// Change these numbers here; checkout, the cart and the part pages all read them.

// Golden Star charges a packing fee on every order, before shipping (Dad, Nov 2026).
// Shown as its own line so customers see where the cost comes from.
export const GS_PACKING_FEE_USD = 10;
export const SMALL_PARCEL_USD = 20; // ground shipping for the first part in a box (Dad, Nov 2026)
export const FREIGHT_USD = 275; // per order containing any big panel (Dad, Nov 2026)
export const EXTRA_PART_USD = 3; // each part after the first, counting quantities (Dad, Nov 2026)

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
// One part line in an order. goldenStar: ships from Golden Star (pays their packing fee).
export type ShipPart = { freight: boolean; qty: number; goldenStar: boolean };

// The whole order: parts, small merch from Scranton, printed merch.
export function shippingForOrder(o: { parts: ShipPart[]; mailerMerch: number; printedMerch: number }) {
  const lines: ShippingLine[] = [];
  const count = o.parts.reduce((s, p) => s + Math.max(1, p.qty), 0);
  const freight = o.parts.some((p) => p.freight);
  if (count > 0) {
    lines.push(freight ? { label: 'Freight shipping', amount: FREIGHT_USD } : { label: 'Ground shipping', amount: SMALL_PARCEL_USD });
    if (count > 1) lines.push({ label: `${count - 1} more ${count - 1 === 1 ? 'part' : 'parts'} × ${usd(EXTRA_PART_USD)}`, amount: (count - 1) * EXTRA_PART_USD });
    if (o.parts.some((p) => p.goldenStar)) lines.push({ label: 'Warehouse packing fee', amount: GS_PACKING_FEE_USD });
  } else if (o.mailerMerch > 0) {
    lines.push({ label: 'Merch shipping', amount: MERCH_MAILER_USD });
  }
  if (o.printedMerch > 0) lines.push({ label: count || o.mailerMerch ? 'Printed merch shipping' : 'Merch shipping', amount: PRINTFUL_SHIPPING_USD });
  const amount = lines.reduce((s, l) => s + l.amount, 0);
  // Stripe shows one shipping line, so its name carries the breakdown.
  const label = lines.length > 1 ? lines.map((l) => `${l.label} ${usd(l.amount)}`).join(' + ') : lines[0]?.label || 'Shipping';
  return { lines, amount, label, freight };
}

function usd(n: number) {
  return `$${Number.isInteger(n) ? n : n.toFixed(2)}`;
}

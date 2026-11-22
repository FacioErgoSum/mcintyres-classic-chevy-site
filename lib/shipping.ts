// Shipping rules. Golden Star ships big sheet metal by freight and charged
// McIntyre's $200–$460 per order for it, so big panels must carry freight.
// Change these numbers here; checkout and the cart both read them.

export const SMALL_PARCEL_USD = 15; // per order, parts that fit a normal box
export const FREIGHT_USD = 235; // per order containing any big panel (Golden Star's most common charge)

const BIG = /floor pan|trunk floor|cargo floor|quarter panel|hood|fender|door shell|door skin|bumper|body shell|frame assembly|roof panel|tailgate|trunk lid|firewall|front end|sheet metal kit|radiator support|inner quarter panel complete|deck filler|rocker panel|wheelhouse|toe board|dash panel/i;
const SMALL = /bracket|patch|molding|moulding|clip|hinge|latch|gasket|retainer|emblem|script|bezel|handle|louver|splash|guard|bullet|insert|rod|plate|tool|hardware|cover|extension tube|support bar|filler neck|strap|nut|bolt/i;

export function needsFreight(title: string, price: number): boolean {
  if (price >= 300) return true;
  return BIG.test(title) && !SMALL.test(title);
}

// items: each line's freight flag (true = big sheet metal)
export function shippingFor(freightFlags: boolean[]) {
  if (!freightFlags.length) return { label: 'Shipping', amount: 0, freight: false };
  const freight = freightFlags.some(Boolean);
  return freight
    ? { label: 'Freight shipping (large sheet metal)', amount: FREIGHT_USD, freight: true }
    : { label: 'Shipping', amount: SMALL_PARCEL_USD, freight: false };
}

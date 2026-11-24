// Reads a 1955–57 Chevrolet serial number (the "VIN" plate on the driver's door
// hinge pillar) or the style number from the cowl tag. Safe in the browser.
//
// Serial number, e.g. VC57B123456:
//   V      V8 from the factory (no V = six-cylinder)
//   C      series: A = 150, B = 210 (incl. Delray), C = Bel Air (incl. Nomad), D = sedan delivery
//   57     model year
//   B      assembly plant
//   123456 production number (each plant counted separately)
// It doesn't say the body style; the cowl tag does, e.g. "STYLE 57-1037D":
//   1037 = 210/Bel Air 2-door hardtop ("D" = Bel Air, "F" = wagon).
// Sources: Classic Industries' 1955–57 Chevy VIN decoder and Rick's Tri-Five cowl tag guide.

import type { BodyId, Year } from './fitment';

const SERIES: Record<string, { name: string; bodies: BodyId[] }> = {
  A: { name: '150', bodies: ['2-door-sedan', '4-door-sedan', 'wagon'] },
  B: { name: '210', bodies: ['2-door-sedan', '4-door-sedan', '2-door-hardtop', '4-door-hardtop', 'wagon'] },
  C: { name: 'Bel Air', bodies: ['2-door-sedan', '4-door-sedan', '2-door-hardtop', '4-door-hardtop', 'convertible', 'wagon', 'nomad'] },
  D: { name: 'Sedan Delivery', bodies: ['sedan-delivery'] },
};

const PLANTS: Record<string, string> = {
  A: 'Atlanta, Georgia',
  B: 'Baltimore, Maryland',
  F: 'Flint, Michigan',
  J: 'Janesville, Wisconsin',
  K: 'Kansas City, Missouri',
  L: 'Los Angeles, California',
  N: 'Norwood, Ohio',
  O: 'Oakland, California',
  S: 'St. Louis, Missouri',
  T: 'Tarrytown, New York',
};

// Cowl tag style numbers (Fisher Body).
const STYLES: Record<string, { body: BodyId; name: string }> = {
  '1211': { body: '2-door-sedan', name: '150 2-door sedan' },
  '1219': { body: '4-door-sedan', name: '150 4-door sedan' },
  '1263': { body: 'wagon', name: '150 2-door wagon (Handyman)' },
  '1271': { body: 'sedan-delivery', name: 'Sedan delivery' },
  '1011': { body: '2-door-sedan', name: '210 or Bel Air 2-door sedan' },
  '1019': { body: '4-door-sedan', name: '210 or Bel Air 4-door sedan' },
  '1037': { body: '2-door-hardtop', name: '210 or Bel Air 2-door hardtop' },
  '1039': { body: '4-door-hardtop', name: '210 or Bel Air 4-door hardtop' },
  '1062': { body: 'wagon', name: '210 or Bel Air 4-door wagon' },
  '1063': { body: 'wagon', name: '210 2-door wagon (Handyman)' },
  '1064': { body: 'nomad', name: 'Bel Air Nomad' },
  '1067': { body: 'convertible', name: 'Bel Air convertible' },
};

export type VinResult =
  | { kind: 'serial'; year: Year; v8: boolean; series: string; plant: string | null; bodies: BodyId[]; summary: string }
  | { kind: 'style'; year: Year | null; body: BodyId; summary: string }
  | { kind: 'error'; message: string };

export function decodeVin(raw: string): VinResult {
  const s = raw.toUpperCase().replace(/^(STYLE|ST|VIN)\s*/, '').replace(/[\s.\-–]/g, '');
  if (!s) return { kind: 'error', message: 'Type the number from your car first.' };

  // Serial number: V? + series + year + plant + production number
  const v = s.match(/^(V)?([ABCD])(5[567])([ABFJKLNOST])([0-9O]{5,6})$/);
  if (v) {
    const [, eight, ser, yy, plant] = v;
    const year = (1900 + Number(yy)) as Year;
    const series = SERIES[ser];
    let bodies = series.bodies;
    if (year === 1955) bodies = bodies.filter((b) => b !== '4-door-hardtop'); // the 4-door hardtop arrived in 1956
    const name = ser === 'D' ? `’${yy} Chevrolet sedan delivery` : `’${yy} Chevrolet ${series.name}`;
    return {
      kind: 'serial',
      year,
      v8: !!eight,
      series: series.name,
      plant: PLANTS[plant] ?? null,
      bodies,
      summary: `${name}, ${eight ? 'V8' : 'six-cylinder'}${PLANTS[plant] ? `, built in ${PLANTS[plant]}` : ''}.`,
    };
  }

  // Cowl tag style number: optional year, 4 digits, optional letters (57-1037D)
  const t = s.match(/^(?:(5[567]))?(1[02]\d\d)([A-Z]{0,2})$/);
  if (t && STYLES[t[2]]) {
    const st = STYLES[t[2]];
    const year = t[1] ? ((1900 + Number(t[1])) as Year) : null;
    const belAir = t[3].includes('D') && st.name.includes('Bel Air') ? st.name.replace('210 or Bel Air', 'Bel Air') : st.name;
    return { kind: 'style', year, body: st.body, summary: `${year ? `’${String(year).slice(-2)} ` : ''}${belAir}.` };
  }

  // Looks like a modern 17-character VIN: not a Tri-Five plate
  if (/^[A-HJ-NPR-Z0-9]{17}$/.test(s)) {
    return { kind: 'error', message: 'That looks like a modern 17-character VIN. Tri-Five Chevys have a shorter number, like VC57B123456.' };
  }
  return {
    kind: 'error',
    message: 'We couldn’t read that number. A Tri-Five serial number looks like VC57B123456 (on the driver’s door hinge post). A cowl tag style number looks like 57-1037D.',
  };
}

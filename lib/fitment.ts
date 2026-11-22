// Which Tri-Five cars a part fits, read from its title.
// Golden Star titles are consistent enough to work out year and body style,
// e.g. "1955-1957 Chevy 2 & 4 Door Sedan Complete Floor Pan With Braces".
// When a title names no body style, the part is treated as fitting all of them.

export const YEARS = [1955, 1956, 1957] as const;
export type Year = (typeof YEARS)[number];

export const BODIES = [
  { id: '2-door-sedan', name: '2-door sedan', note: '150, 210, Del Ray' },
  { id: '4-door-sedan', name: '4-door sedan', note: '150, 210, Bel Air' },
  { id: '2-door-hardtop', name: '2-door hardtop', note: 'Sport Coupe' },
  { id: '4-door-hardtop', name: '4-door hardtop', note: '1956 and 1957 only' },
  { id: 'convertible', name: 'Convertible', note: 'Bel Air' },
  { id: 'wagon', name: 'Station wagon', note: 'Handyman, Townsman, Beauville' },
  { id: 'nomad', name: 'Nomad', note: '2-door wagon' },
  { id: 'sedan-delivery', name: 'Sedan delivery', note: '' },
] as const;
export type BodyId = (typeof BODIES)[number]['id'];

const ALL_TWO_DOOR: BodyId[] = ['2-door-sedan', '2-door-hardtop', 'convertible', 'nomad', 'sedan-delivery', 'wagon'];
const ALL_FOUR_DOOR: BodyId[] = ['4-door-sedan', '4-door-hardtop', 'wagon'];

export type Fitment = { years: Year[]; bodies: BodyId[] }; // bodies [] = fits every body style

export function yearsFromTitle(title: string): Year[] {
  const range = title.match(/\b(?:19)?(5\d)\s*-\s*(?:19)?(5\d)\b/);
  let years: number[] = [];
  if (range) {
    for (let y = Number(range[1]); y <= Number(range[2]); y++) years.push(1900 + y);
  } else {
    years = [...title.matchAll(/\b19(5\d)\b/g)].map((m) => 1900 + Number(m[1]));
  }
  const tri = years.filter((y): y is Year => (YEARS as readonly number[]).includes(y));
  return tri.length ? [...new Set(tri)] : [...YEARS];
}

function bodiesIn(text: string): BodyId[] {
  const t = ' ' + text.toLowerCase().replace(/[^a-z0-9&/ ]+/g, ' ').replace(/\s+/g, ' ') + ' ';
  const out = new Set<BodyId>();
  const two = /(2|two)\s*(dr|door)/;
  const four = /(4|four)\s*(dr|door)/;
  const both = /2\s*&\s*4\s*(dr|door)/;

  if (/nomad/.test(t)) out.add('nomad');
  if (/sedan delivery|\bdelivery\b|sd delv/.test(t)) out.add('sedan-delivery');
  if (/wagon/.test(t)) out.add('wagon');
  if (/conv(ertible)?\b/.test(t)) out.add('convertible');

  // hardtops
  if (/hardtop|ht\b/.test(t)) {
    const fourHt = /(4|four)\s*(dr|door)\s*hardtop/.test(t);
    const twoHt = /(2|two)\s*(dr|door)\s*hardtop/.test(t) || both.test(t);
    if (fourHt) out.add('4-door-hardtop');
    if (twoHt || !fourHt) out.add('2-door-hardtop');
  }

  // sedans (not "sedan delivery")
  const sedanText = t.replace(/sedan delivery/g, '');
  if (/sedan|sedna/.test(sedanText)) {
    if (both.test(sedanText)) { out.add('2-door-sedan'); out.add('4-door-sedan'); }
    else if (/(4|four)\s*(dr|door)\s*(sedan|sedna)/.test(sedanText)) out.add('4-door-sedan');
    else if (/(2|two)\s*(dr|door)\s*(sedan|sedna)/.test(sedanText)) out.add('2-door-sedan');
    else { out.add('2-door-sedan'); out.add('4-door-sedan'); }
  }

  // only a door count, no body style
  if (!out.size) {
    if (both.test(t)) return [];
    if (two.test(t)) ALL_TWO_DOOR.forEach((b) => out.add(b));
    else if (four.test(t)) ALL_FOUR_DOOR.forEach((b) => out.add(b));
  }
  return [...out];
}

export function fitmentFromTitle(title: string): Fitment {
  const years = yearsFromTitle(title);
  const lower = title.toLowerCase();
  const cut = lower.search(/\bexclud|\bexcept\b|\bex\b/);
  let bodies = bodiesIn(cut >= 0 ? title.slice(0, cut) : title);
  if (cut >= 0) {
    const excluded = bodiesIn(title.slice(cut));
    if (excluded.includes('wagon')) excluded.push('nomad'); // a Nomad takes wagon parts
    if (!bodies.length) bodies = BODIES.map((b) => b.id).filter((b) => !excluded.includes(b));
    else bodies = bodies.filter((b) => !excluded.includes(b));
  }
  if (/\ball (models|body styles)\b|\ball\b(?! 2)/i.test(title) && bodies.length === 0) bodies = [];
  // 4-door hardtops only existed in 1956-57
  if (bodies.includes('4-door-hardtop') && !years.some((y) => y >= 1956)) bodies = bodies.filter((b) => b !== '4-door-hardtop');
  return { years, bodies };
}

export function fits(f: Fitment, year?: number, body?: string): boolean {
  if (year && !f.years.includes(year as Year)) return false;
  if (body && f.bodies.length && !f.bodies.includes(body as BodyId)) return false;
  return true;
}

export function describeFitment(f: Fitment): string {
  const yrs = f.years.length === 3 ? '1955, 1956 and 1957' : f.years.join(' and ');
  if (!f.bodies.length) return `${yrs} Chevrolet, all body styles`;
  const names = BODIES.filter((b) => f.bodies.includes(b.id)).map((b) => (b.id === 'nomad' ? b.name : b.name.toLowerCase()));
  const list = names.length > 1 ? names.slice(0, -1).join(', ') + ' and ' + names.at(-1) : names[0];
  return `${yrs} Chevrolet ${list}`;
}

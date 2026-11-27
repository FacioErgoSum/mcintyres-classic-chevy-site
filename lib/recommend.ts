import 'server-only';
import { allParts, getPart, type Part } from './catalog';
import type { Fitment } from './fitment';

// Suggestions for the cart, strongest first:
//   1. The other side: a left panel in the cart suggests the matching right one.
//   2. McIntyre Made parts that fit the same cars and the same job.
//   3. Parts that usually go with the job: braces, patches and brackets in the
//      same area of the car, for the same cars, that cost much less than the
//      main part.
//   4. Small add-ons under $40 for the same cars.
// Big freight items are never suggested unless the order already ships by
// freight, so a suggestion never adds $255 of shipping by surprise.
// Later, kits and Danchuk small parts slot in as extra rules here.

export type Suggestion = { part: Part; reason: string };

const SIDE = /\b(LH|RH|left|right|driver(?:'s)?(?: side)?|passenger(?: side)?)\b/gi;
const SWAP: Record<string, string> = { lh: 'rh', rh: 'lh', left: 'right', right: 'left', driver: 'passenger', passenger: 'driver' };
const sideOf = (t: string) => (t.match(/\b(LH|left|driver)/i) ? 'left' : t.match(/\b(RH|right|passenger)/i) ? 'right' : null);
const withoutSide = (t: string) => t.replace(SIDE, '').replace(/[\s,()-]+/g, ' ').trim().toLowerCase();
const otherSideTitle = (t: string) => t.replace(SIDE, (m) => {
  const key = m.toLowerCase().replace(/'s.*| side/g, '');
  const to = SWAP[key];
  if (!to) return m;
  return m === m.toUpperCase() ? to.toUpperCase() : to;
});

function overlaps(a: Fitment, b: Fitment) {
  if (!a.years.some((y) => b.years.includes(y))) return false;
  if (!a.bodies.length || !b.bodies.length) return true;
  return a.bodies.some((x) => b.bodies.includes(x));
}

export async function recommend(handles: string[], max = 4): Promise<Suggestion[]> {
  const catalog = await allParts();
  const inCart = (await Promise.all(handles.map((h) => getPart(h)))).filter((p): p is Part => !!p);
  if (!inCart.length) return [];
  const taken = new Set(handles);
  const cartHasFreight = inCart.some((p) => p.freight);
  const scored = new Map<string, { part: Part; score: number; reason: string }>();
  const offer = (part: Part, score: number, reason: string) => {
    if (taken.has(part.handle)) return;
    if (part.freight && !cartHasFreight) return;
    if (part.stock.status === 'out') return;
    if (part.quoteOnly) return; // complete bodies are quoted by hand
    const prev = scored.get(part.handle);
    if (!prev || prev.score < score) scored.set(part.handle, { part, score, reason });
  };

  for (const item of inCart.filter((p) => p.triFive)) {
    // 1. the other side
    const side = sideOf(item.title);
    if (side) {
      const want = otherSideTitle(item.title).toLowerCase();
      const base = withoutSide(item.title);
      const match =
        catalog.find((p) => p.title.toLowerCase() === want) ??
        catalog.find((p) => p.handle !== item.handle && withoutSide(p.title) === base && sideOf(p.title) && sideOf(p.title) !== side);
      if (match) offer(match, 100, `The ${side === 'left' ? 'right' : 'left'} side to match your ${side === 'left' ? 'left' : 'right'} one`);
    }

    for (const p of catalog) {
      if (p.handle === item.handle || !overlaps(p.fitment, item.fitment)) continue;
      const sameArea = p.areas.some((a) => item.areas.includes(a));
      // 2. our own parts for the same job
      if (p.mcintyreMade && sameArea) offer(p, 80, 'Made by McIntyre’s for this repair');
      else if (p.mcintyreMade && item.areas.some((a) => a === 'floors-trunk' || a === 'quarters-rockers') && p.areas.includes('quarters-rockers'))
        offer(p, 70, 'Made by McIntyre’s. Floor jobs usually need these too');
      // 3. same job, much cheaper (only for big repairs, and never chrome trim for sheet metal work)
      else if (
        sameArea && item.price >= 150 && p.price <= Math.max(60, item.price * 0.4) && p.price < 200 &&
        (!p.areas.includes('trim-emblems') || item.areas.includes('trim-emblems'))
      ) {
        const job = /\b(braces?|brackets?|patch(es)?|supports?|mounts?|reinforcements?|extensions?|hardware|gaskets?)\b/i.test(p.title) && !/\bw\/o\b/i.test(p.title);
        offer(p, (job ? 40 : 25) - p.price / 50, job ? 'Usually needed for the same repair' : 'For the same area of your car');
      }
      // 4. small add-ons
      else if (p.price < 40 && !p.freight) offer(p, 10 - p.price / 10, 'A small add-on for your car');
    }
  }

  // One of each kind: four battery brackets that differ only by series name is one suggestion.
  const kind = (t: string) =>
    t.toLowerCase()
      .replace(/\b(19)?5[5-8]\b|-|\bchevy\b|\bchevrolet\b|one-fifty|two-ten|bel ?air|del ?ray|nomad|series|\b(150|210)\b|\b(lh|rh|left|right)\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  const seen = new Set<string>();
  return [...scored.values()]
    .filter(({ part }) => !/corvette|truck|pickup/i.test(part.title))
    .sort((a, b) => b.score - a.score)
    .filter(({ part, score }) => {
      if (score >= 100 || part.mcintyreMade) return true; // the other side and our own parts always show
      const k = kind(part.title);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, max)
    .map(({ part, reason }) => ({ part, reason }));
}

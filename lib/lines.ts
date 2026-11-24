// Golden Star's vehicle sections. Tri-Five is the site's focus; the rest are
// listed under "Non Tri-Five parts".
export const OTHER_LINES = [
  { id: '49-54-chevy', name: '’49–’54 Chevy cars' },
  { id: 'impala', name: 'Impala and full-size Chevy' },
  { id: 'chevyii-nova', name: 'Chevy II and Nova' },
  { id: 'camaro-firebird', name: 'Camaro and Firebird' },
  { id: 'elcamino-chevelle', name: 'Chevelle and El Camino' },
  { id: '78-88-gm', name: '’78–’88 GM (Monte Carlo, Regal, Cutlass)' },
  { id: 'olds-cutlass', name: 'Oldsmobile Cutlass' },
  { id: 'pontiac', name: 'Pontiac' },
  { id: 'chevy-gmc-truck', name: 'Chevy and GMC trucks' },
  { id: 'body-shells', name: 'Complete body shells' },
  { id: 'ford-mustang', name: 'Ford Mustang' },
  { id: 'ford-bronco', name: 'Ford Bronco' },
  { id: 'ford-trucks', name: 'Ford trucks' },
  { id: 'chrysler', name: 'Chrysler, Dodge and Plymouth cars' },
  { id: 'jeep-dodge', name: 'Jeep and Dodge trucks' },
  { id: 'vw-bus', name: 'Volkswagen Bus' },
  { id: 'mercedes', name: 'Mercedes-Benz' },
  { id: 'other', name: 'Everything else' },
] as const;

export const lineName = (id: string | null | undefined) =>
  id === 'tri-five' || !id ? '’55–’57 Chevy' : OTHER_LINES.find((l) => l.id === id)?.name ?? 'Other cars';

// Same rule as the scraper's lines.js, for local testing from products.json.
const TRI_FIVE_TITLE = /\b(19)?5[5-7]\b.*\b(chevy|chevrolet|bel ?air|nomad|210|150)\b/i;
const NOT_CAR = /truck|pickup|p\/u|c10|3100|gmc|1st series|2nd series|corvette/i;
export function lineFromCategories(cats: string[], title: string): string {
  if (cats.some((c) => c.startsWith('/tri-five'))) return 'tri-five';
  if (cats.some((c) => c.includes('(not in category pages)'))) return 'tri-five';
  const first = cats.find((c) => c.startsWith('/'))?.split('/')[1];
  if (first === 'body-shells' && TRI_FIVE_TITLE.test(title) && !NOT_CAR.test(title)) return 'tri-five';
  return first || 'other';
}

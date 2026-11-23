// Show model years the way car people say them: 1955 -> ’55, 1955-1957 -> ’55–’57.
// Only for what people read on the page. Searches still match "1955", and the
// page titles Google shows keep full years.
const RANGE = /\b(?:19|20)(\d\d)\s*[-–]\s*(?:(?:19|20)(\d\d)|(\d\d))\b/g;
const SINGLE = /(^|[^’'\w])(?:19|20)(\d\d)\b/g;

export function shortYears(text: string): string {
  return text
    .replace(RANGE, (_m, a: string, b?: string, c?: string) => `’${a}–’${b ?? c}`)
    .replace(SINGLE, (_m, pre: string, y: string) => `${pre}’${y}`);
}

export const shortYear = (y: number | string) => `’${String(y).slice(-2)}`;

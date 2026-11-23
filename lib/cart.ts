'use client';
// The cart lives in this browser (localStorage). Prices are re-checked on the
// server at checkout, so nothing here can change what a customer pays.
import { useEffect, useState } from 'react';

// images: photo addresses to try in order (small copy first, then the original)
// Merch lines use handle "merch:<item>:<size>" and kind 'mailer' or 'printed'.
export type CartLine = {
  handle: string;
  name: string;
  price: number;
  image?: string;
  images?: string[];
  qty: number;
  freight: boolean;
  href?: string; // page to link back to; parts default to /parts/<handle>
  kind?: 'part' | 'mailer' | 'printed';
};
const KEY = 'mcintyres-cart-v1';
const EVENT = 'mcintyres-cart-change';

function read(): CartLine[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}
function write(lines: CartLine[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function addToCart(line: Omit<CartLine, 'qty'>, qty = 1) {
  const lines = read();
  const found = lines.find((l) => l.handle === line.handle);
  if (found) found.qty += qty;
  else lines.push({ ...line, qty });
  write(lines);
}
export function setQty(handle: string, qty: number) {
  write(read().map((l) => (l.handle === handle ? { ...l, qty } : l)).filter((l) => l.qty > 0));
}
export function clearCart() {
  write([]);
}

export function useCart() {
  const [lines, setLines] = useState<CartLine[]>([]);
  useEffect(() => {
    const sync = () => setLines(read());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return lines;
}

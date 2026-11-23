'use client';
import Link from 'next/link';
import { useCart } from '@/lib/cart';

export default function CartLink() {
  const lines = useCart();
  const count = lines.reduce((n, l) => n + l.qty, 0);
  return (
    <Link href="/cart" className="no-underline rounded-xl bg-white text-onyx font-bold text-lg px-4 h-[52px] shrink-0 inline-flex items-center gap-2 border-[3px] border-onyx hover:bg-ivory hover:text-onyx">
      <svg aria-hidden width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M2 3h3l2.6 12.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.5L22 7H6"/></svg>
      Cart{count > 0 ? ` (${count})` : ''}
    </Link>
  );
}

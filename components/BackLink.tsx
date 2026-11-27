'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// "Back" on a part page returns to the list the customer came from (their search
// or planner results), not the start of the catalog. The list pages remember
// themselves with <RememberList />, kept for this browser tab only.
const KEY = 'mcintyres-last-list';

export function RememberList() {
  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, window.location.pathname + window.location.search);
    } catch {}
  });
  return null;
}

export default function BackLink({ href, label, listPrefix }: { href: string; label: string; listPrefix: string }) {
  const [back, setBack] = useState<string | null>(null);
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(KEY);
      if (saved && saved.startsWith(listPrefix) && saved !== href) setBack(saved);
    } catch {}
  }, [href, listPrefix]);
  return <Link href={back ?? href}>{back ? 'Back to your results' : label}</Link>;
}

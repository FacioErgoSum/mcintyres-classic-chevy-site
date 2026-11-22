'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { clearCart } from '@/lib/cart';

export default function Success() {
  useEffect(() => clearCart(), []);
  return (
    <div className="space-y-6">
      <h1>Thank you, your order is in</h1>
      <p className="max-w-[60ch]">Stripe has emailed you a receipt. We’ll order your parts right away and email you tracking when they ship.</p>
      <p className="max-w-[60ch]">Big panels come by truck freight. The driver will call before delivery. Check every panel before you sign, and write any damage on the receipt.</p>
      <Link href="/" className="btn-plain">Back to the home page</Link>
    </div>
  );
}

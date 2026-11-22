import Link from 'next/link';

export default function Cancelled() {
  return (
    <div className="space-y-6">
      <h1>Checkout stopped</h1>
      <p>You weren’t charged. Your parts are still in your cart.</p>
      <Link href="/cart" className="btn-main">Back to my cart</Link>
    </div>
  );
}

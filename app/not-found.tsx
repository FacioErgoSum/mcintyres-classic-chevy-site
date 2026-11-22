import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="space-y-6">
      <h1>That page isn’t here</h1>
      <p>The part may have been renamed or sold out.</p>
      <div className="flex flex-col gap-4 max-w-md">
        <Link href="/planner" className="btn-main">Find parts for my car</Link>
        <Link href="/parts" className="btn-plain">Search parts</Link>
      </div>
    </div>
  );
}

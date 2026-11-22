import type { Metadata } from 'next';
import { allParts } from '@/lib/catalog';
import PartRow from '@/components/PartRow';

export const metadata: Metadata = { title: 'McIntyre-Made parts' };
export const revalidate = 600;

export default async function McIntyreMade() {
  const ours = (await allParts()).filter((p) => p.mcintyreMade);
  return (
    <div className="space-y-6">
      <h1>McIntyre-Made parts</h1>
      <p className="max-w-[60ch]">
        When a repair panel doesn’t exist, we make it. Each one is designed in our shop, fitted on our own cars,
        and laser-cut from American steel.
      </p>
      {ours.length ? (
        <ul className="space-y-4">{ours.map((p) => <PartRow key={p.handle} part={p} />)}</ul>
      ) : (
        <p className="text-lg">New parts are on the way. Check back soon.</p>
      )}
    </div>
  );
}

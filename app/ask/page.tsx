import type { Metadata } from 'next';
import { BODIES, YEARS } from '@/lib/fitment';
import { getPart } from '@/lib/catalog';
import AskForm from '@/components/AskForm';

export const metadata: Metadata = { title: 'Ask a question' };
type SP = Promise<{ part?: string }>;

export default async function Ask({ searchParams }: { searchParams: SP }) {
  const { part: handle } = await searchParams;
  const part = handle ? await getPart(handle).catch(() => null) : null;
  return (
    <div className="space-y-6">
      <h1>Ask a question</h1>
      <p className="max-w-[60ch]">
        Not sure which part you need? Tell us about your car and send a few photos of the area you’re fixing.
        We’ll look them over and email you back with the parts that fit.
      </p>
      <AskForm
        years={[...YEARS]}
        bodies={BODIES.map((b) => ({ id: b.id, name: b.name }))}
        partName={part?.name}
        partHandle={part?.handle}
      />
    </div>
  );
}

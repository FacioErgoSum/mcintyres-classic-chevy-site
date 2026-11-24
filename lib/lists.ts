import 'server-only';
import { getPart, type Part } from './catalog';

// What a list page needs to show for each saved part.
export type ListPart = {
  handle: string;
  qty: number;
  part: Pick<Part, 'name' | 'price' | 'freight' | 'stock' | 'partNumber'> & { image: string | null; images: string[] } | null; // null: no longer sold
};

export async function listParts(items: { handle: string; qty: number }[]): Promise<ListPart[]> {
  return Promise.all(
    items.map(async ({ handle, qty }) => {
      const p = await getPart(handle);
      return {
        handle,
        qty,
        part: p
          ? {
              name: p.name,
              price: p.price,
              freight: p.freight,
              stock: p.stock,
              partNumber: p.partNumber,
              image: p.images[0]?.thumb ?? null,
              images: p.images[0] ? [p.images[0].thumb, p.images[0].original] : [],
            }
          : null,
      };
    }),
  );
}

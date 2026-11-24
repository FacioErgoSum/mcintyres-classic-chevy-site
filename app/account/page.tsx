import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { money } from '@/lib/catalog';
import { trackingUrl } from '@/lib/tracking';
import NewListButton from '@/components/account/NewListButton';
import { orderNumber } from '@/lib/order-email';
import { CAR_COLUMNS, carFromRow, carLabel, carName } from '@/lib/cars';

export const metadata: Metadata = { title: 'Your account', robots: { index: false } };
export const dynamic = 'force-dynamic';

type OrderRow = {
  id: string;
  created_at: string;
  status: string;
  total: number | null;
  shipping_label: string | null;
  live: boolean;
  order_items: { id: number; name: string; qty: number; unit_price: number; handle: string | null; kind: string | null }[];
  order_tracking: { id: number; carrier: string | null; tracking_number: string; note: string | null; created_at: string }[];
};
type ListRow = { id: string; name: string; shared: boolean; wishlist_items: { count: number }[]; car_year?: number | null; car_body?: string | null; car_series?: string | null; car_engine?: string | null; car_serial?: string | null };

const STATUS: Record<string, string> = {
  paid: 'Paid. We’re ordering your parts.',
  ordered: 'Ordered from the warehouse. Waiting to ship.',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default async function AccountPage() {
  const sb = await supabaseServer();
  const { data: auth } = await sb.auth.getUser();
  const user = auth.user;
  if (!user) redirect('/account/sign-in?next=/account');

  const [orders, lists] = await Promise.all([
    sb.from('orders').select('id, created_at, status, total, shipping_label, live, order_items(id, name, qty, unit_price, handle, kind), order_tracking(id, carrier, tracking_number, note, created_at)').order('created_at', { ascending: false }).limit(50),
    sb.from('wishlists').select(`id, name, shared, ${CAR_COLUMNS}, wishlist_items(count)`).order('created_at'),
  ]);
  const setupMissing = [orders.error, lists.error].some((e) => e && /relation|does not exist|schema cache/i.test(e.message));
  const name = (user.user_metadata?.full_name || user.user_metadata?.name || '').toString().split(' ')[0];

  return (
    <div className="space-y-12">
      <div className="space-y-2">
        <h1>{name ? `Hi, ${name}` : 'Your account'}</h1>
        <p className="text-lg">Signed in as <strong>{user.email}</strong></p>
      </div>

      {setupMissing && (
        <p role="alert" className="rounded-lg bg-matador/10 border-[3px] border-matador p-4 text-lg">
          Lists and orders aren’t switched on yet. (Site owner: run <code>supabase/accounts.sql</code> in Supabase.)
        </p>
      )}

      <section className="space-y-4" aria-labelledby="lists-h">
        <h2 id="lists-h">Your lists</h2>
        <p className="max-w-[60ch]">Make a list for each project car, or one to share with family who are shopping for you. Save a car from its serial number in <Link href="/planner">Find parts for my car</Link>.</p>
        {(lists.data as ListRow[] | null)?.length ? (
          <ul className="space-y-3">
            {(lists.data as ListRow[]).map((l) => (
              <li key={l.id}>
                <Link href={`/lists/${l.id}`} className="flex items-center justify-between gap-4 rounded-xl border-[3px] border-onyx/15 bg-white p-4 no-underline text-onyx hover:border-brand hover:text-onyx">
                  <span>
                    <span className="block text-xl font-bold underline decoration-brand decoration-2 underline-offset-4">{l.name}</span>
                    {carFromRow(l) && carName(carFromRow(l)!) !== l.name && <span className="block text-lg">{carName(carFromRow(l)!)}</span>}
                    {carFromRow(l)?.nickname && <span className="block text-base">{carLabel(carFromRow(l)!)}</span>}
                    <span className="block text-base text-onyx/80">
                      {carFromRow(l) ? 'Project car · ' : ''}{l.wishlist_items?.[0]?.count ?? 0} {(l.wishlist_items?.[0]?.count ?? 0) === 1 ? 'part' : 'parts'}
                      {l.shared ? ' · Shared' : ''}
                    </span>
                  </span>
                  <span aria-hidden className="text-2xl">→</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          !setupMissing && <p className="text-lg">No lists yet. Tap <strong>Save to a list</strong> on any part to start one.</p>
        )}
        {!setupMissing && <NewListButton />}
      </section>

      <section className="space-y-4" aria-labelledby="orders-h">
        <h2 id="orders-h">Your orders</h2>
        {!(orders.data as OrderRow[] | null)?.length ? (
          !setupMissing && (
            <p className="text-lg max-w-[60ch]">
              No orders yet. Orders you place while signed in, or as a guest with <strong>{user.email}</strong>, show up here.
            </p>
          )
        ) : (
          <ul className="space-y-5">
            {(orders.data as OrderRow[]).map((o) => {
              const tracking = [...(o.order_tracking || [])].sort((a, b) => a.created_at.localeCompare(b.created_at));
              const status = o.status === 'paid' && tracking.length ? 'shipped' : o.status;
              return (
                <li key={o.id} className="rounded-xl border-[3px] border-onyx/15 p-4 sm:p-5 space-y-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-xl font-bold">
                      {new Date(o.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      {!o.live && <span className="ml-2 text-base font-normal text-onyx/70">(test order)</span>}
                    </p>
                    <p className="text-lg"><span className="sr-only">Status: </span><strong>{STATUS[status] || status}</strong></p>
                  </div>
                  <ul className="space-y-1 text-lg">
                    {o.order_items.map((i) => (
                      <li key={i.id} className="flex justify-between gap-4">
                        <span>{i.handle && i.kind === 'part' ? <Link href={`/parts/${i.handle}`}>{i.name}</Link> : i.name}{i.qty > 1 ? ` × ${i.qty}` : ''}</span>
                        <span className="shrink-0">{money(i.unit_price * i.qty)}</span>
                      </li>
                    ))}
                  </ul>
                  {tracking.length > 0 && (
                    <div className="space-y-2 rounded-lg bg-brand-light p-4">
                      <p className="text-lg font-bold">Tracking</p>
                      <ul className="space-y-2">
                        {tracking.map((t) => (
                          <li key={t.id} className="text-lg">
                            {t.note && <span className="block">{t.note}</span>}
                            <a href={trackingUrl(t.carrier, t.tracking_number)} target="_blank" rel="noopener noreferrer">
                              Track with {t.carrier || 'the carrier'}: {t.tracking_number}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="flex justify-between border-t-[3px] border-onyx/10 pt-3 text-lg">
                    <span>Total{o.shipping_label ? ', with shipping' : ''}</span>
                    <strong>{o.total != null ? money(Number(o.total)) : ''}</strong>
                  </p>
                  <p className="text-base text-onyx/75">Order number {orderNumber(o.id)}. Questions? <Link href="/ask">Send us a message</Link>.</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <form action="/auth/sign-out" method="post">
        <button type="submit" className="btn-plain">Sign out</button>
      </form>
    </div>
  );
}

import 'server-only';
import type { Order, OrderLine } from './orders';

// The "new order" email: everything needed to place the order, nothing else.

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const GREEN = '#1d582e';

function table(lines: OrderLine[], withPartNo: boolean) {
  const rows = lines
    .map(
      (l) => `<tr>
        <td style="padding:8px 10px;border-bottom:1px solid #ddd;font-size:18px;font-weight:bold;text-align:center">${l.qty}</td>
        ${withPartNo ? `<td style="padding:8px 10px;border-bottom:1px solid #ddd;font-family:Menlo,Consolas,monospace;font-size:16px;white-space:nowrap">${esc(l.partNumber || '—')}</td>` : ''}
        <td style="padding:8px 10px;border-bottom:1px solid #ddd;font-size:16px">${esc(l.name)}${l.freight ? ' <b style="color:#a33">(freight)</b>' : ''}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #ddd;font-size:16px;text-align:right;white-space:nowrap">${money(l.unit * l.qty)}</td>
      </tr>`,
    )
    .join('');
  return `<table cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;max-width:640px">
    <tr style="background:#f2f2f2">
      <th style="padding:6px 10px;text-align:center;font-size:14px">Qty</th>
      ${withPartNo ? '<th style="padding:6px 10px;text-align:left;font-size:14px">Part #</th>' : ''}
      <th style="padding:6px 10px;text-align:left;font-size:14px">Item</th>
      <th style="padding:6px 10px;text-align:right;font-size:14px">Paid</th>
    </tr>${rows}</table>`;
}

const button = (href: string, label: string) =>
  `<a href="${esc(href)}" style="display:inline-block;background:${GREEN};color:#fff;text-decoration:none;font-size:20px;font-weight:bold;padding:16px 28px;border-radius:10px">${esc(label)}</a>`;

const section = (title: string, body: string) =>
  `<h2 style="font-size:22px;margin:28px 0 10px;color:${GREEN}">${esc(title)}</h2>${body}`;

export function orderEmail(
  order: Order,
  gs: { url: string | null; missing: OrderLine[] },
  printful: { status: string; detail: string },
  stockWarnings: string[] = [],
): { subject: string; html: string; text: string } {
  const a = order.shipTo.address;
  const addressLines = [order.shipTo.name, a.line1, a.line2, `${a.city}, ${a.state} ${a.zip}`].filter(Boolean) as string[];
  const gsLines = order.lines.filter((l) => l.kind === 'part' && l.supplier === 'golden_star');
  const ours = order.lines.filter((l) => (l.kind === 'part' && l.supplier === 'mcintyre') || l.kind === 'mailer');
  const printed = order.lines.filter((l) => l.kind === 'printed');
  const freight = gsLines.some((l) => l.freight);

  const subject = `${order.live ? '' : '[TEST] '}${stockWarnings.length ? '[CHECK STOCK] ' : ''}New order: ${order.shipTo.name || order.customer.name} – ${money(order.totals.total)}`;

  let html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#1b1b1b;max-width:680px">
  ${order.live ? '' : '<p style="background:#fff3cd;padding:10px;border-radius:8px;font-size:16px"><b>Test order.</b> No real money was paid. Don’t order anything for this one.</p>'}
  ${stockWarnings.length ? `<div style="background:#fde8e8;border:3px solid #a33;padding:12px 16px;border-radius:8px;font-size:16px"><b>Check stock first.</b><ul style="margin:8px 0 0;padding-left:20px">${stockWarnings.map((w) => `<li>${esc(w)}</li>`).join('')}</ul></div>` : ''}
  <h1 style="font-size:26px;margin:0 0 4px">New order from ${esc(order.shipTo.name || order.customer.name)}</h1>
  <p style="font-size:16px;margin:0;color:#555">${order.created.toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'full', timeStyle: 'short' })} (Central)</p>

  ${section('Ship to', `<table cellspacing="0" cellpadding="0" style="font-size:18px;line-height:1.5;background:#f7f7f7;border-radius:8px;width:100%;max-width:640px">
    ${[
      ['First name', order.shipTo.name.trim().split(/\s+/)[0] || ''],
      ['Last name', order.shipTo.name.trim().split(/\s+/).slice(1).join(' ')],
      ['Address', a.line1],
      ...(a.line2 ? [['Apt / suite', a.line2]] : []),
      ['City', a.city],
      ['State', a.state],
      ['ZIP', a.zip],
      ['Phone', order.customer.phone || 'not given'],
      ['Email', order.customer.email || 'not given'],
    ]
      .map(([k, v]) => `<tr><td style="padding:6px 12px;color:#555;font-size:15px;white-space:nowrap;vertical-align:top">${k}</td><td style="padding:6px 12px;font-weight:bold">${esc(v)}</td></tr>`)
      .join('')}
  </table>`)}
`;

  if (gsLines.length) {
    html += section(
      `1. Order from Golden Star${freight ? ' (truck freight)' : ''}`,
      `${table(gsLines, true)}
      <p style="margin:18px 0 8px">${gs.url ? button(gs.url, 'Open Golden Star cart') : ''}</p>
      ${gs.url ? '<p style="font-size:15px;color:#555;margin:0">Opens Golden Star’s checkout with these parts in the cart. Sign in to your dealer account, copy the Ship to address above into the delivery form, then place the order.</p>' : ''}
      ${gs.missing.length ? `<p style="font-size:16px;color:#a33"><b>Add by hand:</b> ${gs.missing.map((l) => `${esc(l.partNumber || l.name)} ×${l.qty}`).join(', ')} (couldn’t find these on goldenstarauto.site).</p>` : ''}`,
    );
  }
  if (ours.length) {
    html += section(`${gsLines.length ? '2' : '1'}. Ship from Scranton`, table(ours, true));
  }
  if (printed.length) {
    const color = printful.status === 'sent' ? GREEN : '#a33';
    html += section(
      'Printed merch (Printful)',
      `${table(printed, false)}<p style="font-size:16px;color:${color};margin:12px 0 0"><b>${esc(printful.detail)}</b></p>
      <p style="margin:16px 0 0">${button('https://www.printful.com/dashboard/default/orders', 'Open Printful orders')}</p>`,
    );
  }

  html += section(
    'Payment',
    `<table cellspacing="0" cellpadding="0" style="font-size:16px;line-height:1.7">
      <tr><td style="padding-right:24px">Items</td><td style="text-align:right">${money(order.totals.items)}</td></tr>
      <tr><td style="padding-right:24px">${esc(order.shippingLabel)}</td><td style="text-align:right">${money(order.totals.shipping)}</td></tr>
      ${order.totals.tax ? `<tr><td style="padding-right:24px">Sales tax</td><td style="text-align:right">${money(order.totals.tax)}</td></tr>` : ''}
      <tr><td style="padding-right:24px"><b>Total paid</b></td><td style="text-align:right"><b>${money(order.totals.total)}</b></td></tr>
    </table>
    ${order.paymentIntent ? `<p style="margin:14px 0 0">${button(`https://dashboard.stripe.com/${order.live ? '' : 'test/'}payments/${order.paymentIntent}`, 'View payment in Stripe')}</p>` : ''}`,
  );
  html += section(
    'When it ships',
    `<p style="font-size:16px;margin:0 0 8px">Order number <b>${esc(orderNumber(order.id))}</b>. The customer sees this order in their account.</p>
    <p style="font-size:15px;color:#555;margin:0">To show them tracking: Supabase → Table Editor → <b>order_tracking</b> → Insert row. Paste this as <b>order_id</b>:</p>
    <p style="font-family:monospace;font-size:14px;background:#f7f7f7;padding:8px;border-radius:6px;word-break:break-all">${esc(order.id)}</p>
    <p style="font-size:15px;color:#555;margin:0">Fill in <b>carrier</b> (USPS, UPS, FedEx or the freight company) and <b>tracking_number</b>. Add one row per package.</p>`,
  );
  html += `</div>`;

  const text = [
    `New order from ${order.shipTo.name}`,
    '',
    ...(stockWarnings.length ? ['CHECK STOCK FIRST', ...stockWarnings, ''] : []),
    'SHIP TO',
    ...addressLines,
    `Phone: ${order.customer.phone || 'not given'}`,
    `Email: ${order.customer.email || 'not given'}`,
    '',
    ...(gsLines.length ? ['GOLDEN STAR', ...gsLines.map((l) => `${l.qty} × ${l.partNumber || ''} ${l.name}`), gs.url ? `Cart: ${gs.url}` : '', ''] : []),
    ...(ours.length ? ['SHIP FROM SCRANTON', ...ours.map((l) => `${l.qty} × ${l.name}`), ''] : []),
    ...(printed.length ? ['PRINTFUL', ...printed.map((l) => `${l.qty} × ${l.name}`), printful.detail, 'Printful orders: https://www.printful.com/dashboard/default/orders', ''] : []),
    `Total paid: ${money(order.totals.total)}`,
    '',
    `Order number ${orderNumber(order.id)}`,
    `Tracking: add a row to order_tracking in Supabase with order_id ${order.id}`,
  ].join('\n');

  return { subject, html, text };
}

/** Sends through Resend (resend.com). */
export async function sendOrderEmail(msg: { subject: string; html: string; text: string; replyTo?: string; to?: string; from?: string }) {
  const key = process.env.RESEND_API_KEY;
  const to = (msg.to || process.env.ORDER_EMAIL_TO || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!key || !to.length) throw new Error('RESEND_API_KEY or ORDER_EMAIL_TO is not set');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: msg.from || process.env.ORDER_EMAIL_FROM || 'McIntyre’s Orders <onboarding@resend.dev>',
      to,
      ...(msg.replyTo ? { reply_to: msg.replyTo } : {}),
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
    }),
  });
  if (!res.ok) throw new Error(`Resend: HTTP ${res.status} ${await res.text()}`);
}

/** The short order number customers see (the end of the Stripe checkout id). */
export function orderNumber(id: string) {
  return id.slice(-10).toUpperCase();
}

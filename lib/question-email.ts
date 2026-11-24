import 'server-only';
import { sendOrderEmail } from './order-email';

// The "new question" email. Reply goes straight to the customer.
// Sent to QUESTION_EMAIL_TO if set, otherwise to ORDER_EMAIL_TO.

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export type Question = {
  name: string;
  email: string;
  year: number | null;
  body: string | null; // body style name
  part: { name: string; url: string } | null;
  message: string;
  photos: string[]; // links that open each photo (they expire after PHOTO_LINK_DAYS)
};

export const PHOTO_LINK_DAYS = 60;

export async function sendQuestionEmail(q: Question) {
  const car = [q.year ? `’${String(q.year).slice(-2)}` : '', q.body || ''].filter(Boolean).join(' ') || 'Not given';
  const rows: [string, string][] = [
    ['Name', q.name],
    ['Email', q.email],
    ['Car', car],
    ...(q.part ? ([['Asking about', q.part.name]] as [string, string][]) : []),
  ];
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#1b1b1b;max-width:680px">
  <h1 style="font-size:24px;margin:0 0 12px">Question from ${esc(q.name)}</h1>
  <table cellspacing="0" cellpadding="0" style="font-size:17px;line-height:1.5;background:#f7f7f7;border-radius:8px;width:100%">
    ${rows.map(([k, v]) => `<tr><td style="padding:6px 12px;color:#555;font-size:15px;white-space:nowrap;vertical-align:top">${k}</td><td style="padding:6px 12px;font-weight:bold">${esc(v)}</td></tr>`).join('')}
  </table>
  ${q.part ? `<p style="font-size:15px;margin:8px 0 0"><a href="${esc(q.part.url)}" style="color:#1d582e">Open the part page</a></p>` : ''}
  <h2 style="font-size:20px;margin:24px 0 8px;color:#1d582e">Their message</h2>
  <p style="font-size:18px;line-height:1.6;white-space:pre-wrap;margin:0">${esc(q.message)}</p>
  ${
    q.photos.length
      ? `<h2 style="font-size:20px;margin:24px 0 8px;color:#1d582e">Photos (${q.photos.length})</h2>
  ${q.photos.map((u, i) => `<p style="margin:0 0 14px"><a href="${esc(u)}"><img src="${esc(u)}" alt="Photo ${i + 1}" width="320" style="max-width:100%;border-radius:8px;border:1px solid #ddd"></a><br><a href="${esc(u)}" style="font-size:15px;color:#1d582e">Open photo ${i + 1} full size</a></p>`).join('')}
  <p style="font-size:14px;color:#777">Photo links work for ${PHOTO_LINK_DAYS} days. They’re also kept in Supabase → Storage → customer-photos.</p>`
      : ''
  }
  <p style="font-size:16px;margin:24px 0 0;background:#e7f0ea;padding:12px;border-radius:8px">Hit <b>Reply</b> to answer ${esc(q.name.split(' ')[0])} directly.</p>
</div>`;
  const text = [
    `Question from ${q.name} <${q.email}>`,
    `Car: ${car}`,
    q.part ? `Asking about: ${q.part.name} (${q.part.url})` : '',
    '',
    q.message,
    '',
    ...q.photos.map((u, i) => `Photo ${i + 1}: ${u}`),
    '',
    'Reply to this email to answer them directly.',
  ]
    .filter((l, i, a) => l !== '' || a[i - 1] !== '')
    .join('\n');

  await sendOrderEmail({
    subject: `Question from ${q.name}${q.part ? ` about ${q.part.name}` : ''}`,
    html,
    text,
    replyTo: `${q.name.replace(/[<>"]/g, '')} <${q.email}>`,
    to: process.env.QUESTION_EMAIL_TO || undefined,
    from: process.env.QUESTION_EMAIL_FROM || process.env.ORDER_EMAIL_FROM?.replace(/Orders/, 'Questions') || 'McIntyre’s Questions <onboarding@resend.dev>',
  });
}

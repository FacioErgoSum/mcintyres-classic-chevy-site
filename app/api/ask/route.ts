import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Saves a customer question and photos to Supabase (table consult_requests,
// private bucket customer-photos). See supabase/questions.sql.
export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) return NextResponse.json({ error: 'Questions aren’t set up yet.' }, { status: 503 });

  const form = await req.formData();
  const text = (k: string, max: number) => String(form.get(k) ?? '').trim().slice(0, max);
  const name = text('name', 120);
  const email = text('email', 200);
  const message = text('message', 5000);
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !message) {
    return NextResponse.json({ error: 'Please fill in your name, a valid email and your question.' }, { status: 400 });
  }

  const db = createClient(url, secret, { auth: { persistSession: false } });
  const photos = form.getAll('photos').filter((f): f is File => f instanceof File && f.size > 0).slice(0, 6);
  const paths: string[] = [];
  const folder = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}`;
  for (const [i, f] of photos.entries()) {
    if (f.size > 10 * 1024 * 1024 || !f.type.startsWith('image/')) continue;
    const ext = (f.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const path = `${folder}/${i + 1}.${ext}`;
    const { error } = await db.storage.from('customer-photos').upload(path, f, { contentType: f.type });
    if (!error) paths.push(path);
  }

  const { error } = await db.from('consult_requests').insert({
    name,
    email,
    car_year: Number(text('year', 4)) || null,
    body_style: text('body', 40) || null,
    part_handle: text('part', 200) || null,
    message,
    photo_paths: paths,
  });
  if (error) return NextResponse.json({ error: 'Your message didn’t save.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

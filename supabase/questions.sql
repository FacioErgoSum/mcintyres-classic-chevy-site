-- Run once in the Supabase SQL editor: storage for "Ask a question" messages.
-- Only the website's server (secret key) writes here; nobody can read it publicly.

create table if not exists consult_requests (
  id bigint generated always as identity primary key,
  created_at timestamptz default now(),
  name text not null,
  email text not null,
  car_year int,
  body_style text,
  part_handle text,
  message text not null,
  photo_paths text[] default '{}',
  status text default 'new',          -- new / answered
  answer_notes text
);
alter table consult_requests enable row level security;   -- no public policies on purpose

insert into storage.buckets (id, name, public)
values ('customer-photos', 'customer-photos', false)
on conflict (id) do nothing;

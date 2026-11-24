-- Run once in the Supabase SQL editor (after accounts.sql).
-- Lets a list be about one car (a "project car"). All optional: a list with no
-- car is just a list.
alter table wishlists add column if not exists car_year integer check (car_year between 1955 and 1957);
alter table wishlists add column if not exists car_body text;      -- 2-door-sedan, nomad, … (lib/fitment.ts)
alter table wishlists add column if not exists car_series text;    -- 150 / 210 / Bel Air / Sedan Delivery
alter table wishlists add column if not exists car_engine text;    -- V8 / six-cylinder
alter table wishlists add column if not exists car_serial text check (length(car_serial) <= 20);  -- e.g. VC57B123456
alter table wishlists add column if not exists car_nickname text check (length(car_nickname) <= 40);  -- e.g. "Big Red"

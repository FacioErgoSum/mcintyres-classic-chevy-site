# McIntyre's Classic Chevy website

Next.js + Tailwind + Supabase + Stripe, hosted on Netlify (same stack as tinycore.cc).
It reads parts from the Supabase database that `golden-star-scraper` fills.

## What's on the site

| Page | What it does |
| --- | --- |
| `/` | Home: three big buttons, McIntyre-Made parts, who we are, how shipping works |
| `/planner` | Project Planner: year, then body style, then area of the car, then the parts that fit |
| `/parts` | Search by name or part number, and planner results (30 at a time, "Show more") |
| `/parts/[handle]` | One part: photos, price, shipping type, what it fits, add to cart |
| `/cart` | Cart with big + and − buttons, shipping and total, then Stripe checkout |
| `/ask` | Question form with photos, saved to Supabase instead of a phone call |
| `/mcintyre-made` | Dad's own parts |
| `/about` | Dad's story from the old Wix site, with the chassis photo |

Fitment (year and body style) is worked out from each part's title in `lib/fitment.ts`.
Areas of the car come from Golden Star's categories in `lib/areas.ts`.
Shipping is in `lib/shipping.ts`: $20 per order for small parts, $275 per order when anything needs freight.

## Run it on your computer

```bash
npm install
npm run photos                  # downloads the yard photo, chassis photo and Clover logo from the old Wix site
cp .env.example .env.local     # then fill it in (below)
npm run dev                     # open http://localhost:3000
```

### Fast part photos

In the `golden-star-scraper` folder, run `npm install` once (adds the image tool), then `npm run sizes`.
It makes a 400px thumbnail and a 1400px copy of every part photo (WebP, a fraction of the size)
and uploads them with a one-year browser cache. Lists use the thumbnails, part pages the large copy,
and the original is the fallback if a copy is missing.

`.env.local` needs, from Supabase → Project Settings:

- `NEXT_PUBLIC_SUPABASE_URL`: Data API → Project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: API Keys → **publishable** key (safe in the browser)
- `SUPABASE_SECRET_KEY`: API Keys → **secret** key (server only, for saving questions)
- `STRIPE_SECRET_KEY`: Stripe → Developers → API keys. Use the **test** key `sk_test_...` until launch.

## One-time Supabase steps

1. SQL editor: run `supabase/questions.sql` (the question form's table and private photo bucket).
2. Parts start hidden. To show every Golden Star part that has a price, run:
   ```sql
   update products set is_published = true
   where retail_price is not null and retail_price > 0 and supplier_id = 'golden_star';
   ```
   Hide one again with `update products set is_published = false where handle = '...';`

Customer questions appear in Table Editor → `consult_requests`; their photos are in Storage → `customer-photos`.

## Put it online (Netlify)

1. Push this folder to GitHub.
2. Netlify → Add new site → Import from GitHub. Netlify detects Next.js; keep its default build settings.
3. Site settings → Environment variables: add the four values above, plus
   `NEXT_PUBLIC_SITE_URL` = the site's address (e.g. `https://mcintyresclassicchevy.com`).
4. Test a checkout with Stripe's test card `4242 4242 4242 4242`, then switch to the live key.
5. Point the domain at Netlify when you're ready to replace the old site.

## After an order

Stripe emails you and the customer. Place the matching order with Golden Star (the Stripe
payment lists each part), then email the customer the tracking number.

# Taking orders: setup

All keys go in **Netlify → Site configuration → Environment variables**, never in chat or GitHub.
After changing variables, redeploy (Deploys → Trigger deploy).

## 1. Stripe, live payments

1. Stripe Dashboard: finish **Activate payments** (business details, bank account for payouts).
2. Switch the dashboard out of Test mode. Developers → API keys → copy the **Secret key** (`sk_live_…`).
3. Netlify: set `STRIPE_SECRET_KEY` to the `sk_live_…` key.
   Keep a `sk_test_…` key in your local `.env.local` for testing.
4. Netlify: set `NEXT_PUBLIC_SITE_URL` to the live address, e.g. `https://mcintyres.netlify.app`.
5. Stripe → Settings → Customer emails: turn on **Successful payments** so customers get a receipt.

## 2. Order emails (Resend)

1. Make a free account at resend.com **with the email address that should get the orders**.
   Until you own a domain, Resend only delivers to that account's own address.
2. Resend → API Keys → Create (sending access). Copy it.
3. Netlify:
   - `RESEND_API_KEY` = the key
   - `ORDER_EMAIL_TO` = that same email address (add more later, comma-separated, once you verify a domain)

## 3. Tell Stripe to call the site when someone pays

1. Stripe (live mode) → Developers → Webhooks → **Add endpoint**
   - Endpoint URL: `https://mcintyres.netlify.app/api/stripe-webhook`
   - Events: `checkout.session.completed` and `checkout.session.async_payment_succeeded`
2. Open the endpoint → **Signing secret** → Reveal → copy (`whsec_…`).
3. Netlify: `STRIPE_WEBHOOK_SECRET` = that value. Redeploy.
4. Do the same in Test mode with its own endpoint and secret if you want test orders to email you
   (the test email is marked **[TEST]**).

## 4. Printful (printed merch)

1. printful.com → Stores → Add store → **Manual order platform / API**.
2. Add the shirts, totes and posters with your designs to that store.
3. Developers (developers.printful.com) → create a **private token** for that store.
4. Netlify: `PRINTFUL_API_TOKEN` = the token.
5. Each size in Printful has a **sync variant id**. Put them in the `merch` table's `options`
   (see `golden-star-scraper/supabase/2026-11-merch.sql`).
6. Orders arrive in Printful as **drafts** you confirm with one click.
   Once you trust it, set `PRINTFUL_AUTO_CONFIRM` = `on` and they print and ship by themselves.

## 5. Merch table

Run `golden-star-scraper/supabase/2026-11-merch.sql` in Supabase → SQL Editor.
It adds example items (unpublished). Add photos and publish them; the **Merch** link appears in the menu
once one item is published.

## Optional: sales tax

Stripe Tax can add sales tax automatically (it charges a small fee per transaction).
Turn it on in Stripe → Tax, then set `STRIPE_TAX` = `on` and `NEXT_PUBLIC_STRIPE_TAX` = `on` in Netlify.
Ask your accountant which states you need to collect in.

## What happens on an order

1. Customer pays on Stripe.
2. Stripe calls `/api/stripe-webhook`.
3. Printed merch is sent to Printful.
4. You get an email with the ship-to address, phone, what to order from Golden Star with an
   **Open Golden Star cart** button (parts already in the cart, address filled in), and what ships from Scranton.

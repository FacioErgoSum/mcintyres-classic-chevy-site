# Customer accounts: setup

Accounts let customers sign in with Google, Facebook or an email and password,
save parts to lists (and share them), and see their orders and tracking.
Guests can still check out without an account.

Everything runs on the same Supabase project the site already uses. No new
Netlify variables are needed (the site already has `SUPABASE_SECRET_KEY`).

## 1. Tables

Supabase → SQL Editor → run `supabase/accounts.sql`.
It adds `orders`, `order_items`, `order_tracking`, `wishlists` and `wishlist_items`,
with rules so each customer only sees their own.

## 2. Addresses Supabase may send people back to

Supabase → Authentication → URL Configuration:
- **Site URL:** the live address, e.g. `https://mcintyres.netlify.app`
- **Redirect URLs:** add `https://mcintyres.netlify.app/auth/callback` and `http://localhost:3000/auth/callback`

## 3. Email and password

Supabase → Authentication → Providers → **Email**: on, and keep **Confirm email** on.
(Confirming matters: guest orders appear in an account with the same email only after it's confirmed.)

Supabase's built-in email only sends a few messages an hour, so before launch set up
your own sender: Authentication → Emails → SMTP Settings. With Resend:
host `smtp.resend.com`, port `465`, user `resend`, password = a Resend API key.
Resend needs a verified domain to email customers (see SETUP-ORDERS.md).
Until then, Google and Facebook sign-in work fine; email sign-up links may not arrive.

## 4. Google

1. console.cloud.google.com → pick or make a project → APIs & Services → **OAuth consent screen**:
   app name "McIntyre's Classic Chevy", your email, the site's address. Publish it.
2. Credentials → Create credentials → **OAuth client ID** → Web application.
   Authorized redirect URI: `https://<your-project>.supabase.co/auth/v1/callback`
   (Supabase shows this exact address on its Google provider page).
3. Copy the Client ID and Client secret into Supabase → Authentication → Providers → **Google**, and turn it on.

Same steps as tinycore.cc, but make a separate client so people see "McIntyre's", not tinyCore.

## 5. Facebook

1. developers.facebook.com → My Apps → Create app → use case **Authenticate and request data from users with Facebook Login**.
2. Facebook Login → Settings → **Valid OAuth Redirect URIs**: `https://<your-project>.supabase.co/auth/v1/callback`
3. App settings → Basic: copy the **App ID** and **App secret** into Supabase → Providers → **Facebook**, and turn it on.
4. Facebook requires a **Privacy Policy URL** (and data-deletion instructions) before the app can go **Live**.
   The site doesn't have a privacy page yet.
5. Switch the app to **Live**. Until then only you (the app's admins) can sign in with Facebook.

## Adding tracking to an order

Every order email now ends with a "When it ships" box with the order's ID.
Supabase → Table Editor → **order_tracking** → Insert row:
- `order_id`: paste the ID from the email
- `carrier`: USPS, UPS, FedEx, or the freight company's name
- `tracking_number`: the number
- `note` (optional): e.g. "Quarter panels, by truck"

Add one row per package (Golden Star, Scranton and Printful ship separately).
The order shows as Shipped with a "Track" link in the customer's account.
You can also change `status` in **orders** to `ordered`, `delivered` or `cancelled`.

## Homepage slideshow

The slides are listed in `lib/slides.ts`. Put pictures in `public/slides/`
(1600 × 838 pixels works best) and add an entry. Give a seasonal ad `start` and
`end` dates and it shows and hides itself.

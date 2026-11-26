import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import './globals.css';
import CartLink from '@/components/CartLink';
import AccountLink from '@/components/AccountLink';

export const metadata: Metadata = {
  title: { default: 'McIntyre’s Classic Chevy — 1955, 1956 and 1957 Chevrolet parts', template: '%s — McIntyre’s Classic Chevy' },
  description: 'Sheet metal and parts for 1955, 1956 and 1957 Chevrolets, picked by a family that has been restoring Tri-Fives for over 50 years.',
};

// Let people zoom as far as they like.
export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:block focus:p-4">Skip to the page</a>
        <header>
          <div className="bg-white">
            {/* Phones: account | logo (centered) | cart, then search full width. Wider screens: one row. */}
            <div className="wrap grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 gap-y-2 py-2 sm:flex sm:gap-x-4 sm:py-3">
              <div className="col-start-1 row-start-1 justify-self-start sm:order-3 sm:ml-0">
                <AccountLink />
              </div>
              <Link href="/" className="col-start-2 row-start-1 no-underline shrink-0 sm:order-1" aria-label="McIntyre’s Classic Chevy, home">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/mcintyres-logo-600.webp"
                  srcSet="/brand/mcintyres-logo-300.webp 300w, /brand/mcintyres-logo-600.webp 600w, /brand/mcintyres-logo-900.webp 900w"
                  sizes="(min-width: 640px) 200px, 170px"
                  alt="McIntyre’s Classic and Late Model Restoration Parts"
                  width={900}
                  height={375}
                  className="h-[70px] sm:h-[84px] w-auto"
                />
              </Link>
              <div className="col-start-3 row-start-1 justify-self-end sm:order-4">
                <CartLink />
              </div>
              <form action="/parts" method="get" role="search" className="col-span-3 row-start-2 relative w-full sm:order-2 sm:flex-1 sm:max-w-md sm:ml-auto">
                <label htmlFor="site-search" className="sr-only">Search parts</label>
                <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-onyx/50">
                  <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
                </svg>
                <input
                  id="site-search"
                  name="q"
                  type="search"
                  placeholder="Search ’55–’57 Chevy parts"
                  autoComplete="off"
                  enterKeyHint="search"
                  className="w-full h-[46px] sm:h-[50px] rounded-xl border-[3px] border-onyx bg-white pl-10 pr-3 text-base sm:text-lg text-onyx placeholder:text-onyx/55"
                />
                <button type="submit" className="sr-only">Search</button>
              </form>
            </div>
          </div>
          <div className="chrome-spear" aria-hidden />
        </header>
        {/* Green bar like the lower paint color on a two-tone Bel Air: shop by year, plus our own parts and merch. */}
        <nav aria-label="Shop" className="bg-brand">
          <ul className="wrap flex flex-wrap justify-center gap-x-5 gap-y-1 sm:gap-x-10 lg:gap-x-14 py-3 text-base sm:text-xl font-bold">
            <li><Link href="/planner?year=1955" className="nav-link" aria-label="1955 Chevy parts">’55</Link></li>
            <li><Link href="/planner?year=1956" className="nav-link" aria-label="1956 Chevy parts">’56</Link></li>
            <li><Link href="/planner?year=1957" className="nav-link" aria-label="1957 Chevy parts">’57</Link></li>
            <li><Link href="/other" className="nav-link">Non Tri-Five</Link></li>
            <li><Link href="/mcintyre-made" className="nav-link">McIntyre Made</Link></li>
            <li><Link href="/merch" className="nav-link">Merch</Link></li>
          </ul>
        </nav>
        <main id="main" className="wrap py-5 sm:py-8">{children}</main>
        <footer className="mt-12 bg-brand-dark text-white">
          <div className="wrap py-10 space-y-4">
            <p className="font-script text-3xl leading-none">McIntyre’s Classic Chevy</p>
            <p>Parts for ’55, ’56 and ’57 Chevrolets. Family owned in Scranton, Kansas.</p>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 font-bold" aria-label="More from McIntyre’s">
              <li><Link href="/planner" className="text-white">Find parts for my car</Link></li>
              <li><Link href="/mcintyre-made" className="text-white">McIntyre Made</Link></li>
              <li><Link href="/merch" className="text-white">Merch</Link></li>
              <li><Link href="/ask" className="text-white">Ask a question</Link></li>
              <li><Link href="/about" className="text-white">About us</Link></li>
            </ul>
            <p>
              Questions? <Link href="/ask" className="text-white">Send us a message and photos</Link> and we’ll write back.
              You can also email <a href="mailto:g3chevyparts@gmail.com" className="text-white">g3chevyparts@gmail.com</a> or
              leave a voicemail at <a href="tel:+17858173939" className="text-white">(785) 817-3939</a>.
            </p>
            <ul className="flex gap-3" aria-label="McIntyre’s on social media">
              <li>
                <a href="https://www.facebook.com/McIntyresClassicChevy/" aria-label="McIntyre’s on Facebook" className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 hover:text-white">
                  <svg aria-hidden width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z" /></svg>
                </a>
              </li>
              <li>
                <a href="https://www.youtube.com/@McIntyresClassicChevy" aria-label="McIntyre’s on YouTube" className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 hover:text-white">
                  <svg aria-hidden width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z" /></svg>
                </a>
              </li>
            </ul>
            <p className="text-sm"><Link href="/privacy" className="text-white">Privacy policy</Link></p>
            <p className="text-sm text-white/70">Chevrolet, Bel Air and Nomad are trademarks of General Motors. McIntyre’s is not affiliated with GM.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import './globals.css';
import CartLink from '@/components/CartLink';

// Header logo: 'wordmark' (script only, reads best on the green bar) or 'logo' (script + Clover).
// The Clover is the favicon and phone home-screen icon (app/icon.png, app/apple-icon.png, app/favicon.ico).
const LOGO: 'logo' | 'wordmark' = 'wordmark';

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
          <div className="bg-brand">
            <div className="wrap flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-4 gap-y-3 py-3">
              <Link href="/" className="no-underline flex flex-col items-start shrink-0" aria-label="McIntyre’s Classic Chevy, home">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/brand/${LOGO}-600.webp`}
                  srcSet={`/brand/${LOGO}-300.webp 300w, /brand/${LOGO}-600.webp 600w, /brand/${LOGO}-900.webp 900w`}
                  sizes="(min-width: 640px) 280px, 210px"
                  alt="McIntyre’s"
                  width={LOGO === 'logo' ? 900 : 900}
                  height={LOGO === 'logo' ? 304 : 269}
                  className="h-[64px] sm:h-[84px] w-auto"
                />
                <span className="outline-caps -mt-1 ml-[18%] text-[1.15rem] sm:text-[1.4rem]">Classic Chevy</span>
              </Link>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <form action="/parts" method="get" role="search" className="relative flex-1 sm:w-64 sm:flex-none">
                  <label htmlFor="site-search" className="sr-only">Search parts</label>
                  <svg aria-hidden width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-onyx/50">
                    <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
                  </svg>
                  <input
                    id="site-search"
                    name="q"
                    type="search"
                    placeholder="Search parts"
                    autoComplete="off"
                    enterKeyHint="search"
                    className="w-full h-[52px] rounded-xl border-[3px] border-onyx bg-white pl-11 pr-3 text-lg text-onyx placeholder:text-onyx/55"
                  />
                  <button type="submit" className="sr-only">Search</button>
                </form>
                <CartLink />
              </div>
            </div>
          </div>
          <div className="chrome-spear" aria-hidden />
        </header>
        <nav aria-label="Main" className="border-b-[3px] border-onyx/10">
          <ul className="wrap flex flex-wrap gap-x-6 gap-y-2 py-3 text-lg font-bold">
            <li><Link href="/planner">Find parts for my car</Link></li>
            <li><Link href="/mcintyre-made">McIntyre-Made</Link></li>
            <li><Link href="/ask">Ask a question</Link></li>
            <li><Link href="/about">About us</Link></li>
            <li><Link href="/other" className="font-normal">Non-Tri-Five parts</Link></li>
          </ul>
        </nav>
        <main id="main" className="wrap py-8">{children}</main>
        <footer className="mt-12 bg-brand-dark text-white">
          <div className="wrap py-10 space-y-4 text-lg">
            <p className="font-bold text-xl">McIntyre’s Classic Chevy</p>
            <p>Parts for ’55, ’56 and ’57 Chevrolets. Family owned in Scranton, Kansas.</p>
            <p>
              Questions? <Link href="/ask" className="text-white">Send us a message and photos</Link> and we’ll write back.
              You can also email <a href="mailto:g3chevyparts@gmail.com" className="text-white">g3chevyparts@gmail.com</a> or
              leave a voicemail at <a href="tel:+17858173939" className="text-white">(785) 817-3939</a>.
            </p>
            <p><a href="https://www.facebook.com/McIntyresClassicChevy/" className="text-white">McIntyre’s on Facebook</a> and <a href="https://www.youtube.com/@McIntyresClassicChevy" className="text-white">YouTube</a></p>
            <p className="text-base text-white/70">Chevrolet, Bel Air and Nomad are trademarks of General Motors. McIntyre’s is not affiliated with GM.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

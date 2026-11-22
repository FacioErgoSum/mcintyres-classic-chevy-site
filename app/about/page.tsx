import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About McIntyre’s',
  description: 'A lifetime in, on, around and under 1955, 1956 and 1957 Chevrolets.',
};

// Geoff's own words from the original McIntyre's website, lightly tidied.
export default function About() {
  return (
    <article className="space-y-6 max-w-[62ch]">
      <h1>A bit about me</h1>
      <p className="text-xl">
        Hi, my name is Geoff. Thanks for visiting. My passion for Tri-Five Chevys goes back to my earliest memories.
      </p>
      <p>
        My dad bought his first car in 1965. It was a 1957 Chevy Bel Air 4-door sedan, and he and my mom brought me home
        from the hospital in it. Several ’57s followed. He loved hardtops. His favorite was a Matador Red and India Ivory
        2-door hardtop with an original 2×4 270 hp 283 and a 3-speed. His friends with Tri-Fives would stop by for some wrench time.
      </p>
      <p>
        Dad taught me all the mechanical skills. We swapped engines, did brake jobs, replaced clutches and did tune-ups.
        I had memorized 1-8-4-3-6-5-7-2 by the time I was five. By ten, I could set points with a dwell meter,
        tune the carb with a vacuum gauge, and use the “ping” test to set maximum timing.
      </p>

      <figure className="-mx-4 sm:mx-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/photos/chassis-800.webp"
          srcSet="/photos/chassis-800.webp 800w, /photos/chassis-1400.webp 1400w"
          sizes="(min-width: 768px) 620px, 100vw"
          width={1400}
          height={1050}
          loading="lazy"
          alt="A finished rolling chassis with a red small-block V8 and polished wheels, in front of the shop"
          className="w-full h-auto sm:rounded-xl"
        />
        <figcaption className="px-4 sm:px-0 pt-2 text-base text-onyx/75">A frame-off chassis build outside the shop.</figcaption>
      </figure>

      <p>
        In 1984 I bought my very own ’57 Chevy, and I still have it today. It’s a yellow Bel Air 2-door sedan,
        and it has become my trademark. I was happy with just one for a while, but in ’91 I bought number two:
        a ’57 210 4-door wagon. That one’s a keeper too. After that the floodgates opened. I’ve had many of every year
        and nearly every model, and I usually have 15 to 20 at any given time.
      </p>
      <p>
        I started my first business, Classic Chevy Supply, in 1991. It mostly centered on buying parts cars and selling
        used parts at the Pomona swap meet in California. By 1997 I was doing complete restorations. I still sell used parts
        and rescue abandoned classics. Some get frame-off restorations, and some just get the ugly knocked off and go to a new home as projects.
      </p>
      <p>
        I have spent my entire life in, on, around and under ’55s, ’56s and ’57s, and I’ve been working on metal,
        bodywork and paint since the early ’90s.
      </p>
      <p>
        Along the way I’ve bought and sold well over a hundred ’55–’57s, plus a lot of Impalas, Chevy pickups and other classics.
        Sheet metal repair became the heart of what goes on in our shop, and the parts we sell are the parts we’ve installed ourselves.
      </p>
      <p>
        I understand the struggles of restoring a classic car, and the expense. Our mission is to bring you the best-fitting
        parts available at the best prices we can.
      </p>
      <blockquote className="border-l-[6px] border-brand pl-5 text-xl">
        Tri-Five Chevys are my legacy. I don’t really own these cars. I’ve been trusted as their temporary caretaker,
        and if I do my part to preserve them, they will live on long after I’m gone.
      </blockquote>
      <p className="text-xl font-bold">Geoff McIntyre, owner</p>
      <div className="flex flex-col gap-4 max-w-md pt-4">
        <Link href="/planner" className="btn-main">Find parts for my car</Link>
        <Link href="/ask" className="btn-plain">Ask us a question</Link>
      </div>
    </article>
  );
}

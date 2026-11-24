// The rotating banner at the top of the home page. Edit this list to change it.
//
// Each slide is one picture that opens a page when clicked.
//  - image: put the file in public/slides/ and write '/slides/name.webp'.
//    Best size: 1600 × 838 pixels (the same shape as a Facebook link picture).
//    Keep anything important away from the edges; phones crop a little.
//  - title / text / button: optional words drawn over the bottom of the picture.
//    Leave them out when the words are already in the picture (a finished ad).
//  - start / end: optional dates ('2026-11-20'). The slide only shows between them,
//    so a seasonal ad can go in early and take itself down.
// Slides show in this order. With one slide there's no rotating.

export type Slide = {
  image: string;
  imageLarge?: string; // optional sharper copy for big screens
  alt: string; // what the picture shows, read aloud to blind visitors
  href: string; // where a click goes, e.g. '/mcintyre-made' or '/parts/1955-chevy-car-hood'
  title?: string;
  text?: string;
  button?: string;
  start?: string;
  end?: string;
};

export const SLIDES: Slide[] = [
  // Example seasonal ad: add the picture, fill in the deal, remove the two slashes from each line.
  // {
  //   image: '/slides/black-friday.webp',
  //   alt: 'A red Chevy pickup with a cornucopia in the bed',
  //   href: '/parts',
  //   start: '2026-11-20',
  //   end: '2026-12-01',
  // },
  {
    image: '/photos/yard-800.webp',
    imageLarge: '/photos/yard-1600.webp',
    alt: 'A row of ’55, ’56 and ’57 Chevrolets parked on the grass outside the McIntyre’s shop',
    href: '/planner',
    title: 'Parts that fit your Tri-Five',
    text: 'Tell us your car and what you’re fixing.',
    button: 'Find parts for my car',
  },
  {
    image: '/photos/chassis-800.webp',
    imageLarge: '/photos/chassis-1400.webp',
    alt: 'Geoff McIntyre sitting on a rolling Tri-Five chassis with a red small-block outside his shop',
    href: '/mcintyre-made',
    title: 'McIntyre Made originals',
    text: 'Repair panels made in the USA.',
    button: 'See our parts',
  },
  {
    image: '/slides/redconvertible.jpeg',
    imageLarge: '/slides/redconvertible.jpeg',
    alt: '1957 Chevy driving with a cornucopia in the trunk',
    href: '/planner',
    title: 'Thankful for Savings',
    text: 'Black Friday savings across the entire store!',
    button: 'Check out the deals',
  },
];

/** Slides showing today (start/end dates are checked in US Central time). */
export function currentSlides(now = new Date()): Slide[] {
  const today = now.toLocaleDateString('en-CA', { timeZone: 'America/Chicago' }); // YYYY-MM-DD
  return SLIDES.filter((s) => (!s.start || s.start <= today) && (!s.end || today <= s.end));
}

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'What McIntyre’s Classic Chevy collects when you shop, ask a question or make an account, and how to have it deleted.',
};

const UPDATED = 'November 24, 2026';
const EMAIL = 'g3chevyparts@gmail.com';

export default function Privacy() {
  return (
    <article className="space-y-8 max-w-[65ch]">
      <div className="space-y-2">
        <h1>Privacy policy</h1>
        <p className="text-lg text-onyx/80">Last updated {UPDATED}</p>
      </div>
      <p>
        McIntyre’s Classic Chevy is a family business in Scranton, Kansas. This page explains what we learn about you when you use
        this website, why, and who else sees it. In short: we only collect what we need to answer your questions and ship your parts.
        We don’t sell your information, and we don’t use advertising trackers.
      </p>

      <section className="space-y-3">
        <h2>What we collect</h2>
        <ul className="list-disc pl-7 space-y-3">
          <li>
            <strong>When you order:</strong> your name, email, phone number, shipping address, and what you bought. You type your card
            details on Stripe’s secure checkout page. We never see or store your card number.
          </li>
          <li>
            <strong>When you ask a question:</strong> your name, email, your car’s year and body style if you give them, your message,
            and any photos you send.
          </li>
          <li>
            <strong>When you make an account:</strong> your name and email. If you sign in with Google or Facebook, they share your name,
            email address and profile picture with us. We never get your Google or Facebook password, and we can’t post anything for you.
          </li>
          <li>
            <strong>Lists you save:</strong> the parts on them, the names you give them, and any car you add (its nickname, year, body style
            and serial number). A list is private unless you turn on sharing. Then anyone with its link can see the list, its car and your
            first name.
          </li>
          <li>
            <strong>Your cart</strong> is kept in your own web browser, not on our computers, until you check out.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2>How we use it</h2>
        <p>
          To fill and ship your order, send you receipts and tracking, answer your questions, show your orders and lists in your account,
          and keep records our accountant and the tax office require. We don’t send marketing emails unless you ask for them.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Who else sees it</h2>
        <p>We share only what each company needs to do its part:</p>
        <ul className="list-disc pl-7 space-y-2">
          <li><strong>Stripe</strong> takes your payment.</li>
          <li><strong>Our parts warehouse</strong> gets your name, shipping address and phone number to ship your parts straight to you. Freight carriers use your phone number to schedule delivery.</li>
          <li><strong>Printful</strong> gets your name and address if you order printed shirts, totes or posters.</li>
          <li><strong>Supabase</strong> stores orders, accounts, lists, questions and photos for us.</li>
          <li><strong>Netlify</strong> runs this website, and <strong>Resend</strong> sends our emails.</li>
          <li><strong>Google</strong> and <strong>Facebook</strong>, only if you choose to sign in with them.</li>
        </ul>
        <p>We’ll also share information if the law requires it.</p>
      </section>

      <section className="space-y-3">
        <h2>Cookies</h2>
        <p>
          When you sign in, the site saves a small sign-in cookie so you stay signed in. That’s the only cookie we set. We don’t use
          advertising or tracking cookies.
        </p>
      </section>

      <section className="space-y-3">
        <h2>How long we keep it</h2>
        <p>
          Account details and lists stay until you delete them or ask us to. Questions and photos are kept for up to two years so we can
          look back at your car if you write again. Order records are kept as long as tax law requires, usually seven years.
        </p>
      </section>

      <section className="space-y-3" id="delete-your-data">
        <h2>Deleting your information</h2>
        <p>You can ask us to delete your account and everything tied to it at any time, including if you signed in with Google or Facebook.</p>
        <ol className="list-decimal pl-7 space-y-2">
          <li>Email <a href={`mailto:${EMAIL}?subject=Delete%20my%20data`}>{EMAIL}</a> with the subject <strong>Delete my data</strong>, from the email address on your account.</li>
          <li>We’ll delete your account, lists and questions within 30 days and email you when it’s done.</li>
        </ol>
        <p>
          We have to keep records of past orders for taxes, but they’re removed from your account and not used for anything else.
          You can delete a single list yourself any time from your <Link href="/account">account page</Link>.
          To also remove our access from Facebook, go to Facebook → Settings → Apps and Websites and remove McIntyre’s Classic Chevy.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Children</h2>
        <p>This site is meant for adults. We don’t knowingly collect information from children under 13.</p>
      </section>

      <section className="space-y-3">
        <h2>Changes and questions</h2>
        <p>
          If we change this policy, we’ll update the date at the top. Questions about your information? Email{' '}
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a> or leave a voicemail at <a href="tel:+17858173939">(785) 817-3939</a>.
        </p>
      </section>
    </article>
  );
}

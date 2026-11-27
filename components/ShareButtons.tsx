'use client';
import { useEffect, useState } from 'react';

// "Share this part" on part and merch pages. Facebook first, since that's where
// Tri-Five folks talk; then a text message, email and copy link. On phones, "More"
// opens the phone's own share menu (Messenger, groups, anything installed).
// url: the page's full address; title: what the share says.
export default function ShareButtons({ url, title, what = 'part' }: { url: string; title: string; what?: string }) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  useEffect(() => setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function'), []);

  const u = encodeURIComponent(url);
  const message = `${title} at McIntyre’s Classic Chevy`;
  const popup = (href: string) => {
    // A small window, like Facebook's own share buttons; a new tab if popups are blocked.
    const w = window.open(href, 'share', 'width=640,height=640,noopener');
    if (!w) window.open(href, '_blank', 'noopener');
  };

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt('Copy this link:', url); // older browsers
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const btn = 'btn-plain !w-auto !min-h-[48px] !px-4 !text-base gap-2';

  return (
    <section className="space-y-3" aria-labelledby="share-h">
      <h2 id="share-h" className="text-xl">Share this {what}</h2>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => popup(`https://www.facebook.com/sharer/sharer.php?u=${u}`)}
          className="btn !w-auto !min-h-[48px] !px-4 !text-base gap-2 bg-[#1877F2] text-white hover:bg-[#145dbf] hover:text-white"
        >
          <svg aria-hidden width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z" /></svg>
          Facebook
        </button>
        <a href={`sms:?&body=${encodeURIComponent(`${message}: ${url}`)}`} className={btn}>
          <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z" /></svg>
          Text
        </a>
        <a href={`mailto:?subject=${encodeURIComponent(message)}&body=${encodeURIComponent(`${message}:\n${url}`)}`} className={btn}>
          <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
          Email
        </a>
        <button type="button" onClick={copy} className={btn} aria-live="polite">
          <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>
          {copied ? 'Link copied' : 'Copy link'}
        </button>
        {canNativeShare && (
          <button type="button" onClick={() => navigator.share({ title: message, url }).catch(() => {})} className={btn}>
            <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12" /><path d="m7 8 5-5 5 5" /><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></svg>
            More
          </button>
        )}
      </div>
    </section>
  );
}

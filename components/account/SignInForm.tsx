'use client';
import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';

type Mode = 'signin' | 'signup';

export default function SignInForm({ next }: { next: string }) {
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const callback = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function withProvider(provider: 'google' | 'facebook') {
    setBusy(true);
    const { error } = await supabaseBrowser().auth.signInWithOAuth({ provider, options: { redirectTo: callback() } });
    if (error) {
      setMsg({ ok: false, text: `${provider === 'google' ? 'Google' : 'Facebook'} sign-in isn’t working right now. Please use your email instead.` });
      setBusy(false);
    }
  }

  async function withEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const sb = supabaseBrowser();
    if (mode === 'signin') {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) {
        setMsg({ ok: false, text: /confirm/i.test(error.message) ? 'Please click the link we emailed you first, then sign in.' : 'That email and password don’t match. Try again, or use “Email me a sign-in link”.' });
        setBusy(false);
        return;
      }
      window.location.href = next;
      return;
    }
    const { data, error } = await sb.auth.signUp({ email, password, options: { data: { full_name: name }, emailRedirectTo: callback() } });
    setBusy(false);
    if (error) return setMsg({ ok: false, text: error.message.includes('Password') ? 'Please use a password of at least 8 characters.' : error.message });
    if (data.session) {
      window.location.href = next;
      return;
    }
    setMsg({ ok: true, text: `Almost done: we emailed a link to ${email}. Click it to finish making your account.` });
  }

  async function emailLink() {
    if (!email) return setMsg({ ok: false, text: 'Type your email address above first.' });
    setBusy(true);
    const { error } = await supabaseBrowser().auth.signInWithOtp({ email, options: { emailRedirectTo: callback() } });
    setBusy(false);
    setMsg(error ? { ok: false, text: 'We couldn’t send the link. Check the email address and try again.' } : { ok: true, text: `We emailed a sign-in link to ${email}. Open it on this device to sign in.` });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <button type="button" className="btn-plain" disabled={busy} onClick={() => withProvider('google')}>
          <svg aria-hidden width="26" height="26" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
          Continue with Google
        </button>
        <button type="button" className="btn-plain" disabled={busy} onClick={() => withProvider('facebook')}>
          <svg aria-hidden width="26" height="26" viewBox="0 0 24 24"><path fill="#1877F2" d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z"/></svg>
          Continue with Facebook
        </button>
      </div>

      <form onSubmit={withEmail} className="space-y-5 rounded-xl border-[3px] border-onyx/15 p-5">
        <div className="flex gap-2" role="tablist" aria-label="Sign in or make an account">
          {(['signin', 'signup'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => { setMode(m); setMsg(null); }}
              className={`flex-1 rounded-lg px-3 py-3 text-lg font-bold border-[3px] ${mode === m ? 'bg-brand text-white border-brand' : 'bg-white text-onyx border-onyx/30'}`}
            >
              {m === 'signin' ? 'Sign in with email' : 'Make an account'}
            </button>
          ))}
        </div>
        {mode === 'signup' && (
          <div>
            <label htmlFor="acct-name" className="label">Your name</label>
            <input id="acct-name" className="field" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        )}
        <div>
          <label htmlFor="acct-email" className="label">Email</label>
          <input id="acct-email" type="email" required className="field" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor="acct-pass" className="label">{mode === 'signup' ? 'Choose a password (8 or more letters and numbers)' : 'Password'}</label>
          <input id="acct-pass" type="password" required minLength={mode === 'signup' ? 8 : undefined} className="field" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit" className="btn-main" disabled={busy}>{busy ? 'One moment…' : mode === 'signin' ? 'Sign in' : 'Make my account'}</button>
        {mode === 'signin' && (
          <p className="text-lg">Forgot your password, or don’t want one? <button type="button" className="underline underline-offset-4 decoration-2 text-brand-dark font-bold" onClick={emailLink} disabled={busy}>Email me a sign-in link</button></p>
        )}
      </form>

      {msg && (
        <p role={msg.ok ? 'status' : 'alert'} className={`rounded-lg p-4 text-lg border-[3px] ${msg.ok ? 'bg-brand-light border-brand' : 'bg-matador/10 border-matador'}`}>{msg.text}</p>
      )}
    </div>
  );
}

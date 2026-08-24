import { createClient } from '@supabase/supabase-js';

// ── Supabase client ──────────────────────────────────────────────────────────
// These are the project URL and the PUBLISHABLE (anon) key. They are designed
// to be shipped in the browser bundle and are safe to expose publicly.
//
// NEVER put the service_role / secret key here — it bypasses row-level security
// and must live only in the backend .env, never in frontend code or git.
const SUPABASE_URL = 'https://bmifcvvxxkaibbjyaujq.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_sB0C-POmA6yAqTgjQfGR9g_RerClO4b';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// ── Demo account ─────────────────────────────────────────────────────────────
// A built-in login that drops straight into the dashboard with no sign-up and
// no email verification — handy for demos and for exploring before the hardware
// is connected. It bypasses Supabase entirely, so it always works instantly.
export const DEMO_EMAIL = 'demo@agrosense.app';
export const DEMO_PASSWORD = 'agrosense';

export const isDemoCredentials = (email: string, password: string): boolean =>
  email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD;

// ── App session (survives page reload) ───────────────────────────────────────
// A lightweight flag kept in localStorage so refreshing the page keeps you
// signed in. Supabase persists its own session for confirmed accounts, but the
// demo login and any not-yet-confirmed account have no Supabase session to fall
// back on — this covers all three.
const SESSION_KEY = 'agrosense.session';

export function markSignedIn(email: string): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ email, at: Date.now() }));
  } catch {
    /* storage unavailable (private mode) — session just won't persist */
  }
}

export function hasAppSession(): boolean {
  try {
    return localStorage.getItem(SESSION_KEY) !== null;
  } catch {
    return false;
  }
}

export function clearAppSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* nothing to clear */
  }
}

// ── Result type ──────────────────────────────────────────────────────────────
export type AuthResult = { ok: true } | { ok: false; error: string };

// Turn raw Supabase error text into clean, human wording.
const friendly = (message: string): string => {
  const m = message.toLowerCase();
  if (m.includes('invalid login')) return 'That email or password is incorrect. Only accounts that have signed up can log in.';
  if (m.includes('not confirmed')) return "Your email isn't confirmed yet. Check your inbox, or use the demo login below to explore now.";
  if (m.includes('already registered') || m.includes('already exists') || m.includes('already been registered'))
    return 'An account with this email already exists — try signing in instead.';
  if (m.includes('at least') && m.includes('password')) return 'Please use a password with at least 6 characters.';
  if (m.includes('valid email') || m.includes('invalid email')) return 'Please enter a valid email address.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Too many attempts — please wait a moment and try again.';
  if (m.includes('failed to fetch') || m.includes('network')) return 'Could not reach the server. Check your connection and try again.';
  return message;
};

// ── Sign in ──────────────────────────────────────────────────────────────────
export async function signIn(email: string, password: string): Promise<AuthResult> {
  // Master/demo account: instant entry, no network, no verification.
  if (isDemoCredentials(email, password)) {
    markSignedIn(DEMO_EMAIL);
    return { ok: true };
  }

  // Everyone else must be a real, signed-up account.
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) return { ok: false, error: friendly(error.message) };
  markSignedIn(email.trim());
  return { ok: true };
}

// ── Sign up ──────────────────────────────────────────────────────────────────
// Creates the account and proceeds immediately — there is no "check your email"
// step. (Turn off "Confirm email" in Supabase → Authentication → Providers for a
// real session on every sign-up.)
export async function signUp(name: string, email: string, password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { full_name: name.trim() } },
  });
  if (error) return { ok: false, error: friendly(error.message) };
  markSignedIn(email.trim());
  return { ok: true };
}

// ── Sign out ─────────────────────────────────────────────────────────────────
export async function signOut(): Promise<void> {
  clearAppSession();
  await supabase.auth.signOut();
}

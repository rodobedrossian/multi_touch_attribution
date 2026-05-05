const ANON_KEY = '__attr_anon';
const SESSION_KEY = '__attr_session';
const COOKIE_DAYS = 365;

function uuidv4(): string {
  // crypto.randomUUID is available in modern browsers; fallback for older ones
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function setCookie(name: string, value: string, days: number): void {
  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  } catch {}
}

function getCookie(name: string): string | null {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

function lsGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

function lsSet(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch {}
}

export function getOrCreateAnonymousId(): string {
  let id = lsGet(ANON_KEY);
  if (id) return id;

  // Safari ITP: try cookie fallback
  id = getCookie(ANON_KEY);
  if (id) {
    lsSet(ANON_KEY, id);
    return id;
  }

  id = uuidv4();
  lsSet(ANON_KEY, id);
  setCookie(ANON_KEY, id, COOKIE_DAYS);
  return id;
}

export function getOrCreateSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = 'ses_' + uuidv4().replace(/-/g, '').slice(0, 12);
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return 'ses_' + uuidv4().replace(/-/g, '').slice(0, 12);
  }
}

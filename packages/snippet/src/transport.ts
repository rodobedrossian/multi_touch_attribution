import { enqueue } from './queue';

const BACKOFF_MS = [1000, 3000, 10_000];

// Simple HMAC-SHA256 using SubtleCrypto (async)
async function computeHmac(secret: string, body: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(body));
  // base64url encode
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function buildWriteKeyHeader(writeKey: string, body: string): Promise<string> {
  const dotIdx = writeKey.indexOf('.');
  if (dotIdx === -1) return writeKey;
  const keyId = writeKey.slice(0, dotIdx);
  const secret = writeKey.slice(dotIdx + 1);
  const sig = await computeHmac(secret, body);
  return `${keyId}.${sig}`;
}

export async function sendRequest(
  collectorUrl: string,
  endpoint: string,
  body: string,
  writeKey: string,
  attempt = 0
): Promise<void> {
  const url = `${collectorUrl}${endpoint}`;
  try {
    const header = await buildWriteKeyHeader(writeKey, body);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Write-Key': header,
      },
      body,
      keepalive: true,
    });
    if (!res.ok && res.status !== 429) throw new Error(`HTTP ${res.status}`);
  } catch {
    if (attempt < BACKOFF_MS.length) {
      setTimeout(() => sendRequest(collectorUrl, endpoint, body, writeKey, attempt + 1), BACKOFF_MS[attempt]);
    } else {
      enqueue(url, body);
    }
  }
}

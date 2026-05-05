import { createHmac, timingSafeEqual, createHash } from 'crypto';

export function computeHmac(secret: string, body: string): string {
  return createHmac('sha256', secret).update(body).digest('base64url');
}

export function verifyHmac(secret: string, body: string, signature: string): boolean {
  const expected = computeHmac(secret, body);
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export function sha256(value: string): string {
  return createHash('sha256').update(value.toLowerCase().trim()).digest('hex');
}

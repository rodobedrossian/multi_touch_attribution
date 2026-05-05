import { LRUCache } from 'lru-cache';

interface GeoResult {
  geo_country: string | null;
  geo_city: string | null;
}

const cache = new LRUCache<string, GeoResult>({
  max: 1000,
  ttl: 1000 * 60 * 60 * 24, // 24 hours
});

export async function lookupGeo(ip: string | undefined): Promise<GeoResult> {
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('10.') || ip.startsWith('192.168.')) {
    return { geo_country: null, geo_city: null };
  }

  const cached = cache.get(ip);
  if (cached) return cached;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode,city`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error('non-200');
    const data = await res.json() as { countryCode?: string; city?: string };
    const result: GeoResult = {
      geo_country: data.countryCode ?? null,
      geo_city: data.city ?? null,
    };
    cache.set(ip, result);
    return result;
  } catch {
    return { geo_country: null, geo_city: null };
  }
}

export function extractIp(forwardedFor: string | undefined, remoteAddress: string | undefined): string | undefined {
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0].trim();
    if (first) return first;
  }
  return remoteAddress;
}

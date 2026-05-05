import { UAParser } from 'ua-parser-js';

export interface DeviceInfo {
  device_type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string | null;
  os: string | null;
}

export function parseUserAgent(ua: string | undefined): DeviceInfo {
  if (!ua) return { device_type: 'unknown', browser: null, os: null };

  const parser = new UAParser(ua);
  const result = parser.getResult();

  let device_type: DeviceInfo['device_type'] = 'desktop';
  const deviceType = result.device.type;
  if (deviceType === 'mobile') device_type = 'mobile';
  else if (deviceType === 'tablet') device_type = 'tablet';

  const browser = result.browser.name ?? null;
  const os = result.os.name ?? null;

  return { device_type, browser, os };
}

const BOT_PATTERNS = [
  /bot/i, /crawler/i, /spider/i, /slurp/i, /googlebot/i, /bingbot/i,
  /facebookexternalhit/i, /twitterbot/i, /linkedinbot/i, /semrushbot/i,
  /ahrefsbot/i, /mj12bot/i, /yandexbot/i, /baiduspider/i, /duckduckbot/i,
  /petalbot/i, /applebot/i, /headlesschrome/i, /phantomjs/i,
];

export function isBot(ua: string | undefined): boolean {
  if (!ua) return false;
  return BOT_PATTERNS.some(pattern => pattern.test(ua));
}

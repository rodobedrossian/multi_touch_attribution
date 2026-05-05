import { getOrCreateAnonymousId, getOrCreateSessionId } from './identity';
import { captureUtm, getStoredUtm } from './utm';
import { flushQueue } from './queue';
import { sendRequest } from './transport';

declare global {
  interface Window {
    analyticsWriteKey?: string;
    analytics: {
      track: (event: string, properties?: Record<string, unknown>) => void;
      identify: (
        userId: string,
        traits: { email: string; name?: string; [key: string]: unknown },
        conversion?: { type?: string; value?: number; currency?: string }
      ) => void;
    };
  }
}

(function () {
  const writeKey = window.analyticsWriteKey;
  if (!writeKey) {
    console.warn('[attribution] window.analyticsWriteKey is not set');
    return;
  }

  // Derive collector URL from write key host if not set separately
  const collectorUrl = (window as Window & { analyticsCollectorUrl?: string }).analyticsCollectorUrl
    || 'https://api.yourapp.com'; // replaced at build/deploy time

  const anonymousId = getOrCreateAnonymousId();
  const sessionId = getOrCreateSessionId();

  function sendTrack(event: string, properties: Record<string, unknown> = {}): void {
    const body = JSON.stringify({
      anonymousId,
      sessionId,
      event,
      timestamp: new Date().toISOString(),
      properties,
    });
    sendRequest(collectorUrl, '/v1/track', body, writeKey!);
  }

  function identify(
    userId: string,
    traits: { email: string; name?: string; [key: string]: unknown },
    conversion?: { type?: string; value?: number; currency?: string }
  ): void {
    const body = JSON.stringify({
      anonymousId,
      userId: userId || undefined,
      traits,
      conversion,
    });
    sendRequest(collectorUrl, '/v1/identify', body, writeKey!);
  }

  // Flush offline-queued events from previous sessions
  const sendQueued = (url: string, body: string): Promise<void> => {
    // For queued items, url already includes full path; we need to re-sign.
    // Extract endpoint from full URL.
    const endpoint = url.replace(collectorUrl, '');
    return sendRequest(collectorUrl, endpoint, body, writeKey!);
  };

  window.addEventListener('online', () => flushQueue(sendQueued));
  flushQueue(sendQueued);

  // Auto-track initial pageview
  const utms = { ...captureUtm(), ...getStoredUtm() };
  sendTrack('pageview', {
    url: location.href,
    referrer: document.referrer,
    title: document.title,
    ...utms,
  });

  // Track SPA navigations (history.pushState)
  const origPushState = history.pushState.bind(history);
  history.pushState = function (...args: Parameters<typeof history.pushState>) {
    origPushState(...args);
    sendTrack('pageview', {
      url: location.href,
      title: document.title,
      ...getStoredUtm(),
    });
  };

  window.analytics = { track: sendTrack, identify };
})();

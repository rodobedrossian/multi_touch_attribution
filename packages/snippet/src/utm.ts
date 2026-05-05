const UTM_KEY = '__attr_utm';
const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

export type UtmData = Partial<Record<typeof UTM_PARAMS[number], string>>;

export function captureUtm(): UtmData {
  try {
    const params = new URLSearchParams(window.location.search);
    const utm: UtmData = {};
    for (const key of UTM_PARAMS) {
      const v = params.get(key);
      if (v) utm[key] = v;
    }
    if (Object.keys(utm).length > 0) {
      sessionStorage.setItem(UTM_KEY, JSON.stringify(utm));
    }
    return utm;
  } catch {
    return {};
  }
}

export function getStoredUtm(): UtmData {
  try {
    return JSON.parse(sessionStorage.getItem(UTM_KEY) || '{}');
  } catch {
    return {};
  }
}

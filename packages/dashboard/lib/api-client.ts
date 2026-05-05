export interface ChannelRow {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  conversions: number;
  value: number | null;
  cpa: number | null;
}

export interface ChannelsResponse {
  model: string;
  from: string;
  to: string;
  rows: ChannelRow[];
  totals: { conversions: number; value: number };
}

export interface SummaryResponse {
  from: string;
  to: string;
  totalConversions: number;
  totalValue: number | null;
  uniqueUsers: number;
  topChannel: { source: string | null; medium: string | null; campaign: string | null; conversions: number } | null;
  conversionsByDay: { date: string; conversions: number }[];
}

export interface Touchpoint {
  type: string;
  url: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  timestamp: string;
}

export interface Conversion {
  conversionId: string;
  type: string;
  value: number | null;
  convertedAt: string;
  lastTouchSource: string | null;
  lastTouchMedium: string | null;
  lastTouchCampaign: string | null;
}

export interface JourneyResponse {
  userId: string;
  touchpoints: Touchpoint[];
  conversions: Conversion[];
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function fetchSummary(from: string, to: string): Promise<SummaryResponse> {
  return apiFetch(`/api/proxy/reports/summary?from=${from}&to=${to}`);
}

export function fetchChannels(from: string, to: string): Promise<ChannelsResponse> {
  return apiFetch(`/api/proxy/reports/channels?from=${from}&to=${to}&model=last_touch`);
}

export function fetchJourney(email: string): Promise<JourneyResponse> {
  return apiFetch(`/api/proxy/reports/journeys?email=${encodeURIComponent(email)}`);
}

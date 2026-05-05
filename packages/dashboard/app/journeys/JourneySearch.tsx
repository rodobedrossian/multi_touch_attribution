'use client';

import { useState, useCallback } from 'react';
import { JourneyTimeline } from '@/components/tables/JourneyTimeline';
import { fetchJourney } from '@/lib/api-client';
import type { JourneyResponse } from '@/lib/api-client';
import { Search } from 'lucide-react';

export default function JourneySearch() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [data, setData] = useState<JourneyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    setSubmitted(email.trim());
    try {
      const result = await fetchJourney(email.trim());
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [email]);

  return (
    <div>
      <form onSubmit={search} className="flex gap-2 mb-8 max-w-md">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="user@example.com"
            className="w-full pl-8 pr-4 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error === 'USER_NOT_FOUND' ? `No user found for ${submitted}` : error}
        </div>
      )}

      {data && (
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium">Journey for {submitted}</h2>
            <span className="text-xs text-muted-foreground">
              {data.touchpoints.length} touchpoints · {data.conversions.length} conversion{data.conversions.length !== 1 ? 's' : ''}
            </span>
          </div>
          <JourneyTimeline touchpoints={data.touchpoints} conversions={data.conversions} />
        </div>
      )}

      {!data && !error && !loading && (
        <div className="text-center py-16 text-sm text-muted-foreground">
          Enter an email address above to explore a user&apos;s journey
        </div>
      )}
    </div>
  );
}

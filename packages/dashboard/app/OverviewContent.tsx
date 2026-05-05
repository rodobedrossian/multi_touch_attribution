import { headers } from 'next/headers';
import { ConversionsByChannelChart } from '@/components/charts/ConversionsByChannelChart';
import { CpaTrendChart } from '@/components/charts/CpaTrendChart';
import { ChannelTable } from '@/components/tables/ChannelTable';
import { formatCurrency, formatNumber, channelLabel, daysAgo, today } from '@/lib/formatters';
import type { SummaryResponse, ChannelsResponse } from '@/lib/api-client';

async function getData(from: string, to: string) {
  const base = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
  const adminKey = process.env.ADMIN_KEY ?? '';

  const [summaryRes, channelsRes] = await Promise.all([
    fetch(`${base}/v1/reports/summary?from=${from}&to=${to}`, {
      headers: { 'X-Admin-Key': adminKey },
      cache: 'no-store',
    }),
    fetch(`${base}/v1/reports/channels?from=${from}&to=${to}&model=last_touch`, {
      headers: { 'X-Admin-Key': adminKey },
      cache: 'no-store',
    }),
  ]);

  return {
    summary: await summaryRes.json() as SummaryResponse,
    channels: await channelsRes.json() as ChannelsResponse,
  };
}

interface Props {
  searchParams?: { from?: string; to?: string };
}

export async function OverviewContent({ searchParams }: Props) {
  const from = searchParams?.from ?? daysAgo(30);
  const to = searchParams?.to ?? today();

  const { summary, channels } = await getData(from, to);

  const stats = [
    { label: 'Total Conversions', value: formatNumber(summary.totalConversions) },
    { label: 'Total Value', value: formatCurrency(summary.totalValue) },
    { label: 'Unique Users', value: formatNumber(summary.uniqueUsers) },
    {
      label: 'Top Channel',
      value: summary.topChannel
        ? channelLabel(summary.topChannel.source, summary.topChannel.medium)
        : '—',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-5">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className="text-2xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Trend chart */}
      {summary.conversionsByDay.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-medium mb-4">Daily Conversions</h2>
          <CpaTrendChart data={summary.conversionsByDay} />
        </div>
      )}

      {/* Channel chart */}
      {channels.rows.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-medium mb-4">Conversions by Channel</h2>
          <ConversionsByChannelChart data={channels.rows} />
        </div>
      )}

      {/* CPA table */}
      {channels.rows.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-medium mb-4">Channel Performance</h2>
          <ChannelTable rows={channels.rows} />
        </div>
      )}
    </div>
  );
}

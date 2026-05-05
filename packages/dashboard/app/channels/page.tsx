import { Suspense } from 'react';
import { DateRangePicker } from '@/components/layout/DateRangePicker';
import { ChannelTable } from '@/components/tables/ChannelTable';
import { daysAgo, today } from '@/lib/formatters';
import type { ChannelsResponse } from '@/lib/api-client';
import ChannelExportWrapper from './ChannelExportWrapper';

async function getChannels(from: string, to: string): Promise<ChannelsResponse> {
  const base = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
  const res = await fetch(`${base}/v1/reports/channels?from=${from}&to=${to}&model=last_touch`, {
    headers: { 'X-Admin-Key': process.env.ADMIN_KEY ?? '' },
    cache: 'no-store',
  });
  return res.json();
}

interface Props {
  searchParams?: { from?: string; to?: string };
}

export default async function ChannelsPage({ searchParams }: Props) {
  const from = searchParams?.from ?? daysAgo(30);
  const to = searchParams?.to ?? today();
  const data = await getChannels(from, to);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Channels</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Last-touch attribution by channel</p>
        </div>
        <Suspense><DateRangePicker /></Suspense>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <ChannelExportWrapper rows={data.rows} />
      </div>
    </div>
  );
}

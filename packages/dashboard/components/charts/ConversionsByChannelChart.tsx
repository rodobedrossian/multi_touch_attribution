'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { channelLabel } from '@/lib/formatters';
import type { ChannelRow } from '@/lib/api-client';

interface Props {
  data: ChannelRow[];
}

export function ConversionsByChannelChart({ data }: Props) {
  const chartData = data.slice(0, 10).map(r => ({
    name: channelLabel(r.source, r.medium),
    conversions: r.conversions,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(v: number) => [v, 'Conversions']}
          contentStyle={{ fontSize: 12, borderRadius: 6 }}
        />
        <Bar dataKey="conversions" fill="hsl(221 83% 53%)" radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

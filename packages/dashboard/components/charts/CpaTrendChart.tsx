'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDateShort } from '@/lib/formatters';

interface DayData {
  date: string;
  conversions: number;
}

interface Props {
  data: DayData[];
}

export function CpaTrendChart({ data }: Props) {
  const chartData = data.map(d => ({
    date: formatDateShort(d.date),
    conversions: d.conversions,
  }));

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={chartData} margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} width={28} />
        <Tooltip formatter={(v: number) => [v, 'Conversions']} contentStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="conversions"
          stroke="hsl(221 83% 53%)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

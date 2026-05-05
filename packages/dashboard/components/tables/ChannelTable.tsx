'use client';

import { useState } from 'react';
import { formatCurrency, formatNumber, channelLabel } from '@/lib/formatters';
import type { ChannelRow } from '@/lib/api-client';
import { ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type SortKey = keyof Pick<ChannelRow, 'conversions' | 'value' | 'cpa'>;

interface Props {
  rows: ChannelRow[];
  onExport?: () => void;
}

export function ChannelTable({ rows, onExport }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('conversions');
  const [dir, setDir] = useState<'desc' | 'asc'>('desc');

  function toggleSort(key: SortKey) {
    if (sortKey === key) setDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setDir('desc'); }
  }

  const sorted = [...rows].sort((a, b) => {
    const av = a[sortKey] ?? 0;
    const bv = b[sortKey] ?? 0;
    return dir === 'desc' ? (bv as number) - (av as number) : (av as number) - (bv as number);
  });

  const th = (label: string, key?: SortKey) => (
    <th
      key={label}
      className={cn('px-4 py-2 text-left text-xs font-medium text-muted-foreground', key && 'cursor-pointer select-none hover:text-foreground')}
      onClick={() => key && toggleSort(key)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {key && <ArrowUpDown size={10} />}
      </span>
    </th>
  );

  return (
    <div>
      {onExport && (
        <div className="flex justify-end mb-3">
          <button
            onClick={onExport}
            className="text-xs px-3 py-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
          >
            Export CSV
          </button>
        </div>
      )}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {th('Channel')}
              {th('Campaign')}
              {th('Conversions', 'conversions')}
              {th('Value', 'value')}
              {th('CPA', 'cpa')}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No data for this period
                </td>
              </tr>
            )}
            {sorted.map((row, i) => (
              <tr key={i} className="border-t border-border hover:bg-muted/30 transition-colors">
                <td className="px-4 py-2.5 font-medium">{channelLabel(row.source, row.medium)}</td>
                <td className="px-4 py-2.5 text-muted-foreground text-xs">{row.campaign ?? '—'}</td>
                <td className="px-4 py-2.5">{formatNumber(row.conversions)}</td>
                <td className="px-4 py-2.5">{formatCurrency(row.value)}</td>
                <td className="px-4 py-2.5">{formatCurrency(row.cpa)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

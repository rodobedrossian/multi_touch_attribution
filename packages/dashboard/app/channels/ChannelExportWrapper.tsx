'use client';

import { ChannelTable } from '@/components/tables/ChannelTable';
import type { ChannelRow } from '@/lib/api-client';
import { channelLabel } from '@/lib/formatters';

interface Props {
  rows: ChannelRow[];
}

export default function ChannelExportWrapper({ rows }: Props) {
  function exportCsv() {
    const headers = ['Channel', 'Campaign', 'Conversions', 'Value', 'CPA'];
    const lines = rows.map(r =>
      [
        channelLabel(r.source, r.medium),
        r.campaign ?? '',
        r.conversions,
        r.value ?? '',
        r.cpa?.toFixed(2) ?? '',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    );
    const csv = [headers.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attribution-channels.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return <ChannelTable rows={rows} onExport={exportCsv} />;
}

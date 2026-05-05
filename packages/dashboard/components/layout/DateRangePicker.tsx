'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { daysAgo, today } from '@/lib/formatters';

const PRESETS = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
];

export function DateRangePicker() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const currentFrom = params.get('from') ?? daysAgo(30);
  const currentTo = params.get('to') ?? today();

  function apply(from: string, to: string) {
    const next = new URLSearchParams(params.toString());
    next.set('from', from);
    next.set('to', to);
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="flex items-center gap-1">
      {PRESETS.map(({ label, days }) => {
        const from = daysAgo(days);
        const to = today();
        const active = currentFrom === from && currentTo === to;
        return (
          <button
            key={label}
            onClick={() => apply(from, to)}
            className={cn(
              'px-2.5 py-1 rounded text-xs font-medium border transition-colors',
              active
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
            )}
          >
            {label}
          </button>
        );
      })}
      <input
        type="date"
        value={currentFrom}
        onChange={e => apply(e.target.value, currentTo)}
        className="ml-2 text-xs border border-border rounded px-2 py-1 bg-background text-foreground"
      />
      <span className="text-xs text-muted-foreground">→</span>
      <input
        type="date"
        value={currentTo}
        onChange={e => apply(currentFrom, e.target.value)}
        className="text-xs border border-border rounded px-2 py-1 bg-background text-foreground"
      />
    </div>
  );
}

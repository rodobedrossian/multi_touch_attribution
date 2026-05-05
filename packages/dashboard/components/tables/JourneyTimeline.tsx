'use client';

import { formatDate, channelLabel } from '@/lib/formatters';
import type { Touchpoint, Conversion } from '@/lib/api-client';
import { Globe, MousePointer, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  touchpoints: Touchpoint[];
  conversions: Conversion[];
}

interface TimelineNode {
  kind: 'touchpoint' | 'conversion';
  ts: string;
  touchpoint?: Touchpoint;
  conversion?: Conversion;
}

export function JourneyTimeline({ touchpoints, conversions }: Props) {
  const nodes: TimelineNode[] = [
    ...touchpoints.map(t => ({ kind: 'touchpoint' as const, ts: t.timestamp, touchpoint: t })),
    ...conversions.map(c => ({ kind: 'conversion' as const, ts: c.convertedAt, conversion: c })),
  ].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

  if (nodes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">No touchpoints found for this user.</p>
    );
  }

  return (
    <div className="relative pl-6 space-y-1">
      <div className="absolute left-2.5 top-2 bottom-2 w-px bg-border" />
      {nodes.map((node, i) => {
        if (node.kind === 'conversion') {
          const c = node.conversion!;
          return (
            <div key={`conv-${i}`} className="relative flex gap-3 py-3">
              <div className="absolute -left-3.5 w-6 h-6 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center">
                <CheckCircle size={12} className="text-green-600" />
              </div>
              <div className="ml-4 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-green-800">Conversion — {c.type}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(c.convertedAt)}</span>
                </div>
                <p className="text-xs text-green-700 mt-0.5">
                  Last touch: {channelLabel(c.lastTouchSource, c.lastTouchMedium)}
                  {c.lastTouchCampaign && ` · ${c.lastTouchCampaign}`}
                </p>
              </div>
            </div>
          );
        }

        const t = node.touchpoint!;
        const isPageview = t.type === 'pageview';
        return (
          <div key={`tp-${i}`} className="relative flex gap-3 py-1.5">
            <div className={cn(
              'absolute -left-3.5 w-5 h-5 rounded-full border-2 flex items-center justify-center',
              isPageview ? 'bg-white border-border' : 'bg-primary/10 border-primary/30'
            )}>
              {isPageview
                ? <Globe size={10} className="text-muted-foreground" />
                : <MousePointer size={10} className="text-primary" />
              }
            </div>
            <div className="ml-4 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-medium text-foreground">{t.type}</span>
                  {t.utm_source && (
                    <span className="ml-2 text-xs bg-primary/10 text-primary rounded px-1.5 py-0.5">
                      {channelLabel(t.utm_source, t.utm_medium)}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(t.timestamp)}</span>
              </div>
              {t.url && (
                <p className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">{t.url}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

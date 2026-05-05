import { Suspense } from 'react';
import { DateRangePicker } from '@/components/layout/DateRangePicker';
import { OverviewContent } from './OverviewContent';

export default function OverviewPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Overview</h1>
        <Suspense><DateRangePicker /></Suspense>
      </div>
      <Suspense fallback={<LoadingSkeleton />}>
        <OverviewContent />
      </Suspense>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  );
}

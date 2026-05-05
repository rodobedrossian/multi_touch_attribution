import { Suspense } from 'react';
import JourneySearch from './JourneySearch';

export default function JourneysPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Journey Explorer</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Search by email to view a user&apos;s complete touchpoint timeline
        </p>
      </div>
      <Suspense>
        <JourneySearch />
      </Suspense>
    </div>
  );
}

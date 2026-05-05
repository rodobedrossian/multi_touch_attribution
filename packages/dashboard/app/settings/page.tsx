import { Suspense } from 'react';
import SettingsContent from './SettingsContent';

export default function SettingsPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage write keys and snippet installation</p>
      </div>
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}

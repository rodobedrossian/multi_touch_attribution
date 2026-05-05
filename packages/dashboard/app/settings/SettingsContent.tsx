'use client';

import { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';

interface WriteKey {
  id: string;
  key_hash: string;
  domain: string;
  label: string;
  created_at: string;
  revoked_at: string | null;
}

const UTM_CONVENTIONS = [
  { channel: 'Paid Search', source: 'google', medium: 'cpc', example: 'brand-q1-2025' },
  { channel: 'Paid Social (Meta)', source: 'meta', medium: 'paid-social', example: 'awareness-q1-2025' },
  { channel: 'Paid Social (TikTok)', source: 'tiktok', medium: 'paid-social', example: 'product-q1-2025' },
  { channel: 'Email', source: 'email', medium: 'newsletter', example: 'weekly-2025-03-01' },
  { channel: 'Organic Social', source: 'instagram', medium: 'social', example: 'organic' },
  { channel: 'LinkedIn', source: 'linkedin', medium: 'paid-social', example: 'b2b-q1-2025' },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button onClick={copy} className="text-muted-foreground hover:text-foreground transition-colors">
      {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
    </button>
  );
}

export default function SettingsContent() {
  const [keys, setKeys] = useState<WriteKey[]>([]);
  const [selectedKey, setSelectedKey] = useState<WriteKey | null>(null);
  const [loading, setLoading] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';

  useEffect(() => {
    fetch('/api/proxy/write-keys')
      .then(r => r.json())
      .then(d => {
        const activeKeys = (d.keys ?? []).filter((k: WriteKey) => !k.revoked_at);
        setKeys(activeKeys);
        if (activeKeys.length > 0) setSelectedKey(activeKeys[0]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const snippetCode = selectedKey
    ? `<script>\n  window.analyticsWriteKey = '${selectedKey.id}.<YOUR_SECRET>';\n  window.analyticsCollectorUrl = '${apiUrl}';\n</script>\n<script src="${apiUrl.replace(':3000', ':3001')}/analytics.min.js" async></script>`
    : '';

  const identifyExample = `// On form submit:\nanalytics.identify('', {\n  email: form.email.value,\n  name: form.name.value,\n}, {\n  type: 'lead',   // or 'purchase', 'demo', etc.\n  value: 0,\n});`;

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Write Keys */}
      <section>
        <h2 className="text-sm font-semibold mb-3">Write Keys</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : keys.length === 0 ? (
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
            No write keys found. Create one using the CLI script:<br />
            <code className="text-xs mt-2 block">npx tsx packages/api/src/scripts/create-write-key.ts --domain yourdomain.com --label &quot;Production&quot;</code>
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Label</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Domain</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Key ID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Created</th>
                </tr>
              </thead>
              <tbody>
                {keys.map(k => (
                  <tr
                    key={k.id}
                    className={`border-t border-border cursor-pointer transition-colors ${selectedKey?.id === k.id ? 'bg-primary/5' : 'hover:bg-muted/30'}`}
                    onClick={() => setSelectedKey(k)}
                  >
                    <td className="px-4 py-2.5 font-medium">{k.label}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{k.domain}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{k.id.slice(0, 8)}…</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {new Date(k.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Snippet Installer */}
      {selectedKey && (
        <section>
          <h2 className="text-sm font-semibold mb-1">Snippet Installation</h2>
          <p className="text-xs text-muted-foreground mb-3">
            Add this to the <code>&lt;head&gt;</code> of every page you want to track.
            Replace <code>&lt;YOUR_SECRET&gt;</code> with the secret shown when you created the key.
          </p>
          <div className="relative rounded-lg border border-border bg-muted/40 p-4">
            <pre className="text-xs font-mono whitespace-pre-wrap text-foreground">{snippetCode}</pre>
            <div className="absolute top-3 right-3">
              <CopyButton text={snippetCode} />
            </div>
          </div>
          <h3 className="text-sm font-semibold mt-4 mb-1">Identify on Form Submit</h3>
          <div className="relative rounded-lg border border-border bg-muted/40 p-4">
            <pre className="text-xs font-mono whitespace-pre-wrap text-foreground">{identifyExample}</pre>
            <div className="absolute top-3 right-3">
              <CopyButton text={identifyExample} />
            </div>
          </div>
        </section>
      )}

      {/* UTM Convention Guide */}
      <section>
        <h2 className="text-sm font-semibold mb-3">UTM Naming Conventions</h2>
        <p className="text-xs text-muted-foreground mb-3">
          All UTM values must be lowercase, hyphen-separated. Include the time period in campaigns (e.g. <code>brand-q1-2025</code>).
        </p>
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Channel</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">utm_source</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">utm_medium</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">utm_campaign example</th>
              </tr>
            </thead>
            <tbody>
              {UTM_CONVENTIONS.map((row, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-4 py-2.5 font-medium">{row.channel}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{row.source}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{row.medium}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{row.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart2, GitBranch, Settings, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/', label: 'Overview', icon: TrendingUp },
  { href: '/channels', label: 'Channels', icon: BarChart2 },
  { href: '/journeys', label: 'Journeys', icon: GitBranch },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 w-56 border-r border-border bg-card flex flex-col z-10">
      <div className="px-4 py-5 border-b border-border">
        <span className="font-semibold text-sm text-foreground">Attribution Tracker</span>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

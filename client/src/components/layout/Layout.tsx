import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import type { RouteId } from '../../navItems';
import { Flame } from '../ui/Flame';
import { IconMenu } from '../ui/icons';

export function Layout({
  active,
  onNavigate,
  streakCount = 0,
  headerLeft,
  headerRight,
  children,
}: {
  active: RouteId;
  onNavigate: (id: RouteId) => void;
  streakCount?: number;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const go = (id: RouteId) => {
    onNavigate(id);
    setMobileOpen(false);
  };

  return (
    <div className="min-h-full">
      <Sidebar
        active={active}
        onNavigate={go}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="lg:pl-72">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-hair bg-ink-950/80 px-4 py-3 backdrop-blur lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-fg-muted hover:bg-ink-800 hover:text-fg"
            aria-label="Open menu"
          >
            <IconMenu />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">Physique Tracker</span>
          </div>
          {streakCount > 0 ? (
            <span
              className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-1 text-xs font-semibold text-accent-soft"
              title={`${streakCount}-session streak`}
            >
              <Flame size={14} embers={false} /> {streakCount}
            </span>
          ) : (
            <div className="w-9" />
          )}
        </header>

        {/* Desktop header strip */}
        {(headerLeft || headerRight) && (
          <div className="sticky top-0 z-10 hidden items-center justify-between gap-4 border-b border-hair bg-ink-950/60 px-8 py-3 backdrop-blur lg:flex">
            <div className="min-w-0">{headerLeft}</div>
            {headerRight}
          </div>
        )}

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div key={active} className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

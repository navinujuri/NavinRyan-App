import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import type { RouteId } from '../../navItems';
import { IconFlame, IconMenu } from '../ui/icons';

export function Layout({
  active,
  onNavigate,
  headerRight,
  children,
}: {
  active: RouteId;
  onNavigate: (id: RouteId) => void;
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
            <IconFlame className="text-accent-soft" width={18} height={18} />
            <span className="text-sm font-bold">Physique Tracker</span>
          </div>
          <div className="w-9" />
        </header>

        {/* Desktop header strip */}
        {headerRight && (
          <div className="sticky top-0 z-10 hidden items-center justify-end border-b border-hair bg-ink-950/60 px-8 py-3 backdrop-blur lg:flex">
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

import { useMemo, useState } from 'react';
import { NAV_ITEMS, type NavItem, type RouteId } from '../../navItems';
import { useAuth } from '../../state/AuthContext';
import { useData } from '../../state/DataContext';
import { ryanReynoldsProgress } from '../../lib/calculations';
import { AccountModal } from '../AccountModal';
import { Ring } from '../ui/Ring';
import { IconClose, IconLogout, IconSettings } from '../ui/icons';

const GROUP_ORDER: NavItem['group'][] = ['Overview', 'Training', 'Body', 'Insights'];

export function Sidebar({
  active,
  onNavigate,
  mobileOpen,
  onCloseMobile,
}: {
  active: RouteId;
  onNavigate: (id: RouteId) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const { user, logout } = useAuth();
  const data = useData();
  const [accountOpen, setAccountOpen] = useState(false);
  const displayName = user?.displayName || 'Athlete';

  const rr = useMemo(
    () =>
      data.config && data.profile
        ? ryanReynoldsProgress(data.workouts, data.measurements, data.physique, data.profile, data.config)
        : null,
    [data.config, data.profile, data.workouts, data.measurements, data.physique],
  );

  const grouped = GROUP_ORDER.map((g) => ({
    group: g,
    items: NAV_ITEMS.filter((n) => n.group === g),
  }));

  return (
    <>
      {/* Mobile scrim */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden" onClick={onCloseMobile} />
      )}

      <aside
        className={`fixed z-40 flex h-full w-72 flex-col border-r border-hair bg-ink-900/95 backdrop-blur transition-transform lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="shrink-0" title={`My Progress ${rr ? Math.round(rr.total) : 0}%`}>
              <Ring value={rr?.total ?? 0} size={46} stroke={4}>
                <span className="text-[11px] font-bold tabular-nums text-fg">
                  {rr ? `${Math.round(rr.total)}%` : '—'}
                </span>
              </Ring>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight text-fg">{displayName}</p>
              <p className="text-xs leading-tight text-fg-faint">Physique Tracker</p>
            </div>
          </div>
          <button
            className="rounded-lg p-1.5 text-fg-faint hover:bg-ink-750 hover:text-fg lg:hidden"
            onClick={onCloseMobile}
            aria-label="Close menu"
          >
            <IconClose />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
          {grouped.map(({ group, items }) => (
            <div key={group}>
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-fg-faint">
                {group}
              </p>
              <div className="space-y-1">
                {items.map((item) => {
                  const isActive = item.id === active;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? 'bg-accent/10 text-fg ring-1 ring-accent/30'
                          : 'text-fg-muted hover:bg-ink-800 hover:text-fg'
                      }`}
                    >
                      <span className={isActive ? 'text-accent-soft' : 'text-fg-faint group-hover:text-fg-muted'}>
                        {item.icon}
                      </span>
                      {item.label}
                      {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-hair px-3 py-3">
          {/* Account actions — styled like nav items. */}
          <div className="space-y-1">
            <button
              onClick={() => setAccountOpen(true)}
              className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-fg-muted transition hover:bg-ink-800 hover:text-fg"
            >
              <span className="text-fg-faint group-hover:text-fg-muted">
                <IconSettings width={18} height={18} />
              </span>
              Account settings
            </button>
            <button
              onClick={logout}
              className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-fg-muted transition hover:bg-bad/10 hover:text-bad"
            >
              <span className="text-fg-faint group-hover:text-bad">
                <IconLogout width={18} height={18} />
              </span>
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <AccountModal open={accountOpen} onClose={() => setAccountOpen(false)} />
    </>
  );
}

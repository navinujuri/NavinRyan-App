import { NAV_ITEMS, type NavItem, type RouteId } from '../../navItems';
import { IconClose, IconFlame } from '../ui/icons';

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
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent-grad shadow-glow">
              <IconFlame className="text-white" width={22} height={22} />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight text-fg">Ryan Reynolds</p>
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

        <div className="border-t border-hair px-5 py-4">
          <p className="text-[11px] leading-relaxed text-fg-faint">
            Phase 1 · 16-Week Aesthetic Program
            <br />
            Local-first · Single user
          </p>
        </div>
      </aside>
    </>
  );
}

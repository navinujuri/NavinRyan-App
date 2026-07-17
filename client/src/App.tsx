import { useMemo } from 'react';
import { Layout } from './components/layout/Layout';
import { useHashRoute } from './lib/useHashRoute';
import { useData } from './state/DataContext';
import { programState, ryanReynoldsProgress } from './lib/calculations';
import { IconFlame, IconRefresh } from './components/ui/icons';
import { Pill } from './components/ui/primitives';

import { Dashboard } from './pages/Dashboard';
import { Workouts } from './pages/Workouts';
import { Progression } from './pages/Progression';
import { Muscles } from './pages/Muscles';
import { BodyMetrics } from './pages/BodyMetrics';
import { Photos } from './pages/Photos';
import { Physique } from './pages/Physique';
import { Analytics } from './pages/Analytics';
import { ExportReport } from './pages/ExportReport';
import type { RouteId } from './navItems';

function LoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center">
      <div className="flex flex-col items-center gap-4">
        <div className="grid h-14 w-14 animate-pulse place-items-center rounded-2xl bg-accent-grad shadow-glow">
          <IconFlame className="text-white" width={28} height={28} />
        </div>
        <p className="text-sm text-fg-muted">Loading your transformation…</p>
      </div>
    </div>
  );
}

function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="card max-w-md p-8 text-center">
        <h2 className="text-lg font-semibold text-fg">Couldn’t reach the API</h2>
        <p className="mt-2 text-sm text-fg-muted">{message}</p>
        <p className="mt-3 text-xs text-fg-faint">
          Make sure the backend is running (<code className="text-accent-soft">npm run dev</code> starts both
          server &amp; client).
        </p>
        <button className="btn-primary mt-5" onClick={onRetry}>
          <IconRefresh width={16} height={16} /> Retry
        </button>
      </div>
    </div>
  );
}

const PAGES: Record<RouteId, () => JSX.Element | null> = {
  dashboard: Dashboard,
  workouts: Workouts,
  progression: Progression,
  muscles: Muscles,
  metrics: BodyMetrics,
  photos: Photos,
  physique: Physique,
  analytics: Analytics,
  export: ExportReport,
};

export function App() {
  const [route, navigate] = useHashRoute();
  const data = useData();

  const header = useMemo(() => {
    if (!data.config || !data.profile) return null;
    const state = programState(data.profile, data.config.program);
    const rr = ryanReynoldsProgress(
      data.workouts,
      data.measurements,
      data.physique,
      data.profile,
      data.config,
    );
    return { state, rr };
  }, [data.config, data.profile, data.workouts, data.measurements, data.physique]);

  if (data.loading) return <LoadingScreen />;
  if (data.error) return <ErrorScreen message={data.error} onRetry={data.reload} />;

  const Page = PAGES[route];

  return (
    <Layout
      active={route}
      onNavigate={navigate}
      headerRight={
        header && (
          <div className="flex items-center gap-3">
            <Pill tone="default">
              Week {header.state.currentWeek}/{header.state.totalWeeks} · {header.state.phase}
            </Pill>
            <Pill tone="accent">
              <IconFlame width={13} height={13} />
              RR Progress {Math.round(header.rr.total)}%
            </Pill>
            <button
              onClick={data.resetDemo}
              title="Reset to demo data"
              className="rounded-lg border border-hair bg-ink-800 p-2 text-fg-faint transition hover:border-hair2 hover:text-fg"
            >
              <IconRefresh width={15} height={15} />
            </button>
          </div>
        )
      }
    >
      <Page />
    </Layout>
  );
}

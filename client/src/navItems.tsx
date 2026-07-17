import type { ReactNode } from 'react';
import {
  IconChart,
  IconCamera,
  IconDashboard,
  IconDumbbell,
  IconExport,
  IconMuscle,
  IconRadar,
  IconRuler,
  IconTrend,
} from './components/ui/icons';

export type RouteId =
  | 'dashboard'
  | 'workouts'
  | 'progression'
  | 'muscles'
  | 'metrics'
  | 'photos'
  | 'physique'
  | 'analytics'
  | 'export';

export interface NavItem {
  id: RouteId;
  label: string;
  icon: ReactNode;
  group: 'Overview' | 'Training' | 'Body' | 'Insights';
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <IconDashboard />, group: 'Overview' },
  { id: 'workouts', label: 'Workout Tracker', icon: <IconDumbbell />, group: 'Training' },
  { id: 'progression', label: 'Progression', icon: <IconTrend />, group: 'Training' },
  { id: 'muscles', label: 'Muscle Groups', icon: <IconMuscle />, group: 'Training' },
  { id: 'metrics', label: 'Body Metrics', icon: <IconRuler />, group: 'Body' },
  { id: 'photos', label: 'Photo Tracker', icon: <IconCamera />, group: 'Body' },
  { id: 'physique', label: 'Physique Score', icon: <IconRadar />, group: 'Body' },
  { id: 'analytics', label: 'Analytics', icon: <IconChart />, group: 'Insights' },
  { id: 'export', label: 'Export & Report', icon: <IconExport />, group: 'Insights' },
];

export const DEFAULT_ROUTE: RouteId = 'dashboard';

export function isRouteId(v: string): v is RouteId {
  return NAV_ITEMS.some((n) => n.id === v);
}

import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = (props: IconProps) => ({
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...props,
});

export const IconDashboard = (p: IconProps) => (
  <svg {...base(p)}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>
);
export const IconDumbbell = (p: IconProps) => (
  <svg {...base(p)}><path d="M6.5 6.5 17.5 17.5" /><path d="M3 8l1-1M8 3 7 4" /><path d="m2.5 7.5 3 3M6.5 3.5l3 3" /><path d="M21.5 16.5l-3-3M17.5 20.5l-3-3" /><path d="M16 21l1-1M21 16l-1 1" /></svg>
);
export const IconTrend = (p: IconProps) => (
  <svg {...base(p)}><path d="M3 17l6-6 4 4 8-8" /><path d="M14 7h7v7" /></svg>
);
export const IconMuscle = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 14c0-3 2-5 5-5 1.5 0 2 .5 3 .5s1.5-.5 3-.5c3 0 5 2 5 5 0 2-1.5 3-3 3-1 0-1.7-.6-2.5-1.2C16 15 14 14.5 12 14.5s-4 .5-4.5.8C6.7 15.9 6 16.5 5 16.5 3.5 16.5 2 15.5 2 14" /><path d="M12 9V5" /></svg>
);
export const IconRuler = (p: IconProps) => (
  <svg {...base(p)}><rect x="2" y="7" width="20" height="10" rx="2" /><path d="M6 7v3M10 7v4M14 7v3M18 7v4" /></svg>
);
export const IconCamera = (p: IconProps) => (
  <svg {...base(p)}><path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><circle cx="12" cy="12.5" r="3.5" /></svg>
);
export const IconRadar = (p: IconProps) => (
  <svg {...base(p)}><polygon points="12 2 21 8.5 17.5 20 6.5 20 3 8.5" /><polygon points="12 7 16.5 10 15 16 9 16 7.5 10" /><path d="M12 2v5M3 8.5 7.5 10M21 8.5 16.5 10M6.5 20 9 16M17.5 20 15 16" /></svg>
);
export const IconChart = (p: IconProps) => (
  <svg {...base(p)}><path d="M3 3v18h18" /><rect x="7" y="10" width="3" height="8" rx="1" /><rect x="12.5" y="6" width="3" height="12" rx="1" /><rect x="18" y="13" width="3" height="5" rx="1" /></svg>
);
export const IconExport = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 3v12" /><path d="m8 7 4-4 4 4" /><path d="M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" /></svg>
);
export const IconSparkle = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" /></svg>
);
export const IconPlus = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconTrash = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" /></svg>
);
export const IconEdit = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
);
export const IconClose = (p: IconProps) => (
  <svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const IconCopy = (p: IconProps) => (
  <svg {...base(p)}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
);
export const IconCheck = (p: IconProps) => (
  <svg {...base(p)}><path d="M20 6 9 17l-5-5" /></svg>
);
export const IconArrowUp = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 19V5M5 12l7-7 7 7" /></svg>
);
export const IconArrowDown = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 5v14M19 12l-7 7-7-7" /></svg>
);
export const IconFlame = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 3c1 3-1 4-1 6a2 2 0 0 0 4 0c0-.8-.3-1.5-.6-2C17 9 18 12 18 14a6 6 0 1 1-12 0c0-3 2-5 3-7 1 1 2 1 3-4z" /></svg>
);
export const IconTarget = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" /></svg>
);
export const IconCalendar = (p: IconProps) => (
  <svg {...base(p)}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></svg>
);
export const IconRefresh = (p: IconProps) => (
  <svg {...base(p)}><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></svg>
);
export const IconWeight = (p: IconProps) => (
  <svg {...base(p)}><path d="M6 8h12l2 12H4z" /><circle cx="12" cy="5" r="2.5" /></svg>
);
export const IconMenu = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 6h16M4 12h16M4 18h16" /></svg>
);
export const IconChevronDown = (p: IconProps) => (
  <svg {...base(p)}><path d="m6 9 6 6 6-6" /></svg>
);
export const IconLogout = (p: IconProps) => (
  <svg {...base(p)}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>
);

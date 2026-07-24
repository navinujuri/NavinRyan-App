import { useId } from 'react';

// Heroicons "fire" geometry, split into the outer body + inner core so each can
// flicker on its own timing. Rendered filled (not stroked) with warm gradients.
const FLAME_OUTER =
  'M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.176 7.547 7.547 0 01-1.705-1.715.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248z';
const FLAME_INNER =
  'M15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1.008a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.709z';

/**
 * Animated flame for the streak UI. When `lit` it burns (flickering layers,
 * pulsing glow, rising embers); when not, it renders a dim burnt-out flame as a
 * "relight me" nudge. Motion is disabled under prefers-reduced-motion (see CSS).
 */
export function Flame({
  size = 22,
  lit = true,
  embers = true,
  className = '',
}: {
  size?: number;
  lit?: boolean;
  embers?: boolean;
  className?: string;
}) {
  const uid = useId().replace(/:/g, '');

  if (!lit) {
    return (
      <span
        className={`flame ${className}`}
        style={{ width: size, height: size }}
        aria-hidden
      >
        <svg className="flame-svg" viewBox="0 0 24 24" width={size} height={size}>
          <path d={FLAME_OUTER} fill="#6b7079" opacity="0.5" />
          <path d={FLAME_INNER} fill="#6b7079" opacity="0.35" />
        </svg>
      </span>
    );
  }

  const outerId = `fo-${uid}`;
  const innerId = `fi-${uid}`;
  return (
    <span
      className={`flame ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span className="flame-glow" />
      <svg className="flame-svg" viewBox="0 0 24 24" width={size} height={size}>
        <defs>
          <linearGradient id={outerId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="55%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>
          <linearGradient id={innerId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="60%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#fde047" />
          </linearGradient>
        </defs>
        <path className="flame-outer" d={FLAME_OUTER} fill={`url(#${outerId})`} />
        <path className="flame-inner" d={FLAME_INNER} fill={`url(#${innerId})`} />
      </svg>
      {embers && (
        <>
          <span className="ember ember-1" />
          <span className="ember ember-2" />
          <span className="ember ember-3" />
        </>
      )}
    </span>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_ROUTE, isRouteId, type RouteId } from '../navItems';

function currentRoute(): RouteId {
  const raw = window.location.hash.replace(/^#\/?/, '');
  return isRouteId(raw) ? raw : DEFAULT_ROUTE;
}

/** Minimal dependency-free hash router (keeps URLs shareable + back button working). */
export function useHashRoute(): [RouteId, (id: RouteId) => void] {
  const [route, setRoute] = useState<RouteId>(currentRoute);

  useEffect(() => {
    const onChange = () => setRoute(currentRoute());
    window.addEventListener('hashchange', onChange);
    if (!window.location.hash) window.location.hash = `#/${DEFAULT_ROUTE}`;
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((id: RouteId) => {
    window.location.hash = `#/${id}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return [route, navigate];
}

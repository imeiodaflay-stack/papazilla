import { useLayoutEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

function resetEveryScrollPosition() {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  document.querySelectorAll<HTMLElement>('*').forEach((element) => {
    if (element.scrollTop !== 0) element.scrollTop = 0;
    if (element.scrollLeft !== 0) element.scrollLeft = 0;
  });
}

/** Toda entrada de rota começa no topo, inclusive dentro dos painéis roláveis do app. */
export function RouteScrollReset() {
  const location = useLocation();

  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    resetEveryScrollPosition();
    const frame = window.requestAnimationFrame(resetEveryScrollPosition);
    return () => window.cancelAnimationFrame(frame);
  }, [location.key]);

  return <Outlet />;
}

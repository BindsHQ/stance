'use client';
import * as React from 'react';
import { createPortal } from 'react-dom';
import { useIsomorphicLayoutEffect } from './use-isomorphic-layout-effect.js';

export interface PortalProps {
  children?: React.ReactNode;
  /** Element to portal into. Defaults to `document.body`. */
  container?: Element | null;
  /** Render inline instead of portalling. */
  disabled?: boolean;
}

const subscribe = () => () => {};
/** true on the client (synchronously for client renders), false on the server and during hydration. */
function useIsClient() {
  return React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

/**
 * Renders children into `document.body` (SSR-safe).
 * Carries the nearest scoped `data-theme` so portalled content matches its origin.
 */
export function Portal({ children, container, disabled }: PortalProps) {
  const mounted = useIsClient();
  const probeRef = React.useRef<HTMLSpanElement>(null);
  const [theme, setTheme] = React.useState<string | undefined>(undefined);
  useIsomorphicLayoutEffect(() => {
    const scoped = probeRef.current?.parentElement?.closest('[data-theme]');
    if (scoped && scoped !== document.documentElement)
      setTheme(scoped.getAttribute('data-theme') ?? undefined);
  }, []);
  if (disabled) return <>{children}</>;
  const probe = <span ref={probeRef} hidden data-stance-portal-probe="" />;
  if (!mounted || typeof document === 'undefined') return probe;
  return (
    <>
      {probe}
      {createPortal(
        <div data-theme={theme} className="st-portal-theme">
          {children}
        </div>,
        container ?? document.body,
      )}
    </>
  );
}

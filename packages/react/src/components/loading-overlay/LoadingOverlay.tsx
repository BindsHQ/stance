'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { Portal } from '../../internal/portal.js';
import { useComposedRefs } from '../../internal/refs.js';
import { Spinner } from '../spinner/Spinner.js';

export interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Show the overlay. */
  visible: boolean;
  /** Message under the spinner, also announced to screen readers. Default "Loading…". */
  message?: React.ReactNode;
  /** Cover the whole viewport instead of the wrapped content. */
  fullScreen?: boolean;
  /** `subtle` keeps content faintly visible; `solid` hides it. Default `subtle`. */
  backdrop?: 'subtle' | 'solid';
  /** Content to cover. While visible it is marked aria-busy and made inert. */
  children?: React.ReactNode;
}

/**
 * Blocks a region (or the whole screen) while work is in progress, keeping layout stable.
 * The covered content is aria-busy and inert so it cannot be focused or clicked.
 */
export const LoadingOverlay = React.forwardRef<HTMLDivElement, LoadingOverlayProps>(
  function LoadingOverlay(
    {
      visible,
      message = 'Loading…',
      fullScreen = false,
      backdrop = 'subtle',
      className,
      children,
      ...props
    },
    forwardedRef,
  ) {
    const contentRef = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
      // Set via DOM so it works on React 18 and 19 alike.
      contentRef.current?.toggleAttribute('inert', visible);
    }, [visible]);

    const overlay = visible ? (
      <div
        className="st-loading-overlay__layer"
        data-backdrop={backdrop}
        data-full-screen={fullScreen ? '' : undefined}
      >
        <div className="st-loading-overlay__panel" role="status" aria-live="polite">
          <Spinner size="lg" label={null} />
          {message != null && <span className="st-loading-overlay__message">{message}</span>}
        </div>
      </div>
    ) : null;

    const ref = useComposedRefs(forwardedRef);
    if (fullScreen && children == null) {
      return overlay ? <Portal>{overlay}</Portal> : null;
    }
    return (
      <div
        ref={ref}
        className={cx('st-loading-overlay', className)}
        aria-busy={visible || undefined}
        {...props}
      >
        <div ref={contentRef} className="st-loading-overlay__content">
          {children}
        </div>
        {fullScreen ? overlay && <Portal>{overlay}</Portal> : overlay}
      </div>
    );
  },
);

'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';

export interface ErrorBoundaryFallbackProps {
  error: Error;
  /** Clears the error and re-renders the children. */
  reset: () => void;
}

export interface ErrorBoundaryProps {
  children?: React.ReactNode;
  /** Rendered instead of the children after an error. A node, or a function receiving `{ error, reset }`. */
  fallback?: React.ReactNode | ((props: ErrorBoundaryFallbackProps) => React.ReactNode);
  /** Called with the error and React's component stack. Report to your error tracker here. */
  onError?: (error: Error, info: React.ErrorInfo) => void;
  /** Called after `reset` (from the fallback or a `resetKeys` change). */
  onReset?: () => void;
  /** When any value changes, a caught error is cleared automatically (e.g. the route or record id). */
  resetKeys?: readonly unknown[];
  /** Title for the default fallback. */
  title?: string;
  /** Description for the default fallback. */
  description?: string;
  /** Label for the default retry button. */
  retryLabel?: string;
}

interface State {
  error: Error | null;
}

const changed = (a: readonly unknown[] = [], b: readonly unknown[] = []) =>
  a.length !== b.length || a.some((v, i) => !Object.is(v, b[i]));

/**
 * Catches rendering errors in its subtree and shows a recoverable fallback,
 * so one failing widget doesn't take down the whole screen.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.props.onError?.(error, info);
  }

  override componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.state.error && changed(prevProps.resetKeys, this.props.resetKeys)) this.reset();
  }

  reset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  override render(): React.ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    const { fallback } = this.props;
    if (typeof fallback === 'function') return fallback({ error, reset: this.reset });
    if (fallback !== undefined) return fallback;
    return (
      <ErrorFallback
        error={error}
        reset={this.reset}
        title={this.props.title}
        description={this.props.description}
        retryLabel={this.props.retryLabel}
      />
    );
  }
}

export interface ErrorFallbackProps extends ErrorBoundaryFallbackProps {
  title?: string | undefined;
  description?: string | undefined;
  retryLabel?: string | undefined;
  className?: string;
}

/** The default fallback: an assertive alert with a retry action. */
export function ErrorFallback({
  error,
  reset,
  title = 'Something went wrong',
  description = 'This section couldn’t be displayed. Try again, or reload the page if the problem continues.',
  retryLabel = 'Try again',
  className,
}: ErrorFallbackProps) {
  return (
    <div role="alert" className={cx('st-error-boundary', className)}>
      <svg
        className="st-error-boundary__icon"
        viewBox="0 0 24 24"
        width="20"
        height="20"
        aria-hidden="true"
        focusable="false"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10.3 4.2L2.8 17.5A2 2 0 0 0 4.5 20.5h15a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z" />
        <path d="M12 9.5v4M12 17h.01" />
      </svg>
      <div className="st-error-boundary__body">
        <p className="st-error-boundary__title">{title}</p>
        <p className="st-error-boundary__description">{description}</p>
        {error.message && (
          <details className="st-error-boundary__details">
            <summary>Technical details</summary>
            <code>{error.message}</code>
          </details>
        )}
        <button
          type="button"
          className="st-button st-error-boundary__retry"
          data-variant="outline"
          data-size="sm"
          onClick={reset}
        >
          {retryLabel}
        </button>
      </div>
    </div>
  );
}

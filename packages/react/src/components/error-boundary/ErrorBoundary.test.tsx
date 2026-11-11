import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { ErrorBoundary } from './ErrorBoundary';

let shouldThrow = true;
function Flaky({ label = 'Signature preview' }: { label?: string }) {
  if (shouldThrow) throw new Error('Template HTML failed to parse');
  return <p>{label}</p>;
}

describe('ErrorBoundary', () => {
  let spy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    shouldThrow = true;
    spy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => spy.mockRestore());

  it('renders children when nothing throws', () => {
    shouldThrow = false;
    render(
      <ErrorBoundary>
        <Flaky />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Signature preview')).toBeInTheDocument();
  });

  it('shows the default accessible fallback and recovers on retry', async () => {
    const onError = vi.fn();
    const onReset = vi.fn();
    render(
      <ErrorBoundary onError={onError} onReset={onReset}>
        <Flaky />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByText('Template HTML failed to parse')).toBeInTheDocument();
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) }),
    );
    shouldThrow = false;
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByText('Signature preview')).toBeInTheDocument();
    expect(onReset).toHaveBeenCalled();
  });

  it('supports node and render-function fallbacks', async () => {
    const { unmount } = render(
      <ErrorBoundary fallback={<p>Preview unavailable</p>}>
        <Flaky />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Preview unavailable')).toBeInTheDocument();
    unmount();
    render(
      <ErrorBoundary
        fallback={({ error, reset }) => (
          <button type="button" onClick={reset}>
            Retry: {error.message}
          </button>
        )}
      >
        <Flaky />
      </ErrorBoundary>,
    );
    shouldThrow = false;
    await userEvent.click(screen.getByRole('button', { name: /Retry: Template HTML/ }));
    expect(screen.getByText('Signature preview')).toBeInTheDocument();
  });

  it('resets when resetKeys change', () => {
    const { rerender } = render(
      <ErrorBoundary resetKeys={['tpl-1']}>
        <Flaky />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    shouldThrow = false;
    rerender(
      <ErrorBoundary resetKeys={['tpl-2']}>
        <Flaky label="Second template" />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Second template')).toBeInTheDocument();
  });

  it.each(THEMES)('fallback has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <ErrorBoundary>
          <Flaky />
        </ErrorBoundary>
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

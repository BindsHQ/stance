import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { LoadingOverlay } from './LoadingOverlay';

describe('LoadingOverlay', () => {
  it('marks the region busy, makes content inert and announces the message', () => {
    const { container, rerender } = render(
      <LoadingOverlay visible message="Deploying signatures…">
        <button type="button">Deploy</button>
      </LoadingOverlay>,
    );
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute('aria-busy', 'true');
    expect(root.querySelector('.st-loading-overlay__content')).toHaveAttribute('inert');
    expect(screen.getByRole('status')).toHaveTextContent('Deploying signatures…');
    rerender(
      <LoadingOverlay visible={false} message="Deploying signatures…">
        <button type="button">Deploy</button>
      </LoadingOverlay>,
    );
    expect(root).not.toHaveAttribute('aria-busy');
    expect(root.querySelector('.st-loading-overlay__content')).not.toHaveAttribute('inert');
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('renders a full-screen overlay in a portal', () => {
    render(<LoadingOverlay visible fullScreen message="Signing you in…" />);
    const layer = document.body.querySelector('.st-loading-overlay__layer');
    expect(layer).toHaveAttribute('data-full-screen');
    expect(screen.getByRole('status')).toHaveTextContent('Signing you in…');
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <LoadingOverlay visible>
        <p>Report</p>
      </LoadingOverlay>,
    );
    await expectNoA11yViolations(container);
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { Progress } from './Progress';

describe('Progress', () => {
  it('exposes value, range and text', () => {
    render(<Progress label="Deploying signatures" value={30} max={120} showValue />);
    const bar = screen.getByRole('progressbar', { name: 'Deploying signatures' });
    expect(bar).toHaveAttribute('aria-valuenow', '30');
    expect(bar).toHaveAttribute('aria-valuemax', '120');
    expect(bar).toHaveAttribute('aria-valuetext', '25%');
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('supports custom value text', () => {
    render(
      <Progress
        label="Users synced"
        value={12}
        max={48}
        formatValue={(v, m) => `${v} of ${m} users`}
      />,
    );
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '12 of 48 users');
  });

  it('is indeterminate without a value and clamps out-of-range values', () => {
    const { rerender } = render(<Progress aria-label="Loading" />);
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
    expect(screen.getByRole('progressbar')).toHaveAttribute('data-state', 'indeterminate');
    rerender(<Progress aria-label="Loading" value={140} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByRole('progressbar')).toHaveAttribute('data-state', 'complete');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <Progress label="Upload" value={64} showValue tone="success" />
        <Progress aria-label="Syncing" />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

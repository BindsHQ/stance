import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { ProgressCircle } from './ProgressCircle';

describe('ProgressCircle', () => {
  it('exposes determinate progress with value text', () => {
    render(<ProgressCircle aria-label="Profile completeness" value={3} max={4} showValue />);
    const bar = screen.getByRole('progressbar', { name: 'Profile completeness' });
    expect(bar).toHaveAttribute('aria-valuenow', '3');
    expect(bar).toHaveAttribute('aria-valuetext', '75%');
    expect(screen.getByText('75%')).toHaveAttribute('aria-hidden', 'true');
  });

  it('is indeterminate without a value', () => {
    render(<ProgressCircle aria-label="Connecting to Exchange" size="sm" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('data-state', 'indeterminate');
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
  });

  it('renders custom centre content', () => {
    render(
      <ProgressCircle aria-label="Seats" value={42} max={50} size={96}>
        42/50
      </ProgressCircle>,
    );
    expect(screen.getByText('42/50')).toBeInTheDocument();
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <ProgressCircle aria-label="Sync" value={60} showValue size="lg" />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

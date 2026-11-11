import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { StatCard } from './StatCard';

describe('StatCard', () => {
  it('announces the delta direction in words', () => {
    render(
      <StatCard
        label="Active signatures"
        value="1,284"
        delta="12%"
        trend="up"
        comparison="from last month"
      />,
    );
    expect(screen.getByText('up 12% from last month')).toHaveClass('st-sr-only');
    expect(screen.getByText('1,284')).toBeInTheDocument();
  });

  it('marks sentiment, honouring invert for metrics where down is good', () => {
    const { container } = render(
      <StatCard
        label="Failed deployments"
        value="3"
        delta="40%"
        trend="down"
        invert
        comparison="from last week"
      />,
    );
    expect(container.querySelector('.st-stat-card__delta')).toHaveAttribute(
      'data-sentiment',
      'positive',
    );
    expect(screen.getByText('down 40% from last week')).toBeInTheDocument();
  });

  it('describes neutral trends as unchanged and shows a loading state', () => {
    const { rerender } = render(<StatCard label="Seats" value="50" delta="0%" />);
    expect(screen.getByText('unchanged')).toBeInTheDocument();
    rerender(<StatCard label="Seats" value="50" loading />);
    expect(screen.queryByText('50')).toBeNull();
    expect(screen.getByText('Seats').closest('.st-stat-card')).toHaveAttribute('aria-busy', 'true');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <StatCard label="Templates" value="24" delta="3" trend="up" comparison="this quarter" />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

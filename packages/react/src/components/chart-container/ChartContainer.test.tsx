import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { BarChart, ChartContainer, Sparkline, summariseTrend } from './ChartContainer';

const data = [
  { month: 'Jul', deployed: 120, pending: 30 },
  { month: 'Aug', deployed: 180, pending: 22 },
  { month: 'Sep', deployed: 260, pending: 14 },
];
const series = [
  { key: 'deployed', label: 'Deployed' },
  { key: 'pending', label: 'Pending' },
];

describe('ChartContainer', () => {
  it('names the figure, renders legend and passes size to render props', () => {
    render(
      <ChartContainer
        title="Signature deployments"
        description="Mailboxes updated per month"
        series={series}
        data={data}
        categoryKey="month"
        height={200}
      >
        {({ width, height, colors }) => (
          <span data-testid="size">{`${width}x${height} ${colors.join(',')}`}</span>
        )}
      </ChartContainer>,
    );
    const fig = screen.getByRole('figure', { name: 'Signature deployments' });
    expect(fig).toHaveAccessibleDescription('Mailboxes updated per month');
    expect(screen.getByTestId('size')).toHaveTextContent(
      '600x200 var(--st-color-chart-1),var(--st-color-chart-2)',
    );
    expect(screen.getByRole('list', { name: 'Legend' })).toHaveTextContent('DeployedPending');
  });

  it('toggles an accessible data table', async () => {
    render(
      <ChartContainer
        title="Signature deployments"
        series={series}
        data={data}
        categoryKey="month"
        categoryLabel="Month"
      >
        <div />
      </ChartContainer>,
    );
    const toggle = screen.getByRole('button', { name: 'View as table' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(toggle);
    const table = screen.getByRole('table', { name: 'Signature deployments' });
    expect(table).toHaveTextContent('Month');
    expect(screen.getByRole('cell', { name: '260' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View as chart' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});

describe('BarChart', () => {
  it('renders an SVG image with a generated summary and a table alternative', () => {
    render(<BarChart title="Deployments" data={data} categoryKey="month" series={series} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAccessibleName(
      'Bar chart with 3 categories and 2 series. Highest: Deployed in Sep, 260.',
    );
    expect(img.querySelectorAll('rect')).toHaveLength(6);
    expect(screen.getByRole('button', { name: 'View as table' })).toBeInTheDocument();
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <BarChart
          title="Deployments"
          description="Last quarter"
          data={data}
          categoryKey="month"
          series={series}
        />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

describe('Sparkline', () => {
  it('summarises the trend', () => {
    expect(summariseTrend([10, 12, 15])).toBe('Trend: from 10 to 15, up 50%');
    expect(summariseTrend([20, 10])).toBe('Trend: from 20 to 10, down 50%');
    expect(summariseTrend([5, 5])).toBe('Trend: flat at 5');
    expect(summariseTrend([])).toBe('No data');
  });

  it('renders role img with label, or hides when label is null', () => {
    const { rerender } = render(<Sparkline data={[3, 8, 6, 12]} />);
    expect(screen.getByRole('img')).toHaveAccessibleName('Trend: from 3 to 12, up 300%');
    rerender(<Sparkline data={[3, 8]} label={null} data-testid="spark" />);
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByTestId('spark')).toHaveAttribute('aria-hidden', 'true');
  });
});

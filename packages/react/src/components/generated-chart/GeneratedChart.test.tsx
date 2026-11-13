import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { GeneratedChart } from './GeneratedChart';

const categories = ['Jan', 'Feb', 'Mar', 'Apr'];
const series = [
  { id: 'signed', label: 'Signed', values: [12, 18, null, 31] },
  { id: 'sent', label: 'Sent', values: [20, 22, 30, 40] },
];
const takeaway = 'Signed agreements more than doubled from January to April.';

describe('GeneratedChart', () => {
  it('renders a figure named by its title, with the takeaway as the text alternative', () => {
    render(
      <GeneratedChart
        title="Agreements"
        takeaway={takeaway}
        series={series}
        categories={categories}
      />,
    );
    const figure = screen.getByRole('figure', { name: 'Agreements' });
    expect(figure).toHaveAccessibleDescription(takeaway);
    expect(screen.getByRole('heading', { level: 3, name: 'Agreements' })).toBeInTheDocument();
    expect(screen.getByText(takeaway)).toBeVisible();
    expect(screen.getByRole('img', { name: takeaway })).toBeInTheDocument();
    expect(
      within(screen.getByRole('list', { name: 'Legend' })).getAllByRole('listitem'),
    ).toHaveLength(2);
  });

  it('falls back to a generated summary without a takeaway', () => {
    render(
      <GeneratedChart title="Agreements" kind="line" series={series} categories={categories} />,
    );
    expect(
      screen.getByRole('img', { name: 'Line chart with 4 categories and 2 series.' }),
    ).toBeInTheDocument();
  });

  it.each([
    ['bar', '.st-chart__bar', 7],
    ['line', '.st-generated-chart__line', 3],
    ['area', '.st-generated-chart__area', 2],
  ] as const)('draws a %s chart and skips gaps', (kind, selector, count) => {
    const { container } = render(
      <GeneratedChart title="Agreements" kind={kind} series={series} categories={categories} />,
    );
    expect(container.querySelector('figure')).toHaveAttribute('data-kind', kind);
    expect(container.querySelectorAll(selector)).toHaveLength(count);
  });

  it('gives each line its own dash pattern, so series do not rely on colour', () => {
    const { container } = render(
      <GeneratedChart title="Agreements" kind="line" series={series} categories={categories} />,
    );
    const lines = [...container.querySelectorAll('.st-generated-chart__line')];
    const patterns = new Set(lines.map((l) => l.getAttribute('stroke-dasharray') ?? ''));
    expect(patterns.size).toBe(2);
  });

  it('switches to the data table and back', async () => {
    const user = userEvent.setup();
    render(
      <GeneratedChart
        title="Agreements"
        takeaway={takeaway}
        series={series}
        categories={categories}
      />,
    );
    const toggle = screen.getByRole('button', { name: 'View as table' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await user.click(toggle);
    const table = screen.getByRole('table');
    expect(within(table).getByRole('columnheader', { name: 'Category' })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: 'Signed' })).toBeInTheDocument();
    expect(within(table).getAllByRole('row')).toHaveLength(5);
    expect(within(table).getByRole('cell', { name: 'None' })).toBeInTheDocument();
    expect(screen.queryByRole('img')).toBeNull();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('img', { name: takeaway })).toBeInTheDocument();
  });

  it('supports a controlled view', async () => {
    const onViewChange = vi.fn();
    const { rerender } = render(
      <GeneratedChart
        title="Agreements"
        series={series}
        categories={categories}
        view="chart"
        onViewChange={onViewChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'View as table' }));
    expect(onViewChange).toHaveBeenCalledWith('table');
    expect(screen.queryByRole('table')).toBeNull();
    rerender(
      <GeneratedChart
        title="Agreements"
        series={series}
        categories={categories}
        view="table"
        onViewChange={onViewChange}
      />,
    );
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View as chart' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('starts in the table with defaultView and shows the source note in both views', () => {
    render(
      <GeneratedChart
        title="Agreements"
        series={series}
        categories={categories}
        defaultView="table"
        source="Signing log, 1 January to 30 April"
      />,
    );
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Source')).toBeVisible();
    expect(screen.getByText(/Signing log/)).toBeVisible();
  });

  it('handles negative values and empty data without errors', () => {
    const { container, rerender } = render(
      <GeneratedChart
        title="Change"
        series={[{ id: 'd', label: 'Change', values: [-4, 6] }]}
        categories={['A', 'B']}
      />,
    );
    expect(container.querySelectorAll('.st-chart__bar')).toHaveLength(2);
    expect(() =>
      rerender(<GeneratedChart title="Empty" kind="line" series={[]} categories={[]} />),
    ).not.toThrow();
  });

  it('formats values and translates the built in strings', async () => {
    render(
      <GeneratedChart
        title="Avtal"
        series={series}
        categories={categories}
        formatValue={(v) => `${v} st`}
        labels={{ viewAsTable: 'Visa som tabell', category: 'Månad', noValue: 'Saknas' }}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Visa som tabell' }));
    expect(screen.getByRole('columnheader', { name: 'Månad' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '12 st' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Saknas' })).toBeInTheDocument();
  });

  it('forwards the ref, className, heading level and props', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <GeneratedChart
        ref={ref}
        className="mine"
        id="chart"
        title="Agreements"
        headingLevel={4}
        series={series}
        categories={categories}
      />,
    );
    expect(ref.current?.tagName).toBe('FIGURE');
    expect(ref.current).toHaveClass('st-chart', 'st-generated-chart', 'mine');
    expect(ref.current).toHaveAttribute('id', 'chart');
    expect(screen.getByRole('heading', { level: 4, name: 'Agreements' })).toBeInTheDocument();
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <GeneratedChart
          title="Agreements"
          takeaway={takeaway}
          kind="area"
          series={series}
          categories={categories}
          source="Signing log"
        />
        <GeneratedChart
          title="Agreements as a table"
          series={series}
          categories={categories}
          defaultView="table"
        />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

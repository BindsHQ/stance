import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { GeneratedTable, generatedTableToCsv, type GeneratedTableSort } from './GeneratedTable';

const announcer = (container: HTMLElement) => container.querySelector('[data-st-announcer]')!;
const columns = [
  { id: 'region', header: 'Region' },
  { id: 'revenue', header: 'Revenue', numeric: true },
  { id: 'note', header: 'Note' },
];
const rows = [
  { region: 'North', revenue: 1200, note: 'On plan' },
  { region: 'South', revenue: 900, note: null },
  { region: 'East', revenue: 10400, note: 'Ahead, "strong"' },
];
const firstColumn = () =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[0]!.textContent);

describe('GeneratedTable', () => {
  it('renders a real table with a caption, headers and a row count', () => {
    render(<GeneratedTable columns={columns} rows={rows} caption="Revenue by region" />);
    const table = screen.getByRole('table', { name: 'Revenue by region' });
    expect(within(table).getAllByRole('columnheader')).toHaveLength(3);
    expect(within(table).getAllByRole('row')).toHaveLength(4);
    expect(screen.getByText('3 rows')).toBeVisible();
    expect(screen.getByRole('cell', { name: '10400' })).toHaveAttribute('data-align', 'end');
  });

  it('sorts by a column: ascending, descending, then the original order', async () => {
    const user = userEvent.setup();
    render(<GeneratedTable columns={columns} rows={rows} caption="Revenue" />);
    const header = screen.getByRole('columnheader', { name: 'Revenue' });
    expect(header).toHaveAttribute('aria-sort', 'none');
    await user.click(within(header).getByRole('button'));
    expect(header).toHaveAttribute('aria-sort', 'ascending');
    expect(firstColumn()).toEqual(['South', 'North', 'East']);
    await user.click(within(header).getByRole('button'));
    expect(header).toHaveAttribute('aria-sort', 'descending');
    expect(firstColumn()).toEqual(['East', 'North', 'South']);
    await user.click(within(header).getByRole('button'));
    expect(header).toHaveAttribute('aria-sort', 'none');
    expect(firstColumn()).toEqual(['North', 'South', 'East']);
  });

  it('sorts text by locale and keeps empty cells last', async () => {
    const user = userEvent.setup();
    render(<GeneratedTable columns={columns} rows={rows} caption="Revenue" />);
    const note = screen.getByRole('columnheader', { name: 'Note' });
    await user.click(within(note).getByRole('button'));
    expect(firstColumn()).toEqual(['East', 'North', 'South']);
    await user.keyboard('{Enter}');
    expect(firstColumn()).toEqual(['North', 'East', 'South']);
  });

  it('supports a controlled sort', async () => {
    const onSortChange = vi.fn();
    const sort: GeneratedTableSort = { columnId: 'region', direction: 'ascending' };
    render(
      <GeneratedTable
        columns={columns}
        rows={rows}
        caption="Revenue"
        sort={sort}
        onSortChange={onSortChange}
      />,
    );
    expect(firstColumn()).toEqual(['East', 'North', 'South']);
    await userEvent.click(
      within(screen.getByRole('columnheader', { name: 'Region' })).getByRole('button'),
    );
    expect(onSortChange).toHaveBeenCalledWith({ columnId: 'region', direction: 'descending' });
    expect(firstColumn()).toEqual(['East', 'North', 'South']);
  });

  it('can turn sorting off', () => {
    render(<GeneratedTable columns={columns} rows={rows} caption="Revenue" sortable={false} />);
    expect(screen.getByRole('columnheader', { name: 'Region' })).not.toHaveAttribute('aria-sort');
  });

  it('folds long tables behind maxRows', async () => {
    render(<GeneratedTable columns={columns} rows={rows} caption="Revenue" maxRows={2} />);
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.getByText('Showing 2 of 3 rows')).toBeVisible();
    const toggle = screen.getByRole('button', { name: 'Show all 3 rows' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    expect(screen.getAllByRole('row')).toHaveLength(4);
    expect(screen.getByRole('button', { name: 'Show fewer' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('copies the table as CSV and confirms it', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const onCopy = vi.fn();
    const { container } = render(
      <GeneratedTable columns={columns} rows={rows} caption="Revenue" onCopy={onCopy} />,
    );
    await user.click(screen.getByRole('button', { name: 'Copy as CSV' }));
    const csv =
      'Region,Revenue,Note\r\nNorth,1200,On plan\r\nSouth,900,\r\nEast,10400,"Ahead, ""strong"""';
    await waitFor(() => expect(onCopy).toHaveBeenCalledWith(csv, true));
    expect(writeText).toHaveBeenCalledWith(csv);
    expect(announcer(container)).toHaveTextContent('Copied');
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
  });

  it('guards CSV cells that a spreadsheet would run as formulas', () => {
    const csv = generatedTableToCsv(
      [{ id: 'a', header: 'A' }],
      [{ a: '=SUM(A1)' }, { a: '-2%' }, { a: -5 }, { a: '@cmd' }, { a: '-cmd' }, { a: true }],
    );
    expect(csv.split('\r\n')).toEqual(['A', "'=SUM(A1)", '-2%', '-5', "'@cmd", "'-cmd", 'true']);
  });

  it('shows export and expand only with handlers', async () => {
    const onExport = vi.fn();
    const onExpand = vi.fn();
    const { rerender } = render(
      <GeneratedTable columns={columns} rows={rows} caption="Revenue" copyable={false} />,
    );
    expect(screen.queryByRole('button', { name: 'Export' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Expand' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Copy as CSV' })).toBeNull();
    rerender(
      <GeneratedTable
        columns={columns}
        rows={rows}
        caption="Revenue"
        onExport={onExport}
        onExpand={onExpand}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Export' }));
    expect(onExport.mock.calls[0]![0]).toContain('North,1200,On plan');
    await userEvent.click(screen.getByRole('button', { name: 'Expand' }));
    expect(onExpand).toHaveBeenCalledTimes(1);
  });

  it('stays quiet while streaming and announces once when complete', () => {
    const { container, rerender } = render(
      <GeneratedTable columns={columns} rows={rows.slice(0, 1)} caption="Revenue" streaming />,
    );
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Adding rows')).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'Region' })).not.toHaveAttribute('aria-sort');
    expect(screen.getByRole('button', { name: 'Copy as CSV' })).toBeDisabled();
    rerender(<GeneratedTable columns={columns} rows={rows} caption="Revenue" streaming />);
    expect(announcer(container)).toBeEmptyDOMElement();
    expect(container.querySelector('[aria-live]:not([data-st-announcer])')).toBeNull();
    rerender(<GeneratedTable columns={columns} rows={rows} caption="Revenue" />);
    expect(announcer(container)).toHaveTextContent('Table complete, 3 rows');
    expect(screen.getByRole('table')).not.toHaveAttribute('aria-busy');
  });

  it('formats values and translates the built in strings', () => {
    render(
      <GeneratedTable
        columns={columns}
        rows={rows.slice(0, 1)}
        caption="Intäkter"
        formatValue={(value, column) => (column.numeric ? `${value} kr` : String(value ?? ''))}
        labels={{ rows: (n) => `${n} rad`, copy: 'Kopiera som CSV' }}
      />,
    );
    expect(screen.getByRole('cell', { name: '1200 kr' })).toBeInTheDocument();
    expect(screen.getByText('1 rad')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Kopiera som CSV' })).toBeInTheDocument();
  });

  it('forwards the ref, className and props', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <GeneratedTable
        ref={ref}
        className="mine"
        id="data"
        columns={columns}
        rows={rows}
        caption="Revenue"
      />,
    );
    expect(ref.current).toHaveClass('st-generated-table', 'mine');
    expect(ref.current).toHaveAttribute('id', 'data');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <GeneratedTable
          columns={columns}
          rows={rows}
          caption="Revenue by region"
          maxRows={2}
          onExport={() => {}}
          onExpand={() => {}}
        />
        <GeneratedTable columns={columns} rows={rows} caption="Arriving" streaming />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

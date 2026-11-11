import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { compareValues, DataTable, type DataTableColumn, type DataTableSort } from './DataTable';

interface User {
  id: string;
  name: string;
  team: string;
  signatures: number;
  locked?: boolean;
}

const users: User[] = [
  { id: 'u1', name: 'Priya Nair', team: 'Sales', signatures: 12 },
  { id: 'u2', name: 'Amara Okafor', team: 'Legal', signatures: 4 },
  { id: 'u3', name: 'Lukas Brenner', team: 'Sales', signatures: 30, locked: true },
  { id: 'u4', name: 'Hana Sato', team: 'Finance', signatures: 8 },
  { id: 'u5', name: 'Tomás Ruiz', team: 'Operations', signatures: 2 },
];

const columns: DataTableColumn<User>[] = [
  { id: 'name', header: 'Name', accessor: 'name', sortable: true, rowHeader: true },
  { id: 'team', header: 'Team', accessor: 'team', sortable: true },
  { id: 'signatures', header: 'Signatures', accessor: 'signatures', sortable: true, align: 'end' },
];

const names = () => screen.getAllByRole('rowheader').map((c) => c.textContent);

describe('compareValues', () => {
  it('orders numbers, strings (numeric-aware), dates and nulls last', () => {
    expect(compareValues(2, 10)).toBeLessThan(0);
    expect(compareValues('file 2', 'file 10')).toBeLessThan(0);
    expect(compareValues(new Date(2024, 1, 1), new Date(2023, 1, 1))).toBeGreaterThan(0);
    expect(compareValues(null, 'a')).toBeGreaterThan(0);
    expect(compareValues('a', undefined)).toBeLessThan(0);
  });
});

describe('DataTable', () => {
  it('renders a captioned table with row headers', () => {
    render(
      <DataTable
        caption="Organisation users"
        columns={columns}
        data={users}
        getRowId={(u) => u.id}
      />,
    );
    expect(screen.getByRole('table', { name: 'Organisation users' })).toBeInTheDocument();
    expect(names()).toEqual([
      'Priya Nair',
      'Amara Okafor',
      'Lukas Brenner',
      'Hana Sato',
      'Tomás Ruiz',
    ]);
    expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute('aria-sort', 'none');
  });

  it('cycles sorting ascending → descending → none and announces it', async () => {
    const onSortChange = vi.fn();
    render(
      <DataTable
        caption="Users"
        columns={columns}
        data={users}
        getRowId={(u) => u.id}
        onSortChange={onSortChange}
      />,
    );
    const user = userEvent.setup();
    const sortButton = within(screen.getByRole('columnheader', { name: /Signatures/ })).getByRole(
      'button',
    );
    await user.click(sortButton);
    expect(screen.getByRole('columnheader', { name: /Signatures/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
    expect(names()).toEqual([
      'Tomás Ruiz',
      'Amara Okafor',
      'Hana Sato',
      'Priya Nair',
      'Lukas Brenner',
    ]);
    expect(screen.getByRole('status')).toHaveTextContent('Sorted by Signatures, ascending');
    await user.click(sortButton);
    expect(names()[0]).toBe('Lukas Brenner');
    await user.click(sortButton);
    expect(onSortChange).toHaveBeenLastCalledWith(null);
    expect(names()[0]).toBe('Priya Nair');
    // Keyboard activation works through the native button.
    within(screen.getByRole('columnheader', { name: /Name/ }))
      .getByRole('button')
      .focus();
    await user.keyboard('{Enter}');
    expect(names()[0]).toBe('Amara Okafor');
  });

  it('supports controlled sort', () => {
    function Controlled() {
      const [sort, setSort] = React.useState<DataTableSort | null>({
        columnId: 'team',
        direction: 'descending',
      });
      return (
        <DataTable
          caption="Users"
          columns={columns}
          data={users}
          getRowId={(u) => u.id}
          sort={sort}
          onSortChange={setSort}
        />
      );
    }
    render(<Controlled />);
    expect(screen.getByRole('columnheader', { name: /Team/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
    expect(names()).toEqual([
      'Priya Nair',
      'Lukas Brenner',
      'Tomás Ruiz',
      'Amara Okafor',
      'Hana Sato',
    ]);
  });

  it('selects rows with an indeterminate select-all and skips unselectable rows', async () => {
    const onSelectionChange = vi.fn();
    render(
      <DataTable
        caption="Users"
        columns={columns}
        data={users}
        getRowId={(u) => u.id}
        selectable
        getRowLabel={(u) => u.name}
        isRowSelectable={(u) => !u.locked}
        onSelectionChange={onSelectionChange}
      />,
    );
    const user = userEvent.setup();
    const all = screen.getByRole('checkbox', { name: 'Select all rows' });
    expect(screen.getByRole('checkbox', { name: 'Select Lukas Brenner' })).toBeDisabled();
    await user.click(screen.getByRole('checkbox', { name: 'Select Priya Nair' }));
    expect(onSelectionChange).toHaveBeenLastCalledWith(['u1']);
    expect((all as HTMLInputElement).indeterminate).toBe(true);
    expect(screen.getByRole('status')).toHaveTextContent('1 row selected');
    await user.click(all);
    expect(onSelectionChange).toHaveBeenLastCalledWith(
      expect.arrayContaining(['u1', 'u2', 'u4', 'u5']),
    );
    expect(onSelectionChange.mock.lastCall![0]).not.toContain('u3');
    expect(all).toBeChecked();
    await user.click(all);
    expect(onSelectionChange).toHaveBeenLastCalledWith([]);
  });

  it('paginates with Pagination and announces page changes', async () => {
    const onPageChange = vi.fn();
    render(
      <DataTable
        caption="Users"
        columns={columns}
        data={users}
        getRowId={(u) => u.id}
        pageSize={2}
        onPageChange={onPageChange}
      />,
    );
    expect(names()).toEqual(['Priya Nair', 'Amara Okafor']);
    expect(screen.getByText('1–2 of 5')).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onPageChange).toHaveBeenLastCalledWith(2);
    expect(names()).toEqual(['Lukas Brenner', 'Hana Sato']);
    expect(screen.getByRole('status')).toHaveTextContent('Page 2 of 3');
    expect(screen.getByRole('table')).toHaveAttribute('aria-rowcount', '6');
    expect(screen.getAllByRole('row')[1]).toHaveAttribute('aria-rowindex', '4');
  });

  it('shows loading skeletons and an empty state', () => {
    const { rerender } = render(
      <DataTable caption="Users" columns={columns} data={users} loading loadingRows={3} />,
    );
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryAllByRole('rowheader')).toHaveLength(0);
    rerender(
      <DataTable
        caption="Users"
        columns={columns}
        data={[]}
        emptyState="No organisation users yet"
      />,
    );
    expect(screen.getByRole('cell', { name: 'No organisation users yet' })).toHaveAttribute(
      'colspan',
      '3',
    );
  });

  it('renders custom cells', () => {
    render(
      <DataTable
        caption="Users"
        columns={[
          ...columns,
          {
            id: 'action',
            header: 'Actions',
            cell: (u) => <button type="button">Edit {u.name}</button>,
          },
        ]}
        data={users.slice(0, 1)}
      />,
    );
    expect(screen.getByRole('button', { name: 'Edit Priya Nair' })).toBeInTheDocument();
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <DataTable
          caption="Organisation users"
          columns={columns}
          data={users}
          getRowId={(u) => u.id}
          selectable
          getRowLabel={(u) => u.name}
          pageSize={3}
        />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

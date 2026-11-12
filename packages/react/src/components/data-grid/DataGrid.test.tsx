import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { DataGrid, type DataGridColumn } from './DataGrid';

interface Row {
  id: string;
  name: string;
  title: string;
  mailbox: string;
}

const rows: Row[] = Array.from({ length: 500 }, (_, i) => ({
  id: `u${i}`,
  name: `User ${i}`,
  title: i % 2 ? 'Account Executive' : 'Legal Counsel',
  mailbox: `user${i}@binds.si`,
}));

const columns: DataGridColumn<Row>[] = [
  { id: 'name', header: 'Name', accessor: 'name', width: 180 },
  { id: 'title', header: 'Job title', accessor: 'title', editable: true },
  { id: 'mailbox', header: 'Mailbox', accessor: 'mailbox', width: 220 },
];

function Editable({ onCellEdit }: { onCellEdit?: (e: unknown) => void }) {
  const [data, setData] = React.useState(rows);
  return (
    <DataGrid
      aria-label="Signature fields"
      columns={columns}
      data={data}
      getRowId={(r) => r.id}
      height={240}
      rowHeight={40}
      onCellEdit={(e) => {
        onCellEdit?.(e);
        setData((d) => d.map((r) => (r.id === e.rowId ? { ...r, [e.columnId]: e.value } : r)));
      }}
    />
  );
}

const cell = (r: number, c: number) =>
  document.querySelector<HTMLElement>(
    `[role="row"][aria-rowindex="${r + 1}"] [aria-colindex="${c + 1}"]`,
  )!;

describe('DataGrid', () => {
  it('exposes grid semantics and virtualises rows', () => {
    render(<Editable />);
    const grid = screen.getByRole('grid', { name: 'Signature fields' });
    expect(grid).toHaveAttribute('aria-rowcount', '501');
    expect(grid).toHaveAttribute('aria-colcount', '3');
    expect(screen.getAllByRole('columnheader')).toHaveLength(3);
    expect(screen.getAllByRole('row').length).toBeLessThan(30);
    expect(cell(1, 0)).toHaveAttribute('tabindex', '0');
    expect(cell(1, 0)).toHaveAttribute('aria-readonly', 'true');
    expect(cell(1, 1)).not.toHaveAttribute('aria-readonly');
  });

  it('navigates cells with arrows, Home/End, Ctrl+Home/End and PageDown', async () => {
    render(<Editable />);
    const user = userEvent.setup();
    await user.tab();
    expect(cell(1, 0)).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(cell(1, 1)).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(cell(2, 1)).toHaveFocus();
    await user.keyboard('{End}');
    expect(cell(2, 2)).toHaveFocus();
    await user.keyboard('{Home}');
    expect(cell(2, 0)).toHaveFocus();
    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(screen.getAllByRole('columnheader')[0]).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(screen.getAllByRole('columnheader')[0]).toHaveFocus();
    await user.keyboard('{ArrowDown}{PageDown}');
    expect(document.activeElement?.closest('[role="row"]')).toHaveAttribute('aria-rowindex', '6');
    await user.keyboard('{Control>}{End}{/Control}');
    expect(cell(500, 2)).toHaveFocus();
    await user.keyboard('{Control>}{Home}{/Control}');
    expect(screen.getAllByRole('columnheader')[0]).toHaveFocus();
    // Only one tab stop
    expect(document.querySelectorAll('[role="grid"] [tabindex="0"]')).toHaveLength(1);
  });

  it('edits with Enter, commits with Enter and cancels with Escape', async () => {
    const onCellEdit = vi.fn();
    render(<Editable onCellEdit={onCellEdit} />);
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard('{ArrowRight}{Enter}');
    const editor = screen.getByRole('textbox', { name: 'Edit Job title' });
    expect(editor).toHaveFocus();
    await user.clear(editor);
    await user.type(editor, 'Head of Sales{Enter}');
    expect(onCellEdit).toHaveBeenCalledTimes(1);
    expect(onCellEdit).toHaveBeenCalledWith(
      expect.objectContaining({ rowId: 'u0', columnId: 'title', value: 'Head of Sales' }),
    );
    expect(cell(1, 1)).toHaveTextContent('Head of Sales');
    expect(cell(1, 1)).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('Job title updated');
    await user.keyboard('{F2}');
    await user.type(screen.getByRole('textbox'), ' (EMEA){Escape}');
    expect(cell(1, 1)).toHaveTextContent('Head of Sales');
    expect(onCellEdit).toHaveBeenCalledTimes(1);
    expect(cell(1, 1)).toHaveFocus();
  });

  it('starts editing when typing on an editable cell; read-only cells ignore it', async () => {
    render(<Editable />);
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard('x');
    expect(screen.queryByRole('textbox')).toBeNull();
    await user.keyboard('{ArrowRight}P');
    expect(screen.getByRole('textbox')).toHaveValue('P');
  });

  it('resizes columns from the keyboard via the separator', async () => {
    const onColumnWidthsChange = vi.fn();
    render(
      <DataGrid
        aria-label="Users"
        columns={columns}
        data={rows.slice(0, 5)}
        onColumnWidthsChange={onColumnWidthsChange}
      />,
    );
    const user = userEvent.setup();
    screen.getAllByRole('columnheader')[0]!.focus();
    await user.keyboard('{Enter}');
    const handle = screen.getByRole('separator', { name: 'Resize Name column' });
    expect(handle).toHaveFocus();
    expect(handle).toHaveAttribute('aria-valuenow', '180');
    await user.keyboard('{ArrowRight}');
    expect(handle).toHaveAttribute('aria-valuenow', '190');
    await user.keyboard('{Shift>}{ArrowLeft}{/Shift}');
    expect(handle).toHaveAttribute('aria-valuenow', '140');
    await user.keyboard('{Home}');
    expect(handle).toHaveAttribute('aria-valuenow', '64');
    expect(onColumnWidthsChange).toHaveBeenLastCalledWith(expect.objectContaining({ name: 64 }));
    await user.keyboard('{Escape}');
    expect(screen.getAllByRole('columnheader')[0]).toHaveFocus();
  });

  it('resizes columns by pointer drag', () => {
    render(<DataGrid aria-label="Users" columns={columns} data={rows.slice(0, 5)} />);
    const handle = screen.getByRole('separator', { name: 'Resize Mailbox column' });
    fireEvent.pointerDown(handle, { clientX: 500, button: 0, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 560, pointerId: 1 });
    fireEvent.pointerUp(handle, { pointerId: 1 });
    expect(handle).toHaveAttribute('aria-valuenow', '280');
  });

  it('marks the pinned column', () => {
    render(
      <DataGrid aria-label="Users" columns={columns} data={rows.slice(0, 3)} pinFirstColumn />,
    );
    expect(cell(1, 0)).toHaveAttribute('data-pinned');
    expect(cell(1, 1)).not.toHaveAttribute('data-pinned');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <DataGrid aria-label="Users" columns={columns} data={rows.slice(0, 10)} height={240} />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

describe('DataGrid in RTL', () => {
  it('moves to the next column with ArrowLeft and back with ArrowRight', async () => {
    render(
      <div dir="rtl">
        <Editable />
      </div>,
    );
    const user = userEvent.setup();
    await user.tab();
    expect(cell(1, 0)).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(cell(1, 1)).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(cell(2, 1)).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(cell(2, 0)).toHaveFocus();
  });
});

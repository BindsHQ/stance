import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  TableRowLink,
} from './Table';

function Example({ onSort = () => {} }: { onSort?: () => void }) {
  return (
    <Table density="compact" striped stickyHeader>
      <TableCaption>Organisation users</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead sortDirection="ascending" onSort={onSort}>
            Name
          </TableHead>
          <TableHead>Template</TableHead>
          <TableHead align="end">Deployments</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow interactive>
          <TableCell>
            <TableRowLink href="#ada">Ada Lovelace</TableRowLink>
          </TableCell>
          <TableCell>Sales 2026</TableCell>
          <TableCell numeric>12</TableCell>
        </TableRow>
        <TableRow selected>
          <TableCell>Grace Hopper</TableCell>
          <TableCell>Default</TableCell>
          <TableCell numeric>4</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={2}>Total</TableCell>
          <TableCell numeric>16</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

describe('Table', () => {
  it('renders semantic table structure with a caption', () => {
    render(<Example />);
    const table = screen.getByRole('table', { name: 'Organisation users' });
    expect(table).toHaveAttribute('data-density', 'compact');
    expect(screen.getAllByRole('columnheader')).toHaveLength(3);
    expect(screen.getAllByRole('row')).toHaveLength(4);
  });

  it('is not a tab stop or region when the table fits', () => {
    const { container } = render(
      <Table scrollLabel="Users">
        <TableBody>
          <TableRow>
            <TableCell>x</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.queryByRole('region')).toBeNull();
    expect(container.querySelector('.st-table-wrapper')).not.toHaveAttribute('tabindex');
  });

  it('becomes a focusable region named by its caption when it overflows', async () => {
    const width = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollWidth');
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
      configurable: true,
      get: () => 900,
    });
    try {
      render(
        <Table>
          <TableCaption>Organisation users</TableCaption>
          <TableBody>
            <TableRow>
              <TableCell>x</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      );
      const region = await screen.findByRole('region', { name: 'Organisation users' });
      await userEvent.tab();
      expect(region).toHaveFocus();
    } finally {
      if (width) Object.defineProperty(HTMLElement.prototype, 'scrollWidth', width);
    }
  });

  it('exposes sort state with aria-sort and a keyboard-operable button', async () => {
    const onSort = vi.fn();
    render(<Example onSort={onSort} />);
    const header = screen.getByRole('columnheader', { name: /Name/ });
    expect(header).toHaveAttribute('aria-sort', 'ascending');
    const button = screen.getByRole('button', { name: 'Name' });
    button.focus();
    await userEvent.keyboard('{Enter}');
    expect(onSort).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('columnheader', { name: 'Template' })).not.toHaveAttribute('aria-sort');
  });

  it('makes interactive rows reachable through a real link and marks selected rows', () => {
    render(<Example />);
    expect(screen.getByRole('link', { name: 'Ada Lovelace' })).toHaveAttribute('href', '#ada');
    expect(screen.getByText('Grace Hopper').closest('tr')).toHaveAttribute('data-selected');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <Example />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

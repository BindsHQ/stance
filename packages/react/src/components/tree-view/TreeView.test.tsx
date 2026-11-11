import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { TreeView, type TreeItem } from './TreeView';

const items: TreeItem[] = [
  {
    id: 'org',
    label: 'Organisation',
    children: [
      {
        id: 'sales',
        label: 'Sales',
        children: [
          { id: 'emea', label: 'EMEA' },
          { id: 'apac', label: 'APAC' },
        ],
      },
      { id: 'support', label: 'Support', children: [{ id: 'tier1', label: 'Tier 1' }] },
      { id: 'legal', label: 'Legal', disabled: true },
      { id: 'marketing', label: 'Marketing' },
    ],
  },
  { id: 'archive', label: 'Archive' },
];

const item = (name: string) => screen.getByRole('treeitem', { name: new RegExp(`^${name}`) });

describe('TreeView', () => {
  it('exposes tree semantics with levels and set positions', () => {
    render(<TreeView aria-label="Teams" items={items} defaultExpanded={['org']} />);
    expect(screen.getByRole('tree', { name: 'Teams' })).toBeInTheDocument();
    const sales = item('Sales');
    expect(sales).toHaveAttribute('aria-level', '2');
    expect(sales).toHaveAttribute('aria-posinset', '1');
    expect(sales).toHaveAttribute('aria-setsize', '4');
    expect(sales).toHaveAttribute('aria-expanded', 'false');
    expect(within(item('Organisation')).getAllByRole('group')).toHaveLength(1);
  });

  it('implements the APG keyboard model', async () => {
    render(<TreeView aria-label="Teams" items={items} />);
    const user = userEvent.setup();
    await user.tab();
    expect(item('Organisation')).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(item('Organisation')).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{ArrowRight}');
    expect(item('Sales')).toHaveFocus();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    // Legal is disabled and skipped.
    expect(item('Marketing')).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(item('Organisation')).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(item('Organisation')).toHaveAttribute('aria-expanded', 'false');
    await user.keyboard('{End}');
    expect(item('Archive')).toHaveFocus();
    await user.keyboard('{Home}');
    expect(item('Organisation')).toHaveFocus();
  });

  it('expands all siblings with * and supports typeahead', async () => {
    render(<TreeView aria-label="Teams" items={items} defaultExpanded={['org']} />);
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard('{ArrowDown}*');
    expect(item('Sales')).toHaveAttribute('aria-expanded', 'true');
    expect(item('Support')).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('t');
    expect(item('Tier 1')).toHaveFocus();
    await new Promise((r) => setTimeout(r, 650));
    await user.keyboard('a');
    expect(item('Archive')).toHaveFocus();
  });

  it('selects with Enter / click in single mode and calls onAction', async () => {
    const onSelectedChange = vi.fn();
    const onAction = vi.fn();
    render(
      <TreeView
        aria-label="Teams"
        items={items}
        onSelectedChange={onSelectedChange}
        onAction={onAction}
      />,
    );
    const user = userEvent.setup();
    await user.click(screen.getByText('Archive'));
    expect(item('Archive')).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Home}{Enter}');
    expect(onSelectedChange).toHaveBeenLastCalledWith(['org']);
    expect(onAction).toHaveBeenCalledTimes(2);
  });

  it('supports multiple selection with Space and Ctrl+A', async () => {
    render(
      <TreeView
        aria-label="Teams"
        items={items}
        selectionMode="multiple"
        defaultExpanded={['org']}
      />,
    );
    expect(screen.getByRole('tree')).toHaveAttribute('aria-multiselectable', 'true');
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard(' {ArrowDown} ');
    expect(item('Organisation')).toHaveAttribute('aria-selected', 'true');
    expect(item('Sales')).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Control>}a{/Control}');
    expect(item('Marketing')).toHaveAttribute('aria-selected', 'true');
    expect(item('Legal')).toHaveAttribute('aria-selected', 'false');
  });

  it('respects controlled expanded state', async () => {
    const onExpandedChange = vi.fn();
    render(
      <TreeView
        aria-label="Teams"
        items={items}
        expanded={[]}
        onExpandedChange={onExpandedChange}
      />,
    );
    await userEvent.click(screen.getByText('Organisation'));
    expect(onExpandedChange).toHaveBeenCalledWith(['org']);
    expect(item('Organisation')).toHaveAttribute('aria-expanded', 'false');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <TreeView
          aria-label="Teams"
          items={items}
          defaultExpanded={['org', 'sales']}
          defaultSelected={['emea']}
        />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

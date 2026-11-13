import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { SubagentTree, type SubagentTreeNode } from './SubagentTree';

const nodes: SubagentTreeNode[] = [
  {
    id: 'lead',
    name: 'Lead',
    status: 'running',
    summary: 'Planning the review',
    children: [
      { id: 'research', name: 'Researcher', status: 'complete', summary: 'Found 4 clauses' },
      {
        id: 'writer',
        name: 'Writer',
        status: 'waiting',
        children: [{ id: 'checker', name: 'Checker', status: 'error', summary: 'Timed out' }],
      },
    ],
  },
  { id: 'audit', name: 'Auditor', status: 'pending' },
];

const item = (name: RegExp) => screen.getByRole('treeitem', { name });

describe('SubagentTree', () => {
  it('renders a tree with every agent expanded by default', () => {
    render(<SubagentTree nodes={nodes} />);
    expect(screen.getByRole('tree', { name: 'Agents' })).toBeInTheDocument();
    expect(screen.getAllByRole('treeitem')).toHaveLength(5);
    expect(item(/^Lead/)).toHaveAttribute('aria-expanded', 'true');
    expect(item(/^Lead/)).toHaveAttribute('aria-level', '1');
    expect(item(/^Checker/)).toHaveAttribute('aria-level', '3');
    expect(item(/^Auditor/)).not.toHaveAttribute('aria-expanded');
  });

  it('puts the summary and the status in the name of each item', () => {
    render(<SubagentTree nodes={nodes} />);
    expect(item(/^Researcher/)).toHaveAccessibleName(/^Researcher,\s?Found 4 clauses,\s?Complete$/);
    expect(item(/^Checker/)).toHaveAccessibleName(/^Checker,\s?Timed out,\s?Failed$/);
    expect(item(/^Auditor/)).toHaveAccessibleName(/^Auditor,\s?Pending$/);
    expect(item(/^Checker/).querySelector('.st-step-status')).toHaveAttribute(
      'data-status',
      'error',
    );
  });

  it('expands and collapses, uncontrolled', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    render(
      <SubagentTree
        nodes={nodes}
        defaultExpandedIds={['lead']}
        onExpandedChange={onExpandedChange}
      />,
    );
    expect(screen.queryByRole('treeitem', { name: /^Checker/ })).toBeNull();
    item(/^Writer/).focus();
    await user.keyboard('{ArrowRight}');
    expect(onExpandedChange).toHaveBeenLastCalledWith(['lead', 'writer']);
    expect(item(/^Checker/)).toBeInTheDocument();
    await user.keyboard('{ArrowLeft}');
    expect(onExpandedChange).toHaveBeenLastCalledWith(['lead']);
    expect(screen.queryByRole('treeitem', { name: /^Checker/ })).toBeNull();
  });

  it('respects controlled expandedIds', async () => {
    const onExpandedChange = vi.fn();
    render(<SubagentTree nodes={nodes} expandedIds={[]} onExpandedChange={onExpandedChange} />);
    expect(screen.getAllByRole('treeitem')).toHaveLength(2);
    item(/^Lead/).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onExpandedChange).toHaveBeenCalledWith(['lead']);
    expect(screen.getAllByRole('treeitem')).toHaveLength(2);
  });

  it('moves with the arrow keys, Home and End', async () => {
    const user = userEvent.setup();
    render(<SubagentTree nodes={nodes} />);
    await user.tab();
    expect(item(/^Lead/)).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(item(/^Researcher/)).toHaveFocus();
    await user.keyboard('{End}');
    expect(item(/^Auditor/)).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(item(/^Checker/)).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(item(/^Writer/)).toHaveFocus();
    await user.keyboard('{Home}');
    expect(item(/^Lead/)).toHaveFocus();
  });

  it('selects with Enter and click, uncontrolled', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<SubagentTree nodes={nodes} onSelect={onSelect} defaultSelectedId="audit" />);
    expect(item(/^Auditor/)).toHaveAttribute('aria-selected', 'true');
    item(/^Researcher/).focus();
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenLastCalledWith('research', nodes[0]!.children![0]);
    expect(item(/^Researcher/)).toHaveAttribute('aria-selected', 'true');
    expect(item(/^Auditor/)).toHaveAttribute('aria-selected', 'false');
    await user.click(screen.getByText('Checker'));
    expect(onSelect).toHaveBeenLastCalledWith(
      'checker',
      expect.objectContaining({ id: 'checker' }),
    );
  });

  it('respects a controlled selectedId', async () => {
    const onSelect = vi.fn();
    render(<SubagentTree nodes={nodes} selectedId="lead" onSelect={onSelect} />);
    await userEvent.click(screen.getByText('Auditor'));
    expect(onSelect).toHaveBeenCalledWith('audit', nodes[1]);
    expect(item(/^Lead/)).toHaveAttribute('aria-selected', 'true');
    expect(item(/^Auditor/)).toHaveAttribute('aria-selected', 'false');
  });

  it('uses translated labels', () => {
    render(
      <SubagentTree nodes={nodes} labels={{ label: 'Agenter', status: { complete: 'Klar' } }} />,
    );
    expect(screen.getByRole('tree', { name: 'Agenter' })).toBeInTheDocument();
    expect(item(/^Researcher/)).toHaveAccessibleName(/^Researcher,\s?Found 4 clauses,\s?Klar$/);
    expect(item(/^Auditor/)).toHaveAccessibleName(/^Auditor,\s?Pending$/);
  });

  it('forwards the ref, className and props', () => {
    const ref = React.createRef<HTMLUListElement>();
    render(<SubagentTree ref={ref} nodes={nodes} className="mine" id="agents" size="sm" />);
    expect(ref.current).toHaveClass('st-tree', 'st-subagent-tree', 'mine');
    expect(ref.current).toHaveAttribute('id', 'agents');
    expect(ref.current).toHaveAttribute('data-size', 'sm');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <SubagentTree nodes={nodes} defaultSelectedId="research" />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

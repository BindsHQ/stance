import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { PlanChecklist, type PlanChecklistItem } from './PlanChecklist';

const items: PlanChecklistItem[] = [
  { id: 'a', title: 'Read the contract', status: 'complete' },
  { id: 'b', title: 'Compare clauses', description: 'Both versions', status: 'running' },
  { id: 'c', title: 'Draft a summary', status: 'pending' },
  { id: 'd', title: 'Send for review', status: 'skipped' },
];

function Stateful(props: Partial<React.ComponentProps<typeof PlanChecklist>>) {
  const [list, setList] = React.useState(items);
  return <PlanChecklist items={list} editable onItemsChange={setList} {...props} />;
}

describe('PlanChecklist', () => {
  it('is a named group with a list and a derived progress summary', () => {
    render(<PlanChecklist items={items} />);
    const group = screen.getByRole('group', { name: 'Plan' });
    const list = within(group).getByRole('list', { name: 'Steps' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByText('2 of 4 steps done')).toBeVisible();
    const bar = screen.getByRole('progressbar', { name: 'Plan' });
    expect(bar).toHaveAttribute('aria-valuenow', '50');
    expect(bar).toHaveAttribute('aria-valuetext', '2 of 4 steps done');
    expect(within(list).getAllByRole('listitem')[1]).toHaveTextContent(
      'Compare clauses, RunningBoth versions',
    );
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('uses an explicit progress value', () => {
    render(<PlanChecklist items={items} progress={80} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '80');
  });

  it('approves and rejects', async () => {
    const onApprove = vi.fn();
    const onReject = vi.fn();
    render(<PlanChecklist items={items} onApprove={onApprove} onReject={onReject} />);
    await userEvent.click(screen.getByRole('button', { name: 'Approve plan' }));
    await userEvent.click(screen.getByRole('button', { name: 'Reject' }));
    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it('disables approve for an empty plan and shows the empty text', () => {
    render(<PlanChecklist items={[]} onApprove={() => {}} />);
    expect(screen.getByText('No steps')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Approve plan' })).toBeDisabled();
  });

  it('renames a step with Enter and returns focus to its edit button', async () => {
    const user = userEvent.setup();
    const onItemsChange = vi.fn();
    render(<Stateful onItemsChange={onItemsChange} />);
    await user.click(screen.getByRole('button', { name: 'Edit Draft a summary' }));
    const field = screen.getByRole('textbox', { name: 'Step title' });
    expect(field).toHaveFocus();
    await user.clear(field);
    await user.type(field, 'Write the summary{Enter}');
    expect(onItemsChange).toHaveBeenCalledTimes(1);
    expect(onItemsChange.mock.calls[0]![0][2]).toMatchObject({
      id: 'c',
      title: 'Write the summary',
    });
  });

  it('keeps focus on the step after saving and cancels with Escape', async () => {
    const user = userEvent.setup();
    render(<Stateful />);
    await user.click(screen.getByRole('button', { name: 'Edit Draft a summary' }));
    await user.type(screen.getByRole('textbox'), ' now{Enter}');
    expect(screen.getByRole('button', { name: 'Edit Draft a summary now' })).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.type(screen.getByRole('textbox'), 'zzz{Escape}');
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.getByRole('button', { name: 'Edit Draft a summary now' })).toHaveFocus();
  });

  it('removes a step, announces it and moves focus to the next step', async () => {
    const user = userEvent.setup();
    const { container } = render(<Stateful />);
    await user.click(screen.getByRole('button', { name: 'Remove Compare clauses' }));
    expect(screen.queryByText('Compare clauses')).toBeNull();
    expect(container.querySelector('[data-st-announcer]')).toHaveTextContent(
      'Removed Compare clauses',
    );
    expect(screen.getByRole('button', { name: 'Edit Draft a summary' })).toHaveFocus();
    expect(screen.getByText('2 of 3 steps done')).toBeVisible();
  });

  it('reorders with the move up and move down buttons', async () => {
    const user = userEvent.setup();
    const onItemsChange = vi.fn();
    render(<PlanChecklist items={items} editable onItemsChange={onItemsChange} />);
    await user.click(screen.getByRole('button', { name: 'Move Draft a summary up' }));
    expect(onItemsChange.mock.calls[0]![0].map((i: PlanChecklistItem) => i.id)).toEqual([
      'a',
      'c',
      'b',
      'd',
    ]);
    expect(screen.getByRole('button', { name: 'Move Read the contract up' })).toBeDisabled();
  });

  it('disables editing and decisions when disabled', () => {
    render(<PlanChecklist items={items} editable disabled onApprove={() => {}} />);
    expect(screen.getByRole('button', { name: 'Edit Compare clauses' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Approve plan' })).toBeDisabled();
  });

  it('uses translated labels and a custom title', () => {
    render(
      <PlanChecklist
        items={items}
        title="Renewal plan"
        onApprove={() => {}}
        labels={{ approve: 'Godkänn', progress: (d, t) => `${d}/${t}` }}
      />,
    );
    expect(screen.getByRole('group', { name: 'Renewal plan' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Godkänn' })).toBeVisible();
    expect(screen.getByText('2/4')).toBeVisible();
  });

  it('forwards the ref, className and props', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<PlanChecklist ref={ref} className="mine" id="plan" items={items} />);
    expect(ref.current).toHaveClass('st-plan-checklist', 'mine');
    expect(ref.current).toHaveAttribute('id', 'plan');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <PlanChecklist items={items} onApprove={() => {}} onReject={() => {}} />
        <PlanChecklist
          items={items}
          editable
          onItemsChange={() => {}}
          labels={{ title: 'Editable plan' }}
        />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { StepTimeline, type StepTimelineStep } from './StepTimeline';

const steps: StepTimelineStep[] = [
  {
    id: 'read',
    title: 'Read the contract',
    status: 'complete',
    duration: 4,
    content: <p>12 pages</p>,
  },
  { id: 'compare', title: 'Compare clauses', description: 'Two versions', status: 'running' },
  { id: 'draft', title: 'Draft a summary', status: 'pending', content: <p>Not yet</p> },
];

describe('StepTimeline', () => {
  it('renders an ordered list with status in text and the running step as current', () => {
    render(<StepTimeline steps={steps} />);
    const list = screen.getByRole('list', { name: 'Steps' });
    expect(list.tagName).toBe('OL');
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('Complete');
    expect(items[0]).toHaveTextContent('4 s');
    expect(items[0]).not.toHaveAttribute('aria-current');
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[1]).toHaveTextContent('Running');
    expect(items[1]).toHaveTextContent('Two versions');
    expect(items[2]).toHaveAttribute('data-status', 'pending');
  });

  it('expands and collapses steps that have content', async () => {
    const onExpandedChange = vi.fn();
    render(<StepTimeline steps={steps} onExpandedChange={onExpandedChange} />);
    expect(screen.getAllByRole('button')).toHaveLength(2);
    const trigger = screen.getByRole('button', { name: /Read the contract/ });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById(trigger.getAttribute('aria-controls')!)).toHaveTextContent(
      '12 pages',
    );
    expect(onExpandedChange).toHaveBeenLastCalledWith(['read']);
    await userEvent.click(trigger);
    expect(screen.queryByText('12 pages')).toBeNull();
    expect(onExpandedChange).toHaveBeenLastCalledWith([]);
  });

  it('works with the keyboard', async () => {
    const user = userEvent.setup();
    render(<StepTimeline steps={steps} />);
    await user.tab();
    await user.keyboard('{Enter}');
    expect(screen.getByText('12 pages')).toBeVisible();
    await user.tab();
    await user.keyboard(' ');
    expect(screen.getByText('Not yet')).toBeVisible();
  });

  it('supports controlled and default expanded ids', async () => {
    const onExpandedChange = vi.fn();
    const { rerender } = render(
      <StepTimeline steps={steps} expandedIds={['draft']} onExpandedChange={onExpandedChange} />,
    );
    expect(screen.getByText('Not yet')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: /Read the contract/ }));
    expect(onExpandedChange).toHaveBeenCalledWith(['draft', 'read']);
    expect(screen.queryByText('12 pages')).toBeNull();
    rerender(<StepTimeline key="2" steps={steps} defaultExpandedIds={['read']} />);
    expect(screen.getByText('12 pages')).toBeVisible();
  });

  it('keeps the status as hidden text when compact and drops descriptions', () => {
    render(<StepTimeline steps={steps} compact />);
    expect(screen.queryByText('Two versions')).toBeNull();
    const item = screen.getAllByRole('listitem')[1]!;
    expect(item).toHaveTextContent('Compare clauses, Running');
    expect(within(item).getByText(', Running')).toHaveClass('st-sr-only');
  });

  it('uses translated labels', () => {
    render(
      <StepTimeline
        steps={steps}
        labels={{ list: 'Steg', status: { running: 'Pågår' }, duration: (s) => `${s} sek` }}
      />,
    );
    expect(screen.getByRole('list', { name: 'Steg' })).toBeVisible();
    expect(screen.getByText('Pågår')).toBeVisible();
    expect(screen.getByText('4 sek')).toBeVisible();
  });

  it('forwards the ref, className and props', () => {
    const ref = React.createRef<HTMLOListElement>();
    render(<StepTimeline ref={ref} className="mine" id="run" steps={[]} />);
    expect(ref.current).toHaveClass('st-step-timeline', 'mine');
    expect(ref.current).toHaveAttribute('id', 'run');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <StepTimeline steps={steps} defaultExpandedIds={['read']} />
        <StepTimeline steps={steps} compact labels={{ list: 'Compact steps' }} />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

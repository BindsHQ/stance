import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { TaskQueue, type TaskQueueTask } from './TaskQueue';

const tasks: TaskQueueTask[] = [
  { id: 'a', title: 'Export the report', status: 'running', progress: 40, detail: 'Page 4 of 10' },
  { id: 'b', title: 'Email the team', status: 'pending' },
  { id: 'c', title: 'Sync contacts', status: 'error', detail: 'Network error' },
  { id: 'd', title: 'Index documents', status: 'complete' },
  { id: 'e', title: 'Resize images', status: 'running', paused: true },
  { id: 'f', title: 'Confirm payment', status: 'waiting' },
];
const handlers = () => ({
  onCancel: vi.fn(),
  onRetry: vi.fn(),
  onPause: vi.fn(),
  onResume: vi.fn(),
});

describe('TaskQueue', () => {
  it('renders a list described by a count summary, with status in words', () => {
    render(<TaskQueue tasks={tasks} />);
    const list = screen.getByRole('list', { name: 'Tasks' });
    expect(list).toHaveAccessibleDescription('3 running, 1 queued, 2 finished');
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(6);
    expect(items[0]).toHaveTextContent('Running');
    expect(items[0]).toHaveTextContent('Page 4 of 10');
    expect(items[2]).toHaveTextContent('Failed');
    expect(items[4]).toHaveTextContent('Paused');
    expect(items[5]).toHaveTextContent('Waiting for you');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows progress only on a running task with a value', () => {
    render(<TaskQueue tasks={tasks} />);
    const bars = screen.getAllByRole('progressbar');
    expect(bars).toHaveLength(1);
    expect(bars[0]).toHaveAccessibleName('Export the report');
    expect(bars[0]).toHaveAttribute('aria-valuenow', '40');
  });

  it('offers the actions that fit each status, each naming its task', async () => {
    const h = handlers();
    render(<TaskQueue tasks={tasks} {...h} />);
    const names = screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'));
    expect(names).toEqual([
      'Pause Export the report',
      'Cancel Export the report',
      'Cancel Email the team',
      'Retry Sync contacts',
      'Resume Resize images',
      'Cancel Resize images',
      'Cancel Confirm payment',
    ]);
    await userEvent.click(screen.getByRole('button', { name: 'Pause Export the report' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel Email the team' }));
    await userEvent.click(screen.getByRole('button', { name: 'Retry Sync contacts' }));
    await userEvent.click(screen.getByRole('button', { name: 'Resume Resize images' }));
    expect(h.onPause).toHaveBeenCalledWith('a');
    expect(h.onCancel).toHaveBeenCalledWith('b');
    expect(h.onRetry).toHaveBeenCalledWith('c');
    expect(h.onResume).toHaveBeenCalledWith('e');
  });

  it('selects a task from its title with the keyboard', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<TaskQueue tasks={tasks.slice(0, 2)} onSelect={onSelect} />);
    await user.tab();
    expect(screen.getByRole('button', { name: 'Export the report' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith('a');
  });

  it('shows the start time through the label', () => {
    render(
      <TaskQueue
        tasks={[{ id: 'a', title: 'Export', status: 'running', startedAt: '2026-03-04T10:42:00Z' }]}
        labels={{ started: (d) => `Started ${d.getUTCHours()}:${d.getUTCMinutes()}` }}
      />,
    );
    const time = screen.getByText('Started 10:42');
    expect(time.tagName).toBe('TIME');
    expect(time).toHaveAttribute('datetime', '2026-03-04T10:42:00.000Z');
  });

  it('shows the empty state', () => {
    const { rerender } = render(<TaskQueue tasks={[]} />);
    expect(screen.getByText('No tasks')).toBeVisible();
    expect(screen.queryByRole('list')).toBeNull();
    rerender(<TaskQueue tasks={[]} emptyState={<p>Nothing queued</p>} />);
    expect(screen.getByText('Nothing queued')).toBeVisible();
  });

  it('uses translated labels', () => {
    render(
      <TaskQueue
        tasks={tasks.slice(0, 1)}
        onCancel={() => {}}
        labels={{
          list: 'Uppgifter',
          cancel: 'Avbryt',
          summary: (c) => `${c.total} totalt`,
          status: { running: 'Pågår' },
        }}
      />,
    );
    expect(screen.getByRole('list', { name: 'Uppgifter' })).toHaveAccessibleDescription('1 totalt');
    expect(screen.getByRole('button', { name: 'Avbryt Export the report' })).toBeVisible();
    expect(screen.getByText('Pågår')).toBeVisible();
  });

  it('forwards the ref, className and props', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<TaskQueue ref={ref} className="mine" id="queue" tasks={tasks} />);
    expect(ref.current).toHaveClass('st-task-queue', 'mine');
    expect(ref.current).toHaveAttribute('id', 'queue');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <TaskQueue tasks={tasks} {...handlers()} onSelect={() => {}} />
        <TaskQueue tasks={[]} />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

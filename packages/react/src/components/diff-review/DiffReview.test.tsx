import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { DiffReview, type DiffReviewFile } from './DiffReview';

const files: DiffReviewFile[] = [
  {
    id: 'a',
    path: 'src/price.ts',
    status: 'modified',
    hunks: [
      {
        id: 'a1',
        header: '@@ -1,3 +1,3 @@',
        lines: [
          { kind: 'context', text: 'const rate = 0.2;', oldNumber: 1, newNumber: 1 },
          { kind: 'remove', text: 'return net * rate;', oldNumber: 2 },
          { kind: 'add', text: 'return round(net * rate);', newNumber: 2 },
          { kind: 'context', text: '}', oldNumber: 3, newNumber: 3 },
        ],
      },
      {
        id: 'a2',
        header: '@@ -10,1 +10,2 @@',
        lines: [
          { kind: 'context', text: 'export {};', oldNumber: 10, newNumber: 10 },
          { kind: 'add', text: 'export { round };', newNumber: 11 },
        ],
      },
    ],
  },
  {
    id: 'b',
    path: 'src/round.ts',
    status: 'renamed',
    previousPath: 'src/rounding.ts',
    hunks: [
      {
        id: 'b1',
        lines: [{ kind: 'add', text: 'export const round = Math.round;', newNumber: 1 }],
      },
    ],
  },
];

const announcer = (container: HTMLElement) => container.querySelector('[data-st-announcer]')!;
const hunk = (name: RegExp | string) => screen.getByRole('group', { name });

describe('DiffReview', () => {
  it('renders files, hunks and a summary', () => {
    render(<DiffReview files={files} />);
    expect(screen.getByRole('group', { name: 'Proposed changes' })).toBeInTheDocument();
    expect(screen.getByText('2 files, 3 changes, 0 decided')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'src/price.ts' })).toBeInTheDocument();
    expect(hunk('Change 1 of 2 in src/price.ts, Pending')).toBeInTheDocument();
    expect(hunk('Change 2 of 2 in src/price.ts, Pending')).toBeInTheDocument();
    expect(hunk('Change 1 of 1 in src/round.ts, Pending')).toBeInTheDocument();
    expect(screen.getByText('@@ -1,3 +1,3 @@')).toBeInTheDocument();
    expect(screen.getByText('Renamed')).toHaveTextContent('Renamed, Renamed from src/rounding.ts');
    expect(screen.getByText('2 added, 1 removed')).toBeInTheDocument();
  });

  it('gives added and removed lines a prefix and a hidden word, not colour alone', () => {
    const { container } = render(<DiffReview files={files} />);
    const removed = container.querySelector('tr[data-kind="remove"]')!;
    expect(removed.querySelector('.st-diff-review__prefix')).toHaveTextContent('-');
    expect(removed.querySelector('.st-diff-review__text')).toHaveTextContent(
      'Removed: return net * rate;',
    );
    const added = container.querySelector('tr[data-kind="add"]')!;
    expect(added.querySelector('.st-diff-review__prefix')).toHaveTextContent('+');
    expect(added.querySelector('.st-diff-review__text')).toHaveTextContent(
      'Added: return round(net * rate);',
    );
    expect(container.querySelector('tr[data-kind="context"] .st-sr-only')).toHaveTextContent(
      'Unchanged:',
    );
  });

  it('accepts and rejects one hunk, and toggles a decision off', async () => {
    const user = userEvent.setup();
    const onDecisionsChange = vi.fn();
    const { container } = render(
      <DiffReview files={files} onDecisionsChange={onDecisionsChange} />,
    );
    const first = hunk(/Change 1 of 2 in src\/price.ts/);
    const accept = within(first).getByRole('button', { name: /^Accept/ });
    await user.click(accept);
    expect(onDecisionsChange).toHaveBeenLastCalledWith({ a1: 'accepted' });
    expect(accept).toHaveAttribute('aria-pressed', 'true');
    expect(first).toHaveAccessibleName('Change 1 of 2 in src/price.ts, Accepted');
    expect(first).toHaveAttribute('data-decision', 'accepted');
    expect(announcer(container)).toHaveTextContent('Change 1 of 2 in src/price.ts, Accepted');
    expect(screen.getByText('2 files, 3 changes, 1 decided')).toBeInTheDocument();
    await user.click(within(first).getByRole('button', { name: /^Reject/ }));
    expect(onDecisionsChange).toHaveBeenLastCalledWith({ a1: 'rejected' });
    await user.click(within(first).getByRole('button', { name: /^Reject/ }));
    expect(onDecisionsChange).toHaveBeenLastCalledWith({});
    expect(first).toHaveAttribute('data-decision', 'pending');
  });

  it('accepts and rejects a whole file', async () => {
    const user = userEvent.setup();
    const onDecisionsChange = vi.fn();
    render(<DiffReview files={files} onDecisionsChange={onDecisionsChange} />);
    await user.click(screen.getByRole('button', { name: 'Accept file: src/price.ts' }));
    expect(onDecisionsChange).toHaveBeenLastCalledWith({ a1: 'accepted', a2: 'accepted' });
    await user.click(screen.getByRole('button', { name: 'Reject file: src/round.ts' }));
    expect(onDecisionsChange).toHaveBeenLastCalledWith({
      a1: 'accepted',
      a2: 'accepted',
      b1: 'rejected',
    });
  });

  it('accepts all and rejects all', async () => {
    const user = userEvent.setup();
    const onDecisionsChange = vi.fn();
    const onAcceptAll = vi.fn();
    const onRejectAll = vi.fn();
    render(
      <DiffReview
        files={files}
        onDecisionsChange={onDecisionsChange}
        onAcceptAll={onAcceptAll}
        onRejectAll={onRejectAll}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Accept all' }));
    expect(onDecisionsChange).toHaveBeenLastCalledWith({
      a1: 'accepted',
      a2: 'accepted',
      b1: 'accepted',
    });
    expect(onAcceptAll).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Reject all' }));
    expect(onDecisionsChange).toHaveBeenLastCalledWith({
      a1: 'rejected',
      a2: 'rejected',
      b1: 'rejected',
    });
    expect(onRejectAll).toHaveBeenCalledTimes(1);
  });

  it('is controlled by decisions', async () => {
    const onDecisionsChange = vi.fn();
    render(
      <DiffReview
        files={files}
        decisions={{ a2: 'rejected' }}
        onDecisionsChange={onDecisionsChange}
      />,
    );
    const second = hunk('Change 2 of 2 in src/price.ts, Rejected');
    await userEvent.click(within(second).getByRole('button', { name: /^Accept/ }));
    expect(onDecisionsChange).toHaveBeenCalledWith({ a2: 'accepted' });
    expect(second).toHaveAttribute('data-decision', 'rejected');
  });

  it('moves between hunks and decides with the keyboard', async () => {
    const user = userEvent.setup();
    const onDecisionsChange = vi.fn();
    render(<DiffReview files={files} onDecisionsChange={onDecisionsChange} />);
    const [one, two, three] = screen.getAllByRole('group', { name: /^Change/ });
    one!.focus();
    await user.keyboard('{ArrowDown}');
    expect(two).toHaveFocus();
    await user.keyboard('j');
    expect(three).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(three).toHaveFocus();
    await user.keyboard('k');
    expect(two).toHaveFocus();
    await user.keyboard('a');
    expect(onDecisionsChange).toHaveBeenLastCalledWith({ a2: 'accepted' });
    await user.keyboard('{ArrowUp}r');
    expect(one).toHaveFocus();
    expect(onDecisionsChange).toHaveBeenLastCalledWith({ a2: 'accepted', a1: 'rejected' });
    await user.keyboard('u');
    expect(onDecisionsChange).toHaveBeenLastCalledWith({ a2: 'accepted' });
  });

  it('switches between unified and split views', async () => {
    const user = userEvent.setup();
    const onViewChange = vi.fn();
    const { container } = render(<DiffReview files={files} onViewChange={onViewChange} />);
    expect(screen.getByRole('button', { name: 'Unified' })).toHaveAttribute('aria-pressed', 'true');
    expect(container.querySelector('table[data-split]')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Split' }));
    expect(onViewChange).toHaveBeenCalledWith('split');
    expect(container.firstElementChild).toHaveAttribute('data-view', 'split');
    const rows = container.querySelectorAll('table[data-split]')[0]!.querySelectorAll('tr');
    // The removed and the added line share one row.
    expect(rows).toHaveLength(3);
    expect(rows[1]!.querySelector('[data-side="old"]')).toHaveTextContent(
      'Before, Removed: return net * rate;',
    );
    expect(rows[1]!.querySelector('[data-side="new"]')).toHaveTextContent(
      'After, Added: return round(net * rate);',
    );
    // An addition without a removal leaves the old side blank.
    const second = container.querySelectorAll('table[data-split]')[1]!.querySelectorAll('tr');
    expect(second[1]!.querySelector('.st-diff-review__blank')).toHaveAttribute('data-side', 'old');
  });

  it('respects a controlled view', async () => {
    const { container } = render(<DiffReview files={files} view="split" />);
    await userEvent.click(screen.getByRole('button', { name: 'Unified' }));
    expect(container.firstElementChild).toHaveAttribute('data-view', 'split');
  });

  it('collapses files, uncontrolled and controlled', async () => {
    const user = userEvent.setup();
    const onCollapsedChange = vi.fn();
    const { rerender } = render(
      <DiffReview
        files={files}
        defaultCollapsedIds={['b']}
        onCollapsedChange={onCollapsedChange}
      />,
    );
    const toggle = screen.getByRole('button', { name: 'src/round.ts' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('group', { name: /^Change .* src\/round.ts/ })).toBeNull();
    await user.click(toggle);
    expect(onCollapsedChange).toHaveBeenCalledWith([]);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await user.click(screen.getByRole('button', { name: 'src/price.ts' }));
    expect(onCollapsedChange).toHaveBeenLastCalledWith(['a']);
    rerender(<DiffReview files={files} collapsedIds={['a', 'b']} />);
    expect(screen.queryAllByRole('group', { name: /^Change/ })).toHaveLength(0);
  });

  it('hides the decisions when read only and shows an empty state', () => {
    const { rerender } = render(<DiffReview files={files} readOnly />);
    expect(screen.queryByRole('button', { name: 'Accept all' })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Accept/ })).toBeNull();
    rerender(<DiffReview files={[]} />);
    expect(screen.getByText('No changes to review')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Accept all' })).toBeNull();
  });

  it('uses translated labels', () => {
    render(
      <DiffReview
        files={files}
        defaultDecisions={{ a1: 'accepted' }}
        labels={{
          label: 'Föreslagna ändringar',
          acceptAll: 'Godkänn alla',
          decision: { accepted: 'Godkänd', rejected: 'Avvisad', pending: 'Väntar' },
          hunk: (i, n, path) => `Ändring ${i} av ${n} i ${path}`,
        }}
      />,
    );
    expect(screen.getByRole('group', { name: 'Föreslagna ändringar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Godkänn alla' })).toBeInTheDocument();
    expect(hunk('Ändring 1 av 2 i src/price.ts, Godkänd')).toBeInTheDocument();
  });

  it('forwards the ref, className and props', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<DiffReview ref={ref} files={files} className="mine" id="review" wrap />);
    expect(ref.current).toHaveClass('st-diff-review', 'mine');
    expect(ref.current).toHaveAttribute('id', 'review');
    expect(ref.current).toHaveAttribute('data-wrap', '');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <DiffReview files={files} defaultDecisions={{ a1: 'accepted', b1: 'rejected' }} />
        <DiffReview files={files} view="split" labels={{ label: 'Split changes' }} />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

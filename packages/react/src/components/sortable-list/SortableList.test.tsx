import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { arrayMove, SortableList, type SortableListHandle } from './SortableList';

interface Step {
  id: string;
  name: string;
}
const initial: Step[] = [
  { id: 'a', name: 'Legal review' },
  { id: 'b', name: 'Finance approval' },
  { id: 'c', name: 'Director sign-off' },
  { id: 'd', name: 'Countersignature' },
];

function Example(props: {
  onReorder?: (ids: string[], move: { from: number; to: number }) => void;
  showMoveButtons?: boolean;
  disabled?: boolean;
  handle?: React.Ref<SortableListHandle>;
}) {
  const [items, setItems] = React.useState(initial);
  return (
    <SortableList
      ref={props.handle}
      label="Approval order"
      items={items}
      getItemId={(i) => i.id}
      getItemLabel={(i) => i.name}
      renderItem={(i, s) => <span data-testid={`row-${s.index}`}>{i.name}</span>}
      showMoveButtons={props.showMoveButtons}
      disabled={props.disabled}
      onReorder={(next, move) => {
        setItems(next);
        props.onReorder?.(
          next.map((n) => n.id),
          move,
        );
      }}
    />
  );
}
const order = () => screen.getAllByTestId(/^row-/).map((el) => el.textContent);

afterEach(() => vi.restoreAllMocks());

describe('SortableList', () => {
  it('renders a labelled list with a named handle per item', () => {
    render(<Example />);
    expect(screen.getByRole('list', { name: 'Approval order' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    const handle = screen.getByRole('button', { name: 'Reorder Legal review' });
    expect(handle).toHaveAccessibleDescription(/Space or Enter to pick up/);
  });

  it('reorders with the keyboard and announces each step', async () => {
    const onReorder = vi.fn();
    render(<Example onReorder={onReorder} />);
    const user = userEvent.setup();
    screen.getByRole('button', { name: 'Reorder Legal review' }).focus();
    await user.keyboard(' ');
    expect(screen.getByRole('status')).toHaveTextContent('Picked up Legal review, position 1 of 4');
    expect(screen.getByRole('button', { name: 'Reorder Legal review' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('status')).toHaveTextContent('Legal review moved to position 3 of 4');
    expect(order()).toEqual([
      'Finance approval',
      'Director sign-off',
      'Legal review',
      'Countersignature',
    ]);
    expect(onReorder).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Reorder Legal review' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onReorder).toHaveBeenCalledWith(['b', 'c', 'a', 'd'], { from: 0, to: 2 });
    expect(screen.getByRole('status')).toHaveTextContent('Dropped Legal review at position 3 of 4');
    expect(screen.getByRole('button', { name: 'Reorder Legal review' })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Reorder Legal review' })).not.toHaveAttribute(
      'aria-pressed',
    );
  });

  it('cancels with Escape and restores the order', async () => {
    const onReorder = vi.fn();
    render(<Example onReorder={onReorder} />);
    const user = userEvent.setup();
    screen.getByRole('button', { name: 'Reorder Director sign-off' }).focus();
    await user.keyboard('{Enter}{ArrowUp}{ArrowUp}');
    expect(order()[0]).toBe('Director sign-off');
    await user.keyboard('{Escape}');
    expect(order()).toEqual(initial.map((i) => i.name));
    expect(onReorder).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Cancelled. Director sign-off returned to its original position',
    );
  });

  it('jumps to the ends with Home and End and stops at the edges', async () => {
    const onReorder = vi.fn();
    render(<Example onReorder={onReorder} />);
    const user = userEvent.setup();
    screen.getByRole('button', { name: 'Reorder Finance approval' }).focus();
    await user.keyboard(' {End}{ArrowDown}');
    expect(order()[3]).toBe('Finance approval');
    await user.keyboard('{Home} ');
    expect(onReorder).toHaveBeenCalledWith(['b', 'a', 'c', 'd'], { from: 1, to: 0 });
  });

  it('offers Move up and Move down buttons as a non-drag alternative', async () => {
    const onReorder = vi.fn();
    render(<Example onReorder={onReorder} showMoveButtons />);
    expect(screen.getByRole('button', { name: 'Move Legal review up' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move Countersignature down' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Move Finance approval down' }));
    expect(onReorder).toHaveBeenCalledWith(['a', 'c', 'b', 'd'], { from: 1, to: 2 });
    expect(screen.getByRole('status')).toHaveTextContent(
      'Finance approval moved to position 3 of 4',
    );
  });

  it('reorders by dragging the handle with a pointer', () => {
    const onReorder = vi.fn();
    render(<Example onReorder={onReorder} />);
    const rows = screen.getAllByRole('listitem');
    rows.forEach((row, i) => {
      vi.spyOn(row, 'getBoundingClientRect').mockReturnValue({
        top: i * 50,
        height: 50,
        left: 0,
        width: 300,
        right: 300,
        bottom: i * 50 + 50,
        x: 0,
        y: i * 50,
        toJSON: () => ({}),
      });
    });
    const handle = screen.getByRole('button', { name: 'Reorder Legal review' });
    fireEvent.pointerDown(handle, { clientY: 25, pointerId: 1, button: 0 });
    fireEvent.pointerMove(handle, { clientY: 130, pointerId: 1 });
    expect(order()).toEqual([
      'Finance approval',
      'Director sign-off',
      'Legal review',
      'Countersignature',
    ]);
    fireEvent.pointerUp(screen.getByRole('button', { name: 'Reorder Legal review' }), {
      pointerId: 1,
    });
    expect(onReorder).toHaveBeenCalledWith(['b', 'c', 'a', 'd'], { from: 0, to: 2 });
    expect(screen.getByRole('status')).toHaveTextContent('Dropped Legal review at position 3 of 4');
  });

  it('exposes moveItem through its ref and does nothing when disabled', async () => {
    const onReorder = vi.fn();
    const handle = React.createRef<SortableListHandle>();
    const { unmount } = render(<Example onReorder={onReorder} handle={handle} />);
    act(() => handle.current!.moveItem(3, 0));
    expect(onReorder).toHaveBeenCalledWith(['d', 'a', 'b', 'c'], { from: 3, to: 0 });
    unmount();
    onReorder.mockClear();
    render(<Example onReorder={onReorder} disabled />);
    expect(screen.getByRole('button', { name: 'Reorder Legal review' })).toBeDisabled();
  });

  it('arrayMove is pure and clamps', () => {
    const list = [1, 2, 3];
    expect(arrayMove(list, 0, 2)).toEqual([2, 3, 1]);
    expect(arrayMove(list, 2, 99)).toEqual([1, 2, 3]);
    expect(list).toEqual([1, 2, 3]);
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <Example showMoveButtons />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from './ContextMenu';

function Example({
  onSelect = vi.fn(),
  disabled,
}: {
  onSelect?: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <ContextMenu disabled={disabled}>
      <ContextMenuTrigger tabIndex={0} aria-label="Signature canvas">
        Canvas
      </ContextMenuTrigger>
      <ContextMenuContent aria-label="Canvas actions">
        <ContextMenuItem onSelect={() => onSelect('copy')}>Copy block</ContextMenuItem>
        <ContextMenuItem onSelect={() => onSelect('paste')}>Paste</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem destructive onSelect={() => onSelect('remove')}>
          Remove block
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

describe('ContextMenu', () => {
  it('opens on right-click and prevents the browser menu', () => {
    render(<Example />);
    const evt = fireEvent.contextMenu(screen.getByText('Canvas'), { clientX: 40, clientY: 60 });
    expect(evt).toBe(false); // default prevented
    expect(screen.getByRole('menu', { name: 'Canvas actions' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Copy block' })).toHaveFocus();
  });

  it('opens with Shift+F10 and returns focus on Escape', async () => {
    render(<Example />);
    const user = userEvent.setup();
    await user.tab();
    const area = screen.getByText('Canvas');
    expect(area).toHaveFocus();
    await user.keyboard('{Shift>}{F10}{/Shift}');
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
    await waitFor(() => expect(area).toHaveFocus());
  });

  it('opens with the ContextMenu key and selects with keyboard', async () => {
    const onSelect = vi.fn();
    render(<Example onSelect={onSelect} />);
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard('{ContextMenu}');
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onSelect).toHaveBeenCalledWith('paste');
  });

  it('opens on long-press for touch and cancels when the finger moves', () => {
    vi.useFakeTimers();
    render(<Example />);
    const area = screen.getByText('Canvas');
    fireEvent.pointerDown(area, { pointerType: 'touch', clientX: 10, clientY: 10 });
    fireEvent.pointerMove(area, { pointerType: 'touch', clientX: 40, clientY: 40 });
    act(() => vi.advanceTimersByTime(600));
    expect(screen.queryByRole('menu')).toBeNull();
    fireEvent.pointerDown(area, { pointerType: 'touch', clientX: 10, clientY: 10 });
    act(() => vi.advanceTimersByTime(600));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('does nothing when disabled', () => {
    render(<Example disabled />);
    const evt = fireEvent.contextMenu(screen.getByText('Canvas'));
    expect(evt).toBe(true);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('has no axe violations when open', async () => {
    render(<Example />);
    fireEvent.contextMenu(screen.getByText('Canvas'));
    await expectNoA11yViolations(document.body);
  });
});

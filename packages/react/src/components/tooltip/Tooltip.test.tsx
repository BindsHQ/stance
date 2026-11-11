import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { Tooltip, TooltipProvider } from './Tooltip';

describe('Tooltip', () => {
  afterEach(() => vi.useRealTimers());

  it('opens on keyboard focus and links aria-describedby', async () => {
    render(
      <Tooltip content="Copy signature link">
        <button type="button">Copy</button>
      </Tooltip>,
    );
    await userEvent.tab();
    const tip = screen.getByRole('tooltip');
    expect(tip).toHaveTextContent('Copy signature link');
    expect(screen.getByRole('button', { name: 'Copy' })).toHaveAccessibleDescription(
      'Copy signature link',
    );
  });

  it('opens on hover after the delay and closes on leave', () => {
    vi.useFakeTimers();
    render(
      <Tooltip content="Archive" delay={300}>
        <button type="button">Archive</button>
      </Tooltip>,
    );
    const button = screen.getByRole('button');
    fireEvent.pointerEnter(button, { pointerType: 'mouse' });
    act(() => vi.advanceTimersByTime(299));
    expect(screen.queryByRole('tooltip')).toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.pointerLeave(button, { pointerType: 'mouse' });
    act(() => vi.advanceTimersByTime(150));
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('stays open while the tooltip itself is hovered', () => {
    vi.useFakeTimers();
    render(
      <Tooltip content="Details" delay={0}>
        <button type="button">Info</button>
      </Tooltip>,
    );
    const button = screen.getByRole('button');
    fireEvent.pointerEnter(button, { pointerType: 'mouse' });
    fireEvent.pointerLeave(button, { pointerType: 'mouse' });
    fireEvent.pointerEnter(screen.getByRole('tooltip'));
    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('ignores touch and respects disabled', () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <Tooltip content="Tip" delay={0}>
        <button type="button">Touch</button>
      </Tooltip>,
    );
    fireEvent.pointerEnter(screen.getByRole('button'), { pointerType: 'touch' });
    expect(screen.queryByRole('tooltip')).toBeNull();
    rerender(
      <Tooltip content="Tip" delay={0} disabled>
        <button type="button">Touch</button>
      </Tooltip>,
    );
    fireEvent.pointerEnter(screen.getByRole('button'), { pointerType: 'mouse' });
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('closes on Escape and keeps an existing aria-describedby', async () => {
    render(
      <TooltipProvider delay={0}>
        <p id="hint">Hint</p>
        <Tooltip content="Delete forever">
          <button type="button" aria-describedby="hint">
            Delete
          </button>
        </Tooltip>
      </TooltipProvider>,
    );
    await userEvent.tab();
    const button = screen.getByRole('button');
    expect(button.getAttribute('aria-describedby')).toMatch(/^hint .+tooltip$/);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(button).toHaveAttribute('aria-describedby', 'hint');
  });

  it('has no axe violations when open', async () => {
    render(
      <Tooltip content="Settings" defaultOpen>
        <button type="button" aria-label="Settings">
          ⚙
        </button>
      </Tooltip>,
    );
    await expectNoA11yViolations(document.body);
  });
});

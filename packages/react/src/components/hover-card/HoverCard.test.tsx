import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './HoverCard';

function Example() {
  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger href="/people/ada">Ada Lovelace</HoverCardTrigger>
      <HoverCardContent>
        <p>Head of Operations · 14 templates</p>
      </HoverCardContent>
    </HoverCard>
  );
}

describe('HoverCard', () => {
  afterEach(() => vi.useRealTimers());

  it('opens after the delay on hover and closes after leaving', () => {
    vi.useFakeTimers();
    render(<Example />);
    const link = screen.getByRole('link', { name: 'Ada Lovelace' });
    fireEvent.pointerEnter(link, { pointerType: 'mouse' });
    expect(screen.queryByText(/Head of Operations/)).toBeNull();
    act(() => vi.advanceTimersByTime(200));
    expect(screen.getByText(/Head of Operations/)).toBeInTheDocument();
    expect(link).toHaveAttribute('data-state', 'open');
    fireEvent.pointerLeave(link, { pointerType: 'mouse' });
    act(() => vi.advanceTimersByTime(100));
    expect(screen.queryByText(/Head of Operations/)).toBeNull();
  });

  it('opens on keyboard focus without trapping focus, closes on Escape', async () => {
    render(
      <>
        <Example />
        <button type="button">Next</button>
      </>,
    );
    const user = userEvent.setup();
    await user.tab();
    expect(await screen.findByText(/Head of Operations/)).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByText(/Head of Operations/)).toBeNull();
  });

  it('has no axe violations when open', async () => {
    render(
      <HoverCard defaultOpen>
        <HoverCardTrigger href="/x">Profile</HoverCardTrigger>
        <HoverCardContent>Preview</HoverCardContent>
      </HoverCard>,
    );
    await expectNoA11yViolations(document.body);
  });
});

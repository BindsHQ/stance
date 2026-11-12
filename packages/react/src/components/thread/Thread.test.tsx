import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { ScrollToLatest } from '../scroll-to-latest/ScrollToLatest';
import { Thread, useThread } from './Thread';

/** jsdom has no layout, so give the viewport a size and a content height we control. */
function layout(viewport: HTMLElement, metrics: { scrollHeight: number; clientHeight?: number }) {
  let top = 0;
  const state = { clientHeight: 200, ...metrics };
  Object.defineProperty(viewport, 'scrollHeight', {
    configurable: true,
    get: () => state.scrollHeight,
  });
  Object.defineProperty(viewport, 'clientHeight', {
    configurable: true,
    get: () => state.clientHeight,
  });
  Object.defineProperty(viewport, 'scrollTop', {
    configurable: true,
    get: () => top,
    set: (value: number) => {
      top = Math.max(0, Math.min(value, state.scrollHeight - state.clientHeight));
    },
  });
  return state;
}

const scrollTo = (viewport: HTMLElement, top: number) => {
  viewport.scrollTop = top;
  fireEvent.scroll(viewport);
};

function Messages({ count, prepend = 0 }: { count: number; prepend?: number }) {
  return (
    <>
      {Array.from({ length: prepend }, (_, i) => (
        <p key={`older-${i}`}>Older {i}</p>
      ))}
      {Array.from({ length: count }, (_, i) => (
        <p key={i}>Message {i}</p>
      ))}
    </>
  );
}

describe('Thread', () => {
  it('is a labelled, polite log whose viewport can be scrolled by keyboard', () => {
    render(
      <Thread label="Support chat" data-testid="root" className="custom">
        <p>Hello</p>
      </Thread>,
    );
    const log = screen.getByRole('log', { name: 'Support chat' });
    expect(log).toHaveAttribute('aria-live', 'polite');
    expect(log).toHaveAttribute('aria-relevant', 'additions');
    expect(log).toHaveAttribute('tabindex', '0');
    expect(screen.getByTestId('root')).toHaveClass('st-thread', 'custom');
    expect(screen.getByRole('log', { name: 'Support chat' })).toContainElement(
      screen.getByText('Hello'),
    );
  });

  it('defaults the label to Conversation and forwards refs', () => {
    const ref = React.createRef<HTMLDivElement>();
    const viewportRef = React.createRef<HTMLDivElement>();
    render(<Thread ref={ref} viewportRef={viewportRef} />);
    expect(screen.getByRole('log', { name: 'Conversation' })).toBe(viewportRef.current);
    expect(ref.current).toHaveClass('st-thread');
  });

  it('follows new content while the reader is at the bottom', async () => {
    const { rerender } = render(
      <Thread>
        <Messages count={2} />
      </Thread>,
    );
    const viewport = screen.getByRole('log');
    const state = layout(viewport, { scrollHeight: 600 });
    scrollTo(viewport, 400);
    state.scrollHeight = 900;
    rerender(
      <Thread>
        <Messages count={3} />
      </Thread>,
    );
    await waitFor(() => expect(viewport.scrollTop).toBe(700));
  });

  it('releases when the reader scrolls up and follows again at the bottom', async () => {
    const onAtBottomChange = vi.fn();
    const { rerender } = render(
      <Thread onAtBottomChange={onAtBottomChange} data-testid="root">
        <Messages count={2} />
      </Thread>,
    );
    const viewport = screen.getByRole('log');
    const state = layout(viewport, { scrollHeight: 600 });
    scrollTo(viewport, 400);
    expect(onAtBottomChange).not.toHaveBeenCalled();
    scrollTo(viewport, 150);
    expect(onAtBottomChange).toHaveBeenLastCalledWith(false);
    expect(screen.getByTestId('root')).not.toHaveAttribute('data-at-bottom');

    state.scrollHeight = 900;
    rerender(
      <Thread onAtBottomChange={onAtBottomChange} data-testid="root">
        <Messages count={3} />
      </Thread>,
    );
    await screen.findByText('Message 2');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(viewport.scrollTop).toBe(150);

    scrollTo(viewport, 700);
    expect(onAtBottomChange).toHaveBeenLastCalledWith(true);
    state.scrollHeight = 1200;
    rerender(
      <Thread onAtBottomChange={onAtBottomChange} data-testid="root">
        <Messages count={4} />
      </Thread>,
    );
    await waitFor(() => expect(viewport.scrollTop).toBe(1000));
    expect(onAtBottomChange).toHaveBeenCalledTimes(2);
  });

  it('does not follow when stickToBottom is off', async () => {
    const { rerender } = render(
      <Thread stickToBottom={false}>
        <Messages count={2} />
      </Thread>,
    );
    const viewport = screen.getByRole('log');
    const state = layout(viewport, { scrollHeight: 600 });
    scrollTo(viewport, 400);
    state.scrollHeight = 900;
    rerender(
      <Thread stickToBottom={false}>
        <Messages count={3} />
      </Thread>,
    );
    await screen.findByText('Message 2');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(viewport.scrollTop).toBe(400);
  });

  it('never moves focus when content arrives', async () => {
    const { rerender } = render(
      <>
        <button type="button">Composer</button>
        <Thread>
          <Messages count={1} />
        </Thread>
      </>,
    );
    const composer = screen.getByRole('button', { name: 'Composer' });
    composer.focus();
    const viewport = screen.getByRole('log');
    const state = layout(viewport, { scrollHeight: 300 });
    state.scrollHeight = 800;
    rerender(
      <>
        <button type="button">Composer</button>
        <Thread>
          <Messages count={5} />
        </Thread>
      </>,
    );
    await waitFor(() => expect(viewport.scrollTop).toBe(600));
    expect(composer).toHaveFocus();
  });

  it('calls onReachTop once per arrival at the top', () => {
    const onReachTop = vi.fn();
    render(
      <Thread onReachTop={onReachTop}>
        <Messages count={3} />
      </Thread>,
    );
    const viewport = screen.getByRole('log');
    layout(viewport, { scrollHeight: 1000 });
    scrollTo(viewport, 800);
    expect(onReachTop).not.toHaveBeenCalled();
    scrollTo(viewport, 0);
    scrollTo(viewport, 0);
    expect(onReachTop).toHaveBeenCalledTimes(1);
    scrollTo(viewport, 300);
    scrollTo(viewport, 0);
    expect(onReachTop).toHaveBeenCalledTimes(2);
  });

  it('keeps the reading position when older messages are added above', async () => {
    const { rerender } = render(
      <Thread>
        <Messages count={3} />
      </Thread>,
    );
    const viewport = screen.getByRole('log');
    const state = layout(viewport, { scrollHeight: 1000 });
    // Let the observer record the starting height before the reader scrolls away.
    rerender(
      <Thread>
        <Messages count={4} />
      </Thread>,
    );
    await waitFor(() => expect(viewport.scrollTop).toBe(800));
    scrollTo(viewport, 0);
    state.scrollHeight = 1400;
    rerender(
      <Thread>
        <Messages count={4} prepend={2} />
      </Thread>,
    );
    await waitFor(() => expect(viewport.scrollTop).toBe(400));
  });

  it('shows ScrollToLatest when scrolled away, and pressing it returns to the newest message', async () => {
    const user = userEvent.setup();
    render(
      <Thread scrollToLatest={<ScrollToLatest />}>
        <Messages count={3} />
      </Thread>,
    );
    const viewport = screen.getByRole('log');
    layout(viewport, { scrollHeight: 1000 });
    scrollTo(viewport, 800);
    expect(screen.queryByRole('button', { name: 'Scroll to latest' })).toBeNull();
    scrollTo(viewport, 100);
    const button = screen.getByRole('button', { name: 'Scroll to latest' });
    // The button sits outside the log, so its arrival is not read out as a new message.
    expect(viewport).not.toContainElement(button);
    viewport.scrollTo = vi.fn(({ top }: ScrollToOptions) => {
      viewport.scrollTop = top ?? 0;
    }) as unknown as typeof viewport.scrollTo;
    await user.click(button);
    expect(viewport.scrollTop).toBe(800);
    expect(screen.queryByRole('button', { name: 'Scroll to latest' })).toBeNull();
  });

  it('exposes its state through useThread, which throws outside a Thread', async () => {
    function Probe() {
      const thread = useThread();
      return (
        <button type="button" onClick={() => thread.scrollToLatest()}>
          {thread.atBottom ? 'at bottom' : 'away'}
        </button>
      );
    }
    render(<Thread scrollToLatest={<Probe />} />);
    const viewport = screen.getByRole('log');
    layout(viewport, { scrollHeight: 1000 });
    scrollTo(viewport, 800);
    scrollTo(viewport, 100);
    const probe = screen.getByRole('button', { name: 'away' });
    await userEvent.click(probe);
    expect(viewport.scrollTop).toBe(800);
    expect(probe).toHaveTextContent('at bottom');

    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/within <Thread>/);
    error.mockRestore();
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <Thread scrollToLatest={<ScrollToLatest visible unreadCount={2} />}>
          <Messages count={2} />
        </Thread>
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

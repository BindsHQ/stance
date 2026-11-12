import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { MessageActions, type MessageRating } from './MessageActions';

describe('MessageActions', () => {
  it('is a labelled toolbar that only shows the actions it was given handlers for', () => {
    const { rerender } = render(<MessageActions onCopy={() => {}} onRetry={() => {}} />);
    const toolbar = screen.getByRole('toolbar', { name: 'Message actions' });
    expect(toolbar).toHaveAttribute('data-visibility', 'always');
    expect(screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual([
      'Copy',
      'Try again',
    ]);
    rerender(
      <MessageActions
        onCopy={() => {}}
        onRetry={() => {}}
        onEdit={() => {}}
        onRate={() => {}}
        visibility="hover"
      />,
    );
    expect(screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual([
      'Copy',
      'Try again',
      'Edit',
      'Good response',
      'Bad response',
    ]);
    expect(toolbar).toHaveAttribute('data-visibility', 'hover');
  });

  it('calls retry and edit handlers', async () => {
    const onRetry = vi.fn();
    const onEdit = vi.fn();
    render(<MessageActions onRetry={onRetry} onEdit={onEdit} />);
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('copies the value, confirms politely, then resets', async () => {
    const user = userEvent.setup();
    const onCopy = vi.fn();
    render(<MessageActions copyValue={() => 'The answer'} onCopy={onCopy} />);
    await user.click(screen.getByRole('button', { name: 'Copy' }));
    expect(await navigator.clipboard.readText()).toBe('The answer');
    expect(onCopy).toHaveBeenCalledTimes(1);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveTextContent('Copied');
    expect(screen.getByRole('button', { name: 'Copied' })).toHaveAttribute('data-copied');
    vi.useFakeTimers();
    try {
      // The timer was started with real timers; a second copy under fake timers proves the reset.
      await act(async () => {
        screen.getByRole('button', { name: 'Copied' }).click();
        await Promise.resolve();
        await Promise.resolve();
      });
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('toggles ratings when uncontrolled: pressing the active one clears it', async () => {
    const onRate = vi.fn();
    render(<MessageActions onRate={onRate} />);
    const up = screen.getByRole('button', { name: 'Good response' });
    const down = screen.getByRole('button', { name: 'Bad response' });
    expect(up).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(up);
    expect(onRate).toHaveBeenLastCalledWith('up');
    expect(up).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(down);
    expect(onRate).toHaveBeenLastCalledWith('down');
    expect(up).toHaveAttribute('aria-pressed', 'false');
    expect(down).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(down);
    expect(onRate).toHaveBeenLastCalledWith(null);
    expect(down).toHaveAttribute('aria-pressed', 'false');
  });

  it('respects a controlled rating and a default rating', async () => {
    const onRate = vi.fn();
    const { rerender } = render(<MessageActions rating="up" onRate={onRate} />);
    const up = screen.getByRole('button', { name: 'Good response' });
    await userEvent.click(up);
    expect(onRate).toHaveBeenCalledWith(null);
    // Controlled: nothing changes until the parent passes the new value.
    expect(up).toHaveAttribute('aria-pressed', 'true');
    rerender(<MessageActions rating={null} onRate={onRate} />);
    expect(up).toHaveAttribute('aria-pressed', 'false');

    function Controlled() {
      const [rating, setRating] = React.useState<MessageRating>(null);
      return <MessageActions rating={rating} onRate={setRating} labels={{ rateDown: 'Poor' }} />;
    }
    rerender(<Controlled />);
    await userEvent.click(screen.getByRole('button', { name: 'Poor' }));
    expect(screen.getByRole('button', { name: 'Poor' })).toHaveAttribute('aria-pressed', 'true');

    rerender(<MessageActions key="d" defaultRating="down" onRate={onRate} />);
    expect(screen.getByRole('button', { name: 'Bad response' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('is one tab stop; arrow keys, Home and End move between buttons, extras included', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Before</button>
        <MessageActions onCopy={() => {}} onRetry={() => {}} onRate={() => {}}>
          <button type="button">Report</button>
        </MessageActions>
        <button type="button">After</button>
      </>,
    );
    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Copy' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Try again' })).toHaveFocus();
    await user.keyboard('{End}');
    expect(screen.getByRole('button', { name: 'Report' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Copy' })).toHaveFocus();
    await user.keyboard('{ArrowLeft}{Home}{ArrowRight}{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Good response' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });

  it('flips the arrow keys in right to left text', async () => {
    const user = userEvent.setup();
    render(
      <div dir="rtl">
        <MessageActions onCopy={() => {}} onRetry={() => {}} />
      </div>,
    );
    await user.tab();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('button', { name: 'Try again' })).toHaveFocus();
  });

  it('forwards the ref, className and other props', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<MessageActions ref={ref} onRetry={() => {}} className="custom" id="actions" />);
    expect(ref.current).toBe(screen.getByRole('toolbar'));
    expect(ref.current).toHaveClass('st-message-actions', 'custom');
    expect(ref.current).toHaveAttribute('id', 'actions');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <MessageActions
          onCopy={() => {}}
          onRetry={() => {}}
          onEdit={() => {}}
          onRate={() => {}}
          defaultRating="up"
        />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

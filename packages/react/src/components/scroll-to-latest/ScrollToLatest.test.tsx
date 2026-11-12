import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { ThreadContext } from '../thread/Thread';
import { ScrollToLatest } from './ScrollToLatest';

describe('ScrollToLatest', () => {
  it('renders a visible, labelled button by default and calls onClick', async () => {
    const onClick = vi.fn();
    render(<ScrollToLatest onClick={onClick} className="custom" data-testid="b" />);
    const button = screen.getByRole('button', { name: 'Scroll to latest' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('st-scroll-to-latest', 'custom');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is hidden from everyone when not visible', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<ScrollToLatest ref={ref} visible={false} />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(ref.current).toHaveAttribute('hidden');
  });

  it('puts the unread count in the accessible name and shows it', () => {
    const { rerender } = render(<ScrollToLatest unreadCount={3} />);
    const button = screen.getByRole('button', { name: 'Scroll to latest, 3 new messages' });
    expect(button).toHaveTextContent('3');
    expect(button).toHaveAttribute('data-unread');
    rerender(<ScrollToLatest unreadCount={1} />);
    expect(screen.getByRole('button', { name: 'Scroll to latest, 1 new message' })).toBeVisible();
    rerender(<ScrollToLatest unreadCount={250} />);
    expect(screen.getByRole('button')).toHaveTextContent('99+');
    rerender(<ScrollToLatest unreadCount={0} />);
    expect(screen.getByRole('button', { name: 'Scroll to latest' })).not.toHaveAttribute(
      'data-unread',
    );
  });

  it('accepts translated labels and can show the label as text', () => {
    render(
      <ScrollToLatest
        label="Zum Neuesten"
        unreadLabel={(count) => `${count} neue Nachrichten`}
        unreadCount={4}
        showLabel
      />,
    );
    const button = screen.getByRole('button', { name: 'Zum Neuesten, 4 neue Nachrichten' });
    expect(button).toHaveTextContent('Zum Neuesten');
    expect(button).not.toHaveAttribute('title');
  });

  it('follows the surrounding Thread: visible when away, scrolls on press', async () => {
    const scrollToLatest = vi.fn();
    const { rerender } = render(
      <ThreadContext.Provider value={{ atBottom: true, scrollToLatest }}>
        <ScrollToLatest />
      </ThreadContext.Provider>,
    );
    expect(screen.queryByRole('button')).toBeNull();
    rerender(
      <ThreadContext.Provider value={{ atBottom: false, scrollToLatest }}>
        <ScrollToLatest />
      </ThreadContext.Provider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Scroll to latest' }));
    expect(scrollToLatest).toHaveBeenCalledWith('smooth');
  });

  it('scrolls without animation under reduced motion, and lets onClick cancel the scroll', async () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener() {},
      removeEventListener() {},
    })) as unknown as typeof window.matchMedia;
    const scrollToLatest = vi.fn();
    const { rerender } = render(
      <ThreadContext.Provider value={{ atBottom: false, scrollToLatest }}>
        <ScrollToLatest />
      </ThreadContext.Provider>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(scrollToLatest).toHaveBeenLastCalledWith('auto');
    rerender(
      <ThreadContext.Provider value={{ atBottom: false, scrollToLatest }}>
        <ScrollToLatest onClick={(event) => event.preventDefault()} />
      </ThreadContext.Provider>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(scrollToLatest).toHaveBeenCalledTimes(1);
    window.matchMedia = original;
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <ScrollToLatest />
        <ScrollToLatest unreadCount={5} showLabel />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

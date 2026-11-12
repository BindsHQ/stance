import { act, render, screen } from '@testing-library/react';
import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { StreamingText } from './StreamingText';

const tick = (ms = 24) => act(() => void vi.advanceTimersByTime(ms));
const shown = () => screen.getByTestId('t').querySelector('.st-streaming-text__text')!;
/** Visible text without the invisible space holder for the word being typed. */
const visible = () => {
  const clone = shown().cloneNode(true) as HTMLElement;
  clone.querySelector('.st-streaming-text__ghost')?.remove();
  return clone.textContent;
};

function mockReducedMotion() {
  return vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        matches: query.includes('reduce'),
        media: query,
        addEventListener() {},
        removeEventListener() {},
      }) as unknown as MediaQueryList,
  );
}

describe('StreamingText', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('shows complete text at once when it is not streaming', () => {
    render(<StreamingText data-testid="t" text="The term ends in June." />);
    const root = screen.getByTestId('t');
    expect(root).toHaveTextContent('The term ends in June.');
    expect(root).toHaveAttribute('data-state', 'complete');
    expect(root).not.toHaveAttribute('aria-busy');
    expect(shown()).not.toHaveAttribute('aria-hidden');
  });

  it('reveals one word per tick at the stream cadence', () => {
    render(<StreamingText data-testid="t" text="One two three" streaming />);
    expect(visible()).toBe('');
    tick();
    expect(visible()).toBe('One');
    tick();
    expect(visible()).toBe('One two');
    tick();
    expect(visible()).toBe('One two three');
  });

  it('reveals one character per tick and reserves the rest of the word', () => {
    render(<StreamingText data-testid="t" text="Hello you" streaming cadence="char" />);
    tick();
    expect(visible()).toBe('H');
    expect(shown().querySelector('.st-streaming-text__ghost')).toHaveTextContent('ello');
    tick(24 * 4);
    expect(visible()).toBe('Hello');
    expect(shown().querySelector('.st-streaming-text__ghost')).toBeNull();
  });

  it('honours a custom interval', () => {
    render(<StreamingText data-testid="t" text="One two" streaming interval={100} />);
    tick(99);
    expect(visible()).toBe('');
    tick(1);
    expect(visible()).toBe('One');
  });

  it('keeps revealed text in place when text grows', () => {
    const { rerender } = render(<StreamingText data-testid="t" text="One two" streaming />);
    tick(48);
    expect(visible()).toBe('One two');
    rerender(<StreamingText data-testid="t" text="One two three four" streaming />);
    expect(visible()).toBe('One two');
    tick();
    expect(visible()).toBe('One two three');
  });

  it('restarts from the matching part when text is replaced', () => {
    const { rerender } = render(<StreamingText data-testid="t" text="One two three" streaming />);
    tick(72);
    expect(visible()).toBe('One two three');
    rerender(<StreamingText data-testid="t" text="One apple pie" streaming />);
    expect(visible()).toBe('One ');
    tick();
    expect(visible()).toBe('One apple');
    rerender(<StreamingText data-testid="t" text="Fresh start" streaming />);
    expect(visible()).toBe('');
  });

  it('hides partial text from assistive technology and exposes it when complete', () => {
    const { rerender } = render(<StreamingText data-testid="t" text="One two" streaming />);
    const root = screen.getByTestId('t');
    expect(root).toHaveAttribute('aria-busy', 'true');
    expect(root).toHaveAttribute('data-state', 'streaming');
    expect(shown()).toHaveAttribute('aria-hidden', 'true');
    tick(48);
    expect(root).toHaveAttribute('aria-busy', 'true');
    rerender(<StreamingText data-testid="t" text="One two" />);
    expect(root).not.toHaveAttribute('aria-busy');
    expect(shown()).not.toHaveAttribute('aria-hidden');
  });

  it('calls onRevealEnd once, after the stream ends and the text is fully shown', () => {
    const onRevealEnd = vi.fn();
    const { rerender } = render(
      <StreamingText text="One two three" streaming onRevealEnd={onRevealEnd} />,
    );
    tick();
    rerender(<StreamingText text="One two three" onRevealEnd={onRevealEnd} />);
    expect(onRevealEnd).not.toHaveBeenCalled();
    tick(48);
    expect(onRevealEnd).toHaveBeenCalledTimes(1);
    tick(240);
    rerender(<StreamingText text="One two three" onRevealEnd={onRevealEnd} />);
    expect(onRevealEnd).toHaveBeenCalledTimes(1);
  });

  it('does not call onRevealEnd for text that was complete on mount', () => {
    const onRevealEnd = vi.fn();
    render(<StreamingText text="Done" onRevealEnd={onRevealEnd} />);
    tick(100);
    expect(onRevealEnd).not.toHaveBeenCalled();
  });

  it('shows the caret only while streaming or revealing', () => {
    const { rerender, container } = render(<StreamingText text="One two" streaming caret />);
    expect(container.querySelector('.st-streaming-text__caret')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    rerender(<StreamingText text="One two" caret />);
    expect(container.querySelector('.st-streaming-text__caret')).not.toBeNull();
    tick(48);
    expect(container.querySelector('.st-streaming-text__caret')).toBeNull();
  });

  it('shows text instantly with cadence instant', () => {
    const { rerender } = render(
      <StreamingText data-testid="t" text="One" streaming cadence="instant" />,
    );
    expect(visible()).toBe('One');
    rerender(<StreamingText data-testid="t" text="One two three" streaming cadence="instant" />);
    expect(visible()).toBe('One two three');
  });

  it('shows text instantly with reduced motion and still reports the end', () => {
    mockReducedMotion();
    const onRevealEnd = vi.fn();
    const { rerender } = render(
      <StreamingText data-testid="t" text="One two" streaming onRevealEnd={onRevealEnd} />,
    );
    expect(visible()).toBe('One two');
    rerender(
      <StreamingText data-testid="t" text="One two three" streaming onRevealEnd={onRevealEnd} />,
    );
    expect(visible()).toBe('One two three');
    rerender(<StreamingText data-testid="t" text="One two three" onRevealEnd={onRevealEnd} />);
    expect(onRevealEnd).toHaveBeenCalledTimes(1);
  });

  it('never splits a surrogate pair', () => {
    render(<StreamingText data-testid="t" text="😀a" streaming cadence="char" />);
    tick();
    expect(visible()).toBe('😀');
  });

  it('renders the chosen element, forwards the ref and passes props through', () => {
    const ref = React.createRef<HTMLElement>();
    render(<StreamingText ref={ref} as="p" className="mine" id="answer" text="Hello" />);
    expect(ref.current?.tagName).toBe('P');
    expect(ref.current).toHaveClass('st-streaming-text', 'mine');
    expect(ref.current).toHaveAttribute('id', 'answer');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    vi.useRealTimers();
    const { container } = render(
      <div data-theme={theme}>
        <StreamingText as="p" text="Complete answer." />
        <StreamingText as="p" text="Partial answer" streaming caret />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

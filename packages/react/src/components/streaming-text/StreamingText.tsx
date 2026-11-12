'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useComposedRefs } from '../../internal/refs.js';
import { usePrefersReducedMotion } from '../../internal/use-reduced-motion.js';

export type StreamingCadence = 'char' | 'word' | 'instant';

export interface StreamingTextProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  /** The full text so far. Pass the growing string as it arrives. */
  text: string;
  /** True while more text is expected. Default false. */
  streaming?: boolean;
  /** How text is revealed: one character, one word, or all at once. Default `word`. */
  cadence?: StreamingCadence;
  /** Show a caret after the text while it is streaming or being revealed. Default false. */
  caret?: boolean;
  /** Called once when the stream has ended and all text is on screen. */
  onRevealEnd?: () => void;
  /** The element to render. Default `span`. */
  as?: React.ElementType;
  /** Milliseconds per revealed chunk. Default: the `--st-duration-stream` token (24ms). */
  interval?: number;
}

const FALLBACK_INTERVAL = 24;
const isSpace = (ch: string | undefined) => ch !== undefined && /\s/.test(ch);

/** Reads the stream cadence token from CSS so themes can tune it. */
function readInterval(element: Element | null): number {
  if (!element || typeof window === 'undefined') return FALLBACK_INTERVAL;
  const raw = window.getComputedStyle(element).getPropertyValue('--st-duration-stream').trim();
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value) || value <= 0) return FALLBACK_INTERVAL;
  return /\d\s*s$/.test(raw) && !raw.endsWith('ms') ? value * 1000 : value;
}

function commonPrefixLength(a: string, b: string): number {
  const max = Math.min(a.length, b.length);
  let i = 0;
  while (i < max && a[i] === b[i]) i++;
  return i;
}

function wordEnd(text: string, from: number): number {
  let i = from;
  while (i < text.length && !isSpace(text[i])) i++;
  return i;
}

/** The next reveal position. A long backlog is drained faster so the reveal never falls far behind. */
function nextStop(text: string, from: number, cadence: StreamingCadence): number {
  if (cadence === 'word') {
    let i = from;
    while (i < text.length && isSpace(text[i])) i++;
    return wordEnd(text, i);
  }
  let stop = Math.min(text.length, from + 1 + Math.floor((text.length - from) / 160));
  // Never split a surrogate pair.
  const code = text.charCodeAt(stop - 1);
  if (code >= 0xd800 && code <= 0xdbff && stop < text.length) stop += 1;
  return stop;
}

/**
 * Reveals text at a steady cadence as it arrives. Text that is already on screen is
 * never animated again when `text` grows, and a replaced `text` restarts from the part
 * that still matches. Assistive technology gets the text once it is complete.
 */
export const StreamingText = React.forwardRef<HTMLElement, StreamingTextProps>(
  function StreamingText(
    {
      text,
      streaming = false,
      cadence = 'word',
      caret = false,
      onRevealEnd,
      as: Comp = 'span',
      interval,
      className,
      ...props
    },
    forwardedRef,
  ) {
    const reducedMotion = usePrefersReducedMotion();
    const animate = cadence !== 'instant' && !reducedMotion;
    const rootRef = React.useRef<HTMLElement | null>(null);
    const ref = useComposedRefs(forwardedRef, rootRef);

    // Text that is complete when it mounts is shown at once; only arriving text is revealed.
    const [shown, setShown] = React.useState(() => ({
      text,
      count: streaming && animate ? 0 : text.length,
    }));
    if (shown.text !== text) {
      // Grown text keeps its revealed part. Replaced text keeps only what still matches.
      const kept = commonPrefixLength(shown.text.slice(0, shown.count), text);
      setShown({ text, count: animate ? kept : text.length });
    }
    const count = animate ? Math.min(shown.count, text.length) : text.length;
    const pending = count < text.length;

    React.useEffect(() => {
      if (!pending) return;
      const ms = interval ?? readInterval(rootRef.current);
      const timer = window.setInterval(() => {
        setShown((state) =>
          state.count >= state.text.length
            ? state
            : { text: state.text, count: nextStop(state.text, state.count, cadence) },
        );
      }, ms);
      return () => window.clearInterval(timer);
    }, [pending, interval, cadence]);

    const done = !streaming && !pending;
    const wasDone = React.useRef(done);
    const onRevealEndRef = React.useRef(onRevealEnd);
    React.useEffect(() => {
      onRevealEndRef.current = onRevealEnd;
    });
    React.useEffect(() => {
      if (done && !wasDone.current) onRevealEndRef.current?.();
      wasDone.current = done;
    }, [done]);

    const busy = !done;
    // The rest of the word being typed takes up its space already, so a word never
    // jumps to the next line half way through.
    const ghost = cadence === 'char' && pending ? text.slice(count, wordEnd(text, count)) : '';

    return (
      <Comp
        ref={ref}
        className={cx('st-streaming-text', className)}
        data-state={busy ? 'streaming' : 'complete'}
        data-cadence={cadence}
        aria-busy={busy || undefined}
        {...props}
      >
        <span className="st-streaming-text__text" aria-hidden={busy || undefined}>
          {text.slice(0, count)}
          {ghost && <span className="st-streaming-text__ghost">{ghost}</span>}
        </span>
        {caret && busy && <span className="st-streaming-text__caret" aria-hidden="true" />}
      </Comp>
    );
  },
);

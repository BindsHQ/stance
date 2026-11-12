'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useComposedRefs } from '../../internal/refs.js';
import { useIsomorphicLayoutEffect } from '../../internal/use-isomorphic-layout-effect.js';

export interface ThreadContextValue {
  /** True while the reader is at the newest message. */
  atBottom: boolean;
  /** Scrolls to the newest message and resumes following new content. */
  scrollToLatest: (behavior?: ScrollBehavior) => void;
}

/** Context shared with parts rendered inside a Thread, such as ScrollToLatest. */
export const ThreadContext = React.createContext<ThreadContextValue | null>(null);
ThreadContext.displayName = 'ThreadContext';

/** Reads the nearest Thread: whether the reader is at the bottom, and a way to go there. */
export function useThread(): ThreadContextValue {
  const ctx = React.useContext(ThreadContext);
  if (ctx === null) throw new Error('useThread must be used within <Thread>.');
  return ctx;
}

export interface ThreadProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The messages, oldest first. */
  children?: React.ReactNode;
  /**
   * Follow new content while the reader is at the bottom. Scrolling up releases the
   * thread; returning to the bottom follows again. Default true.
   */
  stickToBottom?: boolean;
  /** Called once each time the reader reaches the top, to load older messages. */
  onReachTop?: () => void;
  /** Accessible name of the log region. Default "Conversation". */
  label?: string;
  /** Slot for a ScrollToLatest button. It floats over the bottom edge, outside the log. */
  scrollToLatest?: React.ReactNode;
  /** Called when the reader arrives at or leaves the newest message. */
  onAtBottomChange?: (atBottom: boolean) => void;
  /** Distance from the bottom, in px, that still counts as being at the bottom. Default 24. */
  bottomThreshold?: number;
  /** Ref to the scrolling viewport element. */
  viewportRef?: React.Ref<HTMLDivElement>;
}

/**
 * The scrolling container for a conversation. It follows new content only while the
 * reader is at the bottom, releases as soon as they scroll up, and never moves focus.
 */
export const Thread = React.forwardRef<HTMLDivElement, ThreadProps>(function Thread(
  {
    children,
    stickToBottom = true,
    onReachTop,
    label = 'Conversation',
    scrollToLatest: scrollToLatestSlot,
    onAtBottomChange,
    bottomThreshold = 24,
    viewportRef: viewportRefProp,
    className,
    ...props
  },
  ref,
) {
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const composedViewport = useComposedRefs(viewportRefProp, viewportRef);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottomState] = React.useState(true);
  const atBottomRef = React.useRef(true);
  // Whether new content should pull the viewport down. Starts true so a thread opens at the end.
  const stuckRef = React.useRef(true);
  const lastTopRef = React.useRef(0);
  const lastHeightRef = React.useRef(0);
  const firstChildRef = React.useRef<Element | null>(null);
  const atTopRef = React.useRef(false);
  const onAtBottomChangeRef = React.useRef(onAtBottomChange);
  onAtBottomChangeRef.current = onAtBottomChange;
  const onReachTopRef = React.useRef(onReachTop);
  onReachTopRef.current = onReachTop;
  const stickRef = React.useRef(stickToBottom);
  stickRef.current = stickToBottom;
  const thresholdRef = React.useRef(bottomThreshold);
  thresholdRef.current = bottomThreshold;

  const setAtBottom = React.useCallback((next: boolean) => {
    if (atBottomRef.current === next) return;
    atBottomRef.current = next;
    setAtBottomState(next);
    onAtBottomChangeRef.current?.(next);
  }, []);

  const measure = React.useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return true;
    return (
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <= thresholdRef.current
    );
  }, []);

  const scrollToLatest = React.useCallback(
    (behavior: ScrollBehavior = 'auto') => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      stuckRef.current = true;
      if (behavior !== 'auto' && typeof viewport.scrollTo === 'function') {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior });
      } else {
        viewport.scrollTop = viewport.scrollHeight;
      }
      lastTopRef.current = viewport.scrollTop;
      setAtBottom(true);
    },
    [setAtBottom],
  );

  // Content changed size: follow it when stuck, keep the reading position otherwise.
  const onContentChange = React.useCallback(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;
    const first = content.firstElementChild;
    const previousFirst = firstChildRef.current;
    const height = viewport.scrollHeight;
    if (stickRef.current && stuckRef.current) {
      viewport.scrollTop = height;
      lastTopRef.current = viewport.scrollTop;
      setAtBottom(true);
    } else {
      // Older messages were added above: hold the message the reader was looking at in place.
      if (
        previousFirst &&
        first !== previousFirst &&
        previousFirst.isConnected &&
        height > lastHeightRef.current
      ) {
        viewport.scrollTop += height - lastHeightRef.current;
        lastTopRef.current = viewport.scrollTop;
      }
      setAtBottom(measure());
    }
    firstChildRef.current = first;
    lastHeightRef.current = viewport.scrollHeight;
  }, [measure, setAtBottom]);

  useIsomorphicLayoutEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;
    onContentChange();
    const mutation =
      typeof MutationObserver !== 'undefined' ? new MutationObserver(onContentChange) : null;
    mutation?.observe(content, { childList: true, subtree: true, characterData: true });
    const resize =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onContentChange) : null;
    resize?.observe(content);
    resize?.observe(viewport);
    return () => {
      mutation?.disconnect();
      resize?.disconnect();
    };
  }, [onContentChange]);

  const onScroll = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const top = viewport.scrollTop;
    const bottom = measure();
    // Only an upward move releases the thread, so content growth and smooth scrolling keep it.
    if (bottom) stuckRef.current = true;
    else if (top < lastTopRef.current) stuckRef.current = false;
    lastTopRef.current = top;
    setAtBottom(bottom);
    if (top <= 0) {
      if (!atTopRef.current) {
        atTopRef.current = true;
        onReachTopRef.current?.();
      }
    } else if (top > thresholdRef.current) {
      atTopRef.current = false;
    }
  };

  const context = React.useMemo(() => ({ atBottom, scrollToLatest }), [atBottom, scrollToLatest]);

  return (
    <ThreadContext.Provider value={context}>
      <div
        ref={ref}
        className={cx('st-thread', className)}
        data-at-bottom={atBottom ? '' : undefined}
        {...props}
      >
        <div
          ref={composedViewport}
          className="st-thread__viewport"
          role="log"
          aria-label={label}
          aria-live="polite"
          aria-relevant="additions"
          tabIndex={0}
          onScroll={onScroll}
        >
          <div ref={contentRef} className="st-thread__content">
            {children}
          </div>
        </div>
        {scrollToLatestSlot != null && (
          <div className="st-thread__scroll-to-latest">{scrollToLatestSlot}</div>
        )}
      </div>
    </ThreadContext.Provider>
  );
});

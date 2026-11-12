'use client';
import * as React from 'react';
import {
  computePosition,
  type Align,
  type PositionOptions,
  type PositionResult,
  type Side,
} from './position.js';
import { isRtl } from './direction.js';
import { useIsomorphicLayoutEffect } from './use-isomorphic-layout-effect.js';

export interface FloatingOptions extends Partial<PositionOptions> {
  open: boolean;
  /** Match the floating element's min-width to the anchor (selects, comboboxes). */
  matchAnchorWidth?: boolean;
  /** Treat `left` and `right` as inline start and end, swapping them in RTL (submenus). */
  mirrorSideInRtl?: boolean;
}

export interface FloatingPositioningProps {
  side?: Side;
  align?: Align;
  sideOffset?: number;
  alignOffset?: number;
  collisionPadding?: number;
  avoidCollisions?: boolean;
}

/**
 * Positions `floatingRef` next to `anchorRef` using fixed positioning and keeps it
 * attached on scroll, resize and size changes. No third-party positioning engine.
 */
export function useFloating(
  anchorRef: React.RefObject<Element | null>,
  floatingRef: React.RefObject<HTMLElement | null>,
  options: FloatingOptions,
) {
  const {
    open,
    side = 'bottom',
    align = 'start',
    sideOffset = 6,
    alignOffset = 0,
    collisionPadding = 8,
    avoidCollisions = true,
    matchAnchorWidth = false,
    mirrorSideInRtl = false,
  } = options;
  const [result, setResult] = React.useState<PositionResult | null>(null);

  const update = React.useCallback(() => {
    const anchor = anchorRef.current;
    const floating = floatingRef.current;
    if (!anchor || !floating) return;
    const a = anchor.getBoundingClientRect();
    if (matchAnchorWidth) floating.style.minWidth = `${a.width}px`;
    const f = floating.getBoundingClientRect();
    const rtl = isRtl(anchor);
    const flipped: Side =
      rtl && mirrorSideInRtl && side === 'left'
        ? 'right'
        : rtl && mirrorSideInRtl && side === 'right'
          ? 'left'
          : side;
    const next = computePosition(
      { x: a.left, y: a.top, width: a.width, height: a.height },
      { width: f.width, height: f.height },
      { width: window.innerWidth, height: window.innerHeight },
      { side: flipped, align, sideOffset, alignOffset, collisionPadding, avoidCollisions, rtl },
    );
    setResult((prev) =>
      prev &&
      prev.x === next.x &&
      prev.y === next.y &&
      prev.side === next.side &&
      prev.availableHeight === next.availableHeight
        ? prev
        : next,
    );
  }, [
    anchorRef,
    floatingRef,
    side,
    align,
    sideOffset,
    alignOffset,
    collisionPadding,
    avoidCollisions,
    matchAnchorWidth,
    mirrorSideInRtl,
  ]);

  useIsomorphicLayoutEffect(() => {
    if (!open) {
      setResult(null);
      return;
    }
    let frame = 0;
    let tries = 0;
    // The floating element may mount a tick after `open` flips (portals); retry briefly.
    const first = () => {
      if (!floatingRef.current && tries++ < 10) {
        frame = requestAnimationFrame(first);
        return;
      }
      update();
    };
    first();
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    if (anchorRef.current) ro?.observe(anchorRef.current);
    if (floatingRef.current) ro?.observe(floatingRef.current);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
      ro?.disconnect();
    };
  }, [open, update]);

  const style: React.CSSProperties = {
    position: 'fixed',
    // Physical on purpose: x and y are viewport coordinates computed in JS.
    left: 0,
    top: 0,
    transform: result
      ? `translate3d(${result.x}px, ${result.y}px, 0)`
      : 'translate3d(0, -200vh, 0)',
    opacity: result ? undefined : 0,
    pointerEvents: result ? undefined : 'none',
    ['--st-available-height' as string]: result ? `${result.availableHeight}px` : undefined,
    ['--st-available-width' as string]: result ? `${result.availableWidth}px` : undefined,
    ['--st-arrow-offset' as string]: result ? `${result.arrowOffset}px` : undefined,
  };
  return { style, side: result?.side ?? side, align, update, placed: result !== null };
}

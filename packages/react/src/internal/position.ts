export type Side = 'top' | 'right' | 'bottom' | 'left';
export type Align = 'start' | 'center' | 'end';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PositionOptions {
  side: Side;
  align: Align;
  sideOffset: number;
  alignOffset: number;
  /** Minimum distance from the viewport edge. */
  collisionPadding: number;
  /** Flip to the opposite side when there is not enough room. */
  avoidCollisions: boolean;
}

export interface PositionResult {
  x: number;
  y: number;
  side: Side;
  align: Align;
  /** Space available on the placed side, for max-height / max-width. */
  availableWidth: number;
  availableHeight: number;
  /** Offset of the anchor centre along the floating element, for arrows. */
  arrowOffset: number;
}

const opposite: Record<Side, Side> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };

function place(anchor: Rect, floating: { width: number; height: number }, side: Side, align: Align, o: PositionOptions) {
  const vertical = side === 'top' || side === 'bottom';
  let x = 0;
  let y = 0;
  if (side === 'bottom') y = anchor.y + anchor.height + o.sideOffset;
  if (side === 'top') y = anchor.y - floating.height - o.sideOffset;
  if (side === 'right') x = anchor.x + anchor.width + o.sideOffset;
  if (side === 'left') x = anchor.x - floating.width - o.sideOffset;
  if (vertical) {
    if (align === 'start') x = anchor.x + o.alignOffset;
    if (align === 'center') x = anchor.x + anchor.width / 2 - floating.width / 2;
    if (align === 'end') x = anchor.x + anchor.width - floating.width - o.alignOffset;
  } else {
    if (align === 'start') y = anchor.y + o.alignOffset;
    if (align === 'center') y = anchor.y + anchor.height / 2 - floating.height / 2;
    if (align === 'end') y = anchor.y + anchor.height - floating.height - o.alignOffset;
  }
  return { x, y };
}

function space(anchor: Rect, viewport: { width: number; height: number }, side: Side, o: PositionOptions) {
  const p = o.collisionPadding + o.sideOffset;
  switch (side) {
    case 'top':
      return anchor.y - p;
    case 'bottom':
      return viewport.height - (anchor.y + anchor.height) - p;
    case 'left':
      return anchor.x - p;
    case 'right':
      return viewport.width - (anchor.x + anchor.width) - p;
  }
}

/** Pure placement maths: anchors a floating box to a reference rect inside a viewport. */
export function computePosition(
  anchor: Rect,
  floating: { width: number; height: number },
  viewport: { width: number; height: number },
  o: PositionOptions,
): PositionResult {
  let side = o.side;
  const vertical = (s: Side) => s === 'top' || s === 'bottom';
  const needed = (s: Side) => (vertical(s) ? floating.height : floating.width);
  if (o.avoidCollisions && space(anchor, viewport, side, o) < needed(side)) {
    const alt = opposite[side];
    if (space(anchor, viewport, alt, o) > space(anchor, viewport, side, o)) side = alt;
  }
  let { x, y } = place(anchor, floating, side, o.align, o);
  const pad = o.collisionPadding;
  if (o.avoidCollisions) {
    // Shift along the cross axis to stay inside the viewport.
    if (vertical(side)) x = Math.min(Math.max(x, pad), Math.max(pad, viewport.width - floating.width - pad));
    else y = Math.min(Math.max(y, pad), Math.max(pad, viewport.height - floating.height - pad));
  }
  const arrowOffset = vertical(side) ? anchor.x + anchor.width / 2 - x : anchor.y + anchor.height / 2 - y;
  const availableHeight = vertical(side) ? Math.max(0, space(anchor, viewport, side, o)) : viewport.height - pad * 2;
  const availableWidth = vertical(side) ? viewport.width - pad * 2 : Math.max(0, space(anchor, viewport, side, o));
  return { x: Math.round(x), y: Math.round(y), side, align: o.align, availableWidth, availableHeight, arrowOffset };
}

'use client';
import * as React from 'react';

export interface PanelConstraints {
  id: string;
  minSize: number;
  maxSize: number;
  collapsible: boolean;
  collapsedSize: number;
}

export interface SplitPanelContextValue {
  orientation: 'horizontal' | 'vertical';
  sizes: number[];
  constraints: PanelConstraints[];
  groupRef: React.RefObject<HTMLDivElement | null>;
  /** Sets the size of panel `index` (and the one after it), respecting constraints. */
  resize: (index: number, size: number) => void;
  /** Toggles collapse of panel `index` if collapsible. */
  toggleCollapse: (index: number) => void;
  /** Replace sizes wholesale (pointer drags use start sizes). */
  setSizes: (sizes: number[]) => void;
  dragging: number | null;
  setDragging: (index: number | null) => void;
}

export const SplitPanelContext = React.createContext<SplitPanelContextValue | null>(null);

export function useSplitPanel(consumer: string): SplitPanelContextValue {
  const ctx = React.useContext(SplitPanelContext);
  if (!ctx) throw new Error(`<${consumer}> must be used within <SplitPanel>.`);
  return ctx;
}

/** Static markers so SplitPanel can recognise its children without importing them. */
export const PANEL_MARKER = '__stanceSplitPart';
export type SplitPart = 'panel' | 'handle';

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/** Moves the boundary after panel `index` so that panel `index` gets `size` (%), honouring both panels' constraints. */
export function resizePair(
  sizes: number[],
  constraints: PanelConstraints[],
  index: number,
  size: number,
): number[] {
  const a = constraints[index];
  const b = constraints[index + 1];
  if (!a || !b) return sizes;
  const total = sizes[index]! + sizes[index + 1]!;
  const aMin = a.collapsible && size <= a.collapsedSize ? a.collapsedSize : a.minSize;
  const lo = Math.max(aMin, total - b.maxSize);
  const hi = Math.min(a.maxSize, total - b.minSize);
  const nextA = clamp(size, Math.min(lo, hi), hi);
  const next = sizes.slice();
  next[index] = Math.round(nextA * 100) / 100;
  next[index + 1] = Math.round((total - nextA) * 100) / 100;
  return next;
}

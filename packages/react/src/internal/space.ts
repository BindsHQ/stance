import type * as React from 'react';

/** Keys of the Stance spacing scale. */
export type SpaceKey =
  0 | 0.5 | 1 | 1.5 | 2 | 2.5 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24 | 32;

/** `spaceVar(1.5)` → `var(--st-space-1-5)`. Undefined passes through. */
export function spaceVar(key: SpaceKey | undefined): string | undefined {
  if (key === undefined) return undefined;
  return `var(--st-space-${String(key).replace('.', '-')})`;
}

/** Intrinsic element names, used by polymorphic `as` props. */
export type IntrinsicTag = keyof React.JSX.IntrinsicElements;

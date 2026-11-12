'use client';
import { useMediaQuery } from './use-media-query.js';

/** True when the reader asked the system for reduced motion. False on the server. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

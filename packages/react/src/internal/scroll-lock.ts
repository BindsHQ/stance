'use client';
import * as React from 'react';

let locks = 0;
let saved: { overflow: string; paddingRight: string } | null = null;

/** Locks body scroll while enabled; reference counted for nested overlays. */
export function useScrollLock(enabled: boolean) {
  React.useEffect(() => {
    if (!enabled) return;
    const body = document.body;
    if (locks === 0) {
      const scrollbar = window.innerWidth - document.documentElement.clientWidth;
      saved = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
      body.style.overflow = 'hidden';
      if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
      body.setAttribute('data-stance-scroll-locked', '');
    }
    locks++;
    return () => {
      locks--;
      if (locks === 0 && saved) {
        body.style.overflow = saved.overflow;
        body.style.paddingRight = saved.paddingRight;
        body.removeAttribute('data-stance-scroll-locked');
        saved = null;
      }
    };
  }, [enabled]);
}

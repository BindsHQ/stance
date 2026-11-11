import type { ThemeName } from './themes.js';

export type ThemePreference = ThemeName | 'system';

export interface ThemeScriptOptions {
  /** localStorage key holding the preference. Default `stance-theme`. */
  storageKey?: string;
  /** Preference used when nothing is stored. Default `system`. */
  defaultTheme?: ThemePreference;
  /** Also toggle a `dark` class on <html> (for Tailwind `darkMode: 'class'`). Default `true`. */
  darkClass?: boolean;
  /** When the preference is `system`, honour `prefers-contrast: more`. Default `true`. */
  respectContrastPreference?: boolean;
  /** Extra keys to read (in order) when `storageKey` is empty, for migrating legacy preferences. */
  legacyStorageKeys?: string[];
}

/**
 * Returns a self-contained IIFE to inline in <head> *before* any stylesheet paints,
 * so the resolved theme is applied with no flash of the wrong theme.
 */
export function themeScript(options: ThemeScriptOptions = {}): string {
  const cfg = {
    k: options.storageKey ?? 'stance-theme',
    d: options.defaultTheme ?? 'system',
    c: options.darkClass ?? true,
    hc: options.respectContrastPreference ?? true,
    l: options.legacyStorageKeys ?? [],
  };
  return `(function(){try{var o=${JSON.stringify(cfg)},s=localStorage,p=s.getItem(o.k);if(!p){for(var i=0;i<o.l.length;i++){var v=s.getItem(o.l[i]);if(v){p=v;break}}}var ok={light:1,dark:1,"high-contrast":1,system:1};if(!p||!ok[p])p=o.d;var m=function(q){return window.matchMedia&&window.matchMedia(q).matches},t=p;if(p==="system"){t=o.hc&&m("(prefers-contrast: more)")?"high-contrast":m("(prefers-color-scheme: dark)")?"dark":"light"}var e=document.documentElement;e.setAttribute("data-theme",t);e.style.colorScheme=t==="dark"?"dark":"light";if(o.c){e.classList.toggle("dark",t==="dark")}}catch(_){}})();`;
}

'use client';
import * as React from 'react';

/** Writes text to the clipboard, falling back to execCommand where the async API is unavailable. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }
  if (typeof document === 'undefined') return false;
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  let ok: boolean;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}

/** Copy state with an auto-resetting `copied` flag. */
export function useClipboard(timeout = 2000) {
  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState(false);
  const timer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);
  const copy = React.useCallback(
    async (text: string) => {
      const ok = await copyToClipboard(text);
      setCopied(ok);
      setError(!ok);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        setCopied(false);
        setError(false);
      }, timeout);
      return ok;
    },
    [timeout],
  );
  return { copy, copied, error };
}

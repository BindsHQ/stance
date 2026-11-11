'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { formatHotkey, matchesHotkey } from '../../internal/hotkey.js';
import { Portal } from '../../internal/portal.js';
import { Icon } from '../../icons/Icon.js';
import type { IconName } from '../../icons/paths.js';
import { Spinner } from '../spinner/Spinner.js';
import { toastStore, type ToastRecord, type ToastTone } from './toast-store.js';

export type ToasterPosition =
  'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface ToasterProps {
  /** Default `bottom-right`. Phones always use full width. */
  position?: ToasterPosition;
  /** Maximum toasts shown at once; the rest queue. Default 3. */
  visibleToasts?: number;
  /** Hotkey that moves focus to the toasts. Default `F8`. */
  hotkey?: string;
  /** Accessible region label. Default "Notifications". */
  label?: string;
  /** Close button label. Default "Dismiss notification". */
  closeLabel?: string;
  className?: string;
}

const icons: Partial<Record<ToastTone, IconName>> = {
  success: 'check-circle',
  error: 'alert-circle',
  warning: 'alert-triangle',
  info: 'info',
};

function useToasts(): ToastRecord[] {
  return React.useSyncExternalStore(
    toastStore.subscribe,
    toastStore.getSnapshot,
    toastStore.getServerSnapshot,
  );
}

function textOf(node: React.ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join(' ');
  if (React.isValidElement(node))
    return textOf((node.props as { children?: React.ReactNode }).children);
  return '';
}

/**
 * Renders toasts created with `toast()`. Mount once near the root.
 * Announces new toasts through persistent live regions (assertive for errors),
 * pauses timers on hover, focus and hidden tabs, and focuses the list on F8.
 */
export function Toaster({
  position = 'bottom-right',
  visibleToasts = 3,
  hotkey = 'F8',
  label = 'Notifications',
  closeLabel = 'Dismiss notification',
  className,
}: ToasterProps) {
  const all = useToasts();
  const visible = all.slice(-visibleToasts);
  const ordered = position.startsWith('top') ? [...visible].reverse() : visible;
  const listRef = React.useRef<HTMLOListElement>(null);
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);
  const [announcements, setAnnouncements] = React.useState({ polite: '', assertive: '' });
  const announced = React.useRef(new Map<string, number>());

  React.useEffect(() => {
    for (const t of all) {
      if (announced.current.get(t.id) === t.version) continue;
      announced.current.set(t.id, t.version);
      const text = [textOf(t.title), textOf(t.description)].filter(Boolean).join('. ');
      if (!text) continue;
      const urgent = t.tone === 'error' || t.tone === 'warning';
      setAnnouncements((a) => (urgent ? { ...a, assertive: text } : { ...a, polite: text }));
    }
    for (const id of announced.current.keys())
      if (!all.some((t) => t.id === id)) announced.current.delete(id);
  }, [all]);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (hotkey && matchesHotkey(e, hotkey)) {
        e.preventDefault();
        listRef.current?.focus();
      }
    };
    const onVisibility = () => setHidden(document.visibilityState === 'hidden');
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [hotkey]);

  const paused = hovered || focused || hidden;
  return (
    <Portal>
      <section
        aria-label={`${label} (${formatHotkey(hotkey)})`}
        className={cx('st-toaster', className)}
        data-position={position}
      >
        <div className="st-sr-only" aria-live="polite" aria-atomic="true">
          {announcements.polite}
        </div>
        <div className="st-sr-only" aria-live="assertive" aria-atomic="true">
          {announcements.assertive}
        </div>
        <ol
          ref={listRef}
          tabIndex={-1}
          className="st-toaster__list"
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          onFocus={() => setFocused(true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
          }}
        >
          {ordered.map((t) => (
            <ToastItem key={t.id} toast={t} paused={paused} closeLabel={closeLabel} />
          ))}
        </ol>
      </section>
    </Portal>
  );
}

function ToastItem({
  toast: t,
  paused,
  closeLabel,
}: {
  toast: ToastRecord;
  paused: boolean;
  closeLabel: string;
}) {
  const remaining = React.useRef(t.duration);
  const ref = React.useRef<HTMLLIElement>(null);
  const swipe = React.useRef<{ x: number; dx: number } | null>(null);

  React.useEffect(() => {
    remaining.current = t.duration;
  }, [t.version, t.duration]);

  React.useEffect(() => {
    if (paused || !Number.isFinite(t.duration)) return;
    const start = Date.now();
    const timer = window.setTimeout(() => toastStore.dismiss(t.id), remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (Date.now() - start));
    };
  }, [paused, t.id, t.duration, t.version]);

  const onPointerDown = (e: React.PointerEvent<HTMLLIElement>) => {
    if (e.pointerType === 'mouse' || (e.target as HTMLElement).closest('button,a')) return;
    swipe.current = { x: e.clientX, dx: 0 };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLLIElement>) => {
    if (!swipe.current || !ref.current) return;
    swipe.current.dx = e.clientX - swipe.current.x;
    ref.current.style.transform = `translateX(${swipe.current.dx}px)`;
    ref.current.style.opacity = String(Math.max(0.2, 1 - Math.abs(swipe.current.dx) / 240));
  };
  const onPointerUp = () => {
    const s = swipe.current;
    swipe.current = null;
    if (!s || !ref.current) return;
    if (Math.abs(s.dx) > 80) toastStore.dismiss(t.id);
    else {
      ref.current.style.transform = '';
      ref.current.style.opacity = '';
    }
  };

  const iconName = icons[t.tone];
  return (
    <li
      ref={ref}
      className="st-toast"
      data-tone={t.tone}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {t.tone === 'loading' ? (
        <span className="st-toast__icon">
          <Spinner size="sm" label={null} />
        </span>
      ) : (
        iconName && (
          <span className="st-toast__icon" aria-hidden="true">
            <Icon name={iconName} size={18} />
          </span>
        )
      )}
      <div className="st-toast__content">
        {t.title != null && <div className="st-toast__title">{t.title}</div>}
        {t.description != null && <div className="st-toast__description">{t.description}</div>}
      </div>
      {t.action && (
        <button
          type="button"
          className="st-toast__action"
          onClick={() => {
            t.action!.onClick();
            if (!t.action!.keepOpen) toastStore.dismiss(t.id);
          }}
        >
          {t.action.label}
        </button>
      )}
      {t.dismissible && (
        <button
          type="button"
          className="st-toast__close"
          aria-label={closeLabel}
          onClick={() => toastStore.dismiss(t.id)}
        >
          <Icon name="x" size={14} />
        </button>
      )}
    </li>
  );
}

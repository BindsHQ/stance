import type * as React from 'react';

export type ToastTone = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface ToastAction {
  label: React.ReactNode;
  onClick: () => void;
  /** Keep the toast open after the action runs. Default false. */
  keepOpen?: boolean;
}

export interface ToastOptions {
  /** Stable id to update or dedupe a toast. Generated otherwise. */
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  tone?: ToastTone;
  /** Auto-dismiss after ms. `Infinity` keeps it until dismissed. Default 5000 (loading: Infinity). */
  duration?: number;
  action?: ToastAction;
  /** Show the close button. Default true. */
  dismissible?: boolean;
  onDismiss?: () => void;
}

export interface ToastRecord extends Required<
  Pick<ToastOptions, 'id' | 'tone' | 'duration' | 'dismissible'>
> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastAction;
  onDismiss?: () => void;
  createdAt: number;
  /** Increments on every update so items can restart their timers. */
  version: number;
}

type Listener = () => void;

let toasts: ToastRecord[] = [];
const listeners = new Set<Listener>();
let counter = 0;

function emit() {
  for (const l of listeners) l();
}

export const toastStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: () => toasts,
  getServerSnapshot: () => [] as ToastRecord[],
  upsert(options: ToastOptions): string {
    const id = options.id ?? `st-toast-${++counter}`;
    const existing = toasts.find((t) => t.id === id);
    const tone = options.tone ?? existing?.tone ?? 'default';
    const record: ToastRecord = {
      ...existing,
      ...stripUndefined(options),
      id,
      tone,
      duration:
        options.duration ??
        (tone === 'loading'
          ? Infinity
          : existing && existing.tone !== 'loading'
            ? existing.duration
            : 5000),
      dismissible: options.dismissible ?? existing?.dismissible ?? true,
      createdAt: existing?.createdAt ?? Date.now(),
      version: (existing?.version ?? 0) + 1,
    };
    toasts = existing ? toasts.map((t) => (t.id === id ? record : t)) : [...toasts, record];
    emit();
    return id;
  },
  dismiss(id?: string) {
    const removed = id === undefined ? toasts : toasts.filter((t) => t.id === id);
    toasts = id === undefined ? [] : toasts.filter((t) => t.id !== id);
    removed.forEach((t) => t.onDismiss?.());
    emit();
  },
};

function stripUndefined<T extends object>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
}

type Message = React.ReactNode;
type ShortcutOptions = Omit<ToastOptions, 'title' | 'tone'>;

export interface PromiseMessages<T> {
  loading: Message;
  success: Message | ((value: T) => Message);
  error: Message | ((error: unknown) => Message);
}

function create(
  message: Message | ToastOptions,
  options?: ShortcutOptions & { tone?: ToastTone },
): string {
  if (message !== null && typeof message === 'object' && !isNode(message))
    return toastStore.upsert(message as ToastOptions);
  return toastStore.upsert({ ...options, title: message as Message });
}

function isNode(v: object): boolean {
  return '$$typeof' in v || Array.isArray(v);
}

/**
 * Shows a toast. `toast('Saved')`, `toast.success('Template published')`,
 * `toast.promise(save(), { loading, success, error })`, `toast.dismiss(id)`.
 */
export const toast = Object.assign(create, {
  success: (title: Message, options?: ShortcutOptions) =>
    create(title, { ...options, tone: 'success' }),
  error: (title: Message, options?: ShortcutOptions) =>
    create(title, { ...options, tone: 'error' }),
  warning: (title: Message, options?: ShortcutOptions) =>
    create(title, { ...options, tone: 'warning' }),
  info: (title: Message, options?: ShortcutOptions) => create(title, { ...options, tone: 'info' }),
  loading: (title: Message, options?: ShortcutOptions) =>
    create(title, { ...options, tone: 'loading' }),
  update: (id: string, options: Omit<ToastOptions, 'id'>) => toastStore.upsert({ ...options, id }),
  dismiss: (id?: string) => toastStore.dismiss(id),
  promise<T>(
    promise: Promise<T> | (() => Promise<T>),
    messages: PromiseMessages<T>,
    options?: ShortcutOptions,
  ): Promise<T> {
    const id = create(messages.loading, { ...options, tone: 'loading' });
    const p = typeof promise === 'function' ? promise() : promise;
    p.then(
      (value) => {
        const title =
          typeof messages.success === 'function' ? messages.success(value) : messages.success;
        toastStore.upsert({
          ...options,
          id,
          title,
          tone: 'success',
          duration: options?.duration ?? 5000,
        });
      },
      (error: unknown) => {
        const title = typeof messages.error === 'function' ? messages.error(error) : messages.error;
        toastStore.upsert({
          ...options,
          id,
          title,
          tone: 'error',
          duration: options?.duration ?? 7000,
        });
      },
    );
    return p;
  },
});

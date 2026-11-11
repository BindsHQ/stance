'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useComposedRefs } from '../../internal/refs.js';
import { useIsomorphicLayoutEffect } from '../../internal/use-isomorphic-layout-effect.js';
import {
  PANEL_MARKER,
  SplitPanelContext,
  clamp,
  resizePair,
  useSplitPanel,
  type PanelConstraints,
  type SplitPart,
} from './context.js';

export interface SplitPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** `horizontal` lays panels side by side; `vertical` stacks them. Default `horizontal`. */
  orientation?: 'horizontal' | 'vertical';
  /** Called with panel sizes (percent) whenever the layout changes through user interaction. */
  onLayout?: (sizes: number[]) => void;
  /** Persist sizes in localStorage under this id. */
  autoSaveId?: string;
}

interface PanelLikeProps {
  id?: string;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  collapsible?: boolean;
  collapsedSize?: number;
}

const partOf = (node: React.ReactNode): SplitPart | null =>
  React.isValidElement(node) && typeof node.type !== 'string'
    ? ((node.type as unknown as Record<string, SplitPart | undefined>)[PANEL_MARKER] ?? null)
    : null;

/**
 * A group of resizable panels separated by draggable, keyboard-accessible handles.
 * Children must be `ResizablePanel` and `ResizeHandle` elements, alternating.
 */
export const SplitPanel = React.forwardRef<HTMLDivElement, SplitPanelProps>(function SplitPanel(
  { orientation = 'horizontal', onLayout, autoSaveId, className, children, ...props },
  forwardedRef,
) {
  const groupRef = React.useRef<HTMLDivElement>(null);
  const composed = useComposedRefs(forwardedRef, groupRef);
  const baseId = React.useId();
  const childArray = React.Children.toArray(children);
  const panelProps = childArray
    .filter((c) => partOf(c) === 'panel')
    .map((c) => (c as React.ReactElement<PanelLikeProps>).props);

  const constraints: PanelConstraints[] = panelProps.map((p, i) => ({
    id: p.id ?? `${baseId}-panel-${i}`,
    minSize: p.minSize ?? 10,
    maxSize: p.maxSize ?? 100,
    collapsible: p.collapsible ?? false,
    collapsedSize: p.collapsedSize ?? 0,
  }));

  const initial = React.useMemo(() => {
    const specified = panelProps.reduce((sum, p) => sum + (p.defaultSize ?? 0), 0);
    const unspecified = panelProps.filter((p) => p.defaultSize === undefined).length;
    const share = unspecified ? Math.max(0, 100 - specified) / unspecified : 0;
    return panelProps.map((p) => p.defaultSize ?? share);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelProps.length]);

  const [sizes, setSizesState] = React.useState<number[]>(initial);
  const [dragging, setDragging] = React.useState<number | null>(null);
  const restore = React.useRef(new Map<number, number>());
  const storageKey = autoSaveId ? `stance-split-panel:${autoSaveId}` : null;
  const onLayoutRef = React.useRef(onLayout);
  onLayoutRef.current = onLayout;

  useIsomorphicLayoutEffect(() => {
    if (!storageKey) return;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null') as unknown;
      if (
        Array.isArray(saved) &&
        saved.length === initial.length &&
        saved.every((n) => typeof n === 'number')
      )
        setSizesState(saved);
    } catch {
      /* ignore corrupt or unavailable storage */
    }
  }, [storageKey, initial.length]);

  const commit = React.useCallback(
    (next: number[]) => {
      setSizesState(next);
      onLayoutRef.current?.(next);
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          /* storage unavailable */
        }
      }
    },
    [storageKey],
  );

  const sizesRef = React.useRef(sizes);
  sizesRef.current = sizes;
  const constraintsRef = React.useRef(constraints);
  constraintsRef.current = constraints;

  const resize = React.useCallback(
    (index: number, size: number) => {
      const next = resizePair(sizesRef.current, constraintsRef.current, index, size);
      if (next.some((v, i) => v !== sizesRef.current[i])) commit(next);
    },
    [commit],
  );

  const toggleCollapse = React.useCallback(
    (index: number) => {
      const c = constraintsRef.current[index];
      if (!c?.collapsible) return;
      const current = sizesRef.current[index]!;
      if (current > c.collapsedSize) {
        restore.current.set(index, current);
        resize(index, c.collapsedSize);
      } else {
        resize(
          index,
          restore.current.get(index) ?? Math.max(c.minSize, initial[index] ?? c.minSize),
        );
      }
    },
    [resize, initial],
  );

  let panelIndex = -1;
  const content = childArray.map((child) => {
    const part = partOf(child);
    if (!React.isValidElement(child) || !part) return child;
    if (part === 'panel') panelIndex++;
    const index = part === 'panel' ? panelIndex : panelIndex;
    return React.cloneElement(child as React.ReactElement<{ __index?: number }>, {
      __index: index,
    });
  });

  const value = React.useMemo(
    () => ({
      orientation,
      sizes,
      constraints,
      groupRef,
      resize,
      toggleCollapse,
      setSizes: commit,
      dragging,
      setDragging,
    }),
    // constraints is derived each render; identity is fine for consumers reading values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orientation, sizes, JSON.stringify(constraints), resize, toggleCollapse, commit, dragging],
  );

  return (
    <SplitPanelContext.Provider value={value}>
      <div
        ref={composed}
        className={cx('st-split-panel', className)}
        data-orientation={orientation}
        data-dragging={dragging !== null ? '' : undefined}
        {...props}
      >
        {content}
      </div>
    </SplitPanelContext.Provider>
  );
});

export interface ResizeHandleProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Accessible name. Default "Resize panels". */
  'aria-label'?: string;
  /** Percent moved per arrow key press. Shift multiplies by 2. Default 5. */
  keyboardStep?: number;
  /** Show a grip affordance. Default true. */
  withGrip?: boolean;
  disabled?: boolean;
  /** @internal injected by SplitPanel */
  __index?: number;
}

/** A focusable separator between two panels. Drag it, or use arrow keys, Home/End and Enter. */
export const ResizeHandle = Object.assign(
  React.forwardRef<HTMLDivElement, ResizeHandleProps>(function ResizeHandle(
    {
      keyboardStep = 5,
      withGrip = true,
      disabled,
      __index = 0,
      className,
      onKeyDown,
      onPointerDown,
      ...props
    },
    ref,
  ) {
    const ctx = useSplitPanel('ResizeHandle');
    const index = __index;
    const c = ctx.constraints[index];
    const size = ctx.sizes[index] ?? 0;
    const horizontal = ctx.orientation === 'horizontal';
    const drag = React.useRef<{ start: number; startSize: number; total: number } | null>(null);

    const handleKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented || disabled || !c) return;
      const step = keyboardStep * (event.shiftKey ? 2 : 1);
      const dec = horizontal ? 'ArrowLeft' : 'ArrowUp';
      const inc = horizontal ? 'ArrowRight' : 'ArrowDown';
      let next: number | null = null;
      if (event.key === dec) next = size - step;
      else if (event.key === inc) next = size + step;
      else if (event.key === 'Home') next = c.collapsible ? c.collapsedSize : c.minSize;
      else if (event.key === 'End') next = c.maxSize;
      else if (event.key === 'Enter') {
        event.preventDefault();
        ctx.toggleCollapse(index);
        return;
      }
      if (next === null) return;
      event.preventDefault();
      ctx.resize(index, clamp(next, 0, 100));
    };

    return (
      <div
        ref={ref}
        role="separator"
        tabIndex={disabled ? undefined : 0}
        aria-orientation={horizontal ? 'vertical' : 'horizontal'}
        aria-valuenow={Math.round(size)}
        aria-valuemin={c ? (c.collapsible ? c.collapsedSize : c.minSize) : 0}
        aria-valuemax={c?.maxSize ?? 100}
        aria-controls={c?.id}
        aria-label={props['aria-label'] ?? 'Resize panels'}
        aria-disabled={disabled || undefined}
        className={cx('st-resize-handle', className)}
        data-orientation={horizontal ? 'vertical' : 'horizontal'}
        data-dragging={ctx.dragging === index ? '' : undefined}
        data-disabled={disabled ? '' : undefined}
        onKeyDown={handleKey}
        onPointerDown={(event) => {
          onPointerDown?.(event);
          if (event.defaultPrevented || disabled || event.button !== 0) return;
          const group = ctx.groupRef.current;
          if (!group) return;
          const rect = group.getBoundingClientRect();
          drag.current = {
            start: horizontal ? event.clientX : event.clientY,
            startSize: size,
            total: (horizontal ? rect.width : rect.height) || 1,
          };
          event.currentTarget.setPointerCapture?.(event.pointerId);
          ctx.setDragging(index);
          event.preventDefault();
        }}
        onPointerMove={(event) => {
          const d = drag.current;
          if (!d) return;
          const delta = (((horizontal ? event.clientX : event.clientY) - d.start) / d.total) * 100;
          ctx.resize(index, d.startSize + delta);
        }}
        onPointerUp={(event) => {
          if (!drag.current) return;
          drag.current = null;
          event.currentTarget.releasePointerCapture?.(event.pointerId);
          ctx.setDragging(null);
        }}
        onPointerCancel={() => {
          drag.current = null;
          ctx.setDragging(null);
        }}
        {...props}
      >
        {withGrip && <span className="st-resize-handle__grip" aria-hidden="true" />}
      </div>
    );
  }),
  { [PANEL_MARKER]: 'handle' as SplitPart },
);

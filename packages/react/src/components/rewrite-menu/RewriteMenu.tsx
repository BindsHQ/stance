'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useFocusScope } from '../../internal/focus-scope.js';
import type { GenerationStatus } from '../../internal/generation-status.js';
import { useDismissableLayer } from '../../internal/layer-stack.js';
import { Portal } from '../../internal/portal.js';
import type { Align, Side } from '../../internal/position.js';
import { useComposedRefs } from '../../internal/refs.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { useFloating } from '../../internal/use-floating.js';
import { useIsomorphicLayoutEffect } from '../../internal/use-isomorphic-layout-effect.js';
import { Icon } from '../../icons/Icon.js';
import { Button } from '../button/Button.js';
import {
  MenuContent,
  MenuItem,
  MenuRoot,
  MenuSeparator,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
} from '../dropdown-menu/menu-core.js';
import { IconButton } from '../icon-button/IconButton.js';
import { ShimmerText } from '../shimmer-text/ShimmerText.js';

export interface RewriteMenuAction {
  /** Stable id, passed back on select. */
  id: string;
  /** The words on the menu item. */
  label: string;
  /** Icon before the label. */
  icon?: React.ReactNode;
  /** Choices in a submenu, for example tones or languages. */
  children?: RewriteMenuAction[];
}

/** What the menu is placed against: an element, a ref to one, or anything with a rectangle such as a Range. */
export type RewriteMenuAnchor =
  | Element
  | React.RefObject<Element | null>
  | { getBoundingClientRect: () => { left: number; top: number; width: number; height: number } };

export interface RewriteMenuLabels {
  /** Accessible name of the menu and its panels. Default "Rewrite". */
  label: string;
  /** The menu item that opens the instruction field. Default "Custom instruction". */
  custom: string;
  /** Placeholder of the instruction field. Default "Describe the change". */
  customPlaceholder: string;
  /** The button that sends the instruction. Default "Rewrite". */
  customSubmit: string;
  /** The button that returns to the menu. Default "Back". */
  back: string;
  /** Accessible name of the preview. Default "Suggested rewrite". */
  preview: string;
  /** Shown while waiting for the rewrite. Default "Rewriting". */
  working: string;
  /** Shown when the rewrite failed. Default "The rewrite could not be made". */
  error: string;
  /** Shown when the rewrite was stopped early. Default "Rewrite stopped early". */
  stopped: string;
  /** The button that puts the rewrite in place of the selection. Default "Replace". */
  replace: string;
  /** The button that throws the rewrite away. Default "Discard". */
  discard: string;
}

export interface RewriteMenuProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Controlled open state. */
  open?: boolean;
  /** Open on first render when uncontrolled. Default false. */
  defaultOpen?: boolean;
  /** Called when the menu opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** What to place the menu against: the selection, the field or a button. */
  anchor?: RewriteMenuAnchor | null;
  /** The ways to change the text. Defaults to improve, shorten, lengthen, tone and translate. */
  actions?: RewriteMenuAction[];
  /** Called with the chosen action, and its parent when it came from a submenu. */
  onAction?: (action: RewriteMenuAction, parent?: RewriteMenuAction) => void;
  /** Offer a free text instruction. Default true. */
  allowCustom?: boolean;
  /** Called with the instruction the person typed. */
  onCustomSubmit?: (instruction: string) => void;
  /** Where the rewrite is in its life cycle. Anything but `idle` shows the preview panel. Default `idle`. */
  status?: GenerationStatus;
  /** The rewritten text. Shown in the preview panel. */
  preview?: React.ReactNode;
  /** Called when the person chooses to replace the selection with the rewrite. */
  onAcceptPreview?: () => void;
  /** Called when the person discards the rewrite, by button, Escape or a press outside. */
  onDiscardPreview?: () => void;
  /** Side of the anchor to open on. Default `bottom`. */
  side?: Side;
  /** Alignment along the anchor. Default `start`. */
  align?: Align;
  /** Translations for the built in strings. */
  labels?: Partial<RewriteMenuLabels>;
}

/** The actions used when none are passed. Pass your own to translate or change them. */
export const rewriteMenuDefaultActions: RewriteMenuAction[] = [
  { id: 'improve', label: 'Improve writing' },
  { id: 'shorten', label: 'Make shorter' },
  { id: 'lengthen', label: 'Make longer' },
  {
    id: 'tone',
    label: 'Change tone',
    children: [
      { id: 'tone-professional', label: 'Professional' },
      { id: 'tone-friendly', label: 'Friendly' },
      { id: 'tone-direct', label: 'Direct' },
    ],
  },
  {
    id: 'translate',
    label: 'Translate',
    children: [
      { id: 'translate-en', label: 'English' },
      { id: 'translate-sv', label: 'Swedish' },
      { id: 'translate-de', label: 'German' },
      { id: 'translate-fr', label: 'French' },
    ],
  },
];

const isElement = (anchor: RewriteMenuAnchor): anchor is Element => 'nodeType' in anchor;
const isRef = (anchor: RewriteMenuAnchor): anchor is React.RefObject<Element | null> =>
  'current' in anchor;

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  anchorRef: React.RefObject<HTMLElement | null>;
  side: Side;
  align: Align;
  onDismiss: () => void;
  initialFocus?: React.RefObject<HTMLElement | null>;
}

/** The floating surface for the instruction field and the preview. */
const Panel = React.forwardRef<HTMLDivElement, PanelProps>(function Panel(
  { anchorRef, side, align, onDismiss, initialFocus, className, style, children, ...props },
  forwardedRef,
) {
  const ref = React.useRef<HTMLDivElement>(null);
  const composed = useComposedRefs(forwardedRef, ref);
  const floating = useFloating(anchorRef, ref, { open: true, side, align, sideOffset: 6 });
  useDismissableLayer(ref, { enabled: true, onDismiss });
  // Focus returns to where it was when the whole menu closes, not between its views.
  useFocusScope(ref, { enabled: true, trapped: true, restoreFocus: false, initialFocus });
  return (
    <Portal>
      <div
        ref={composed}
        role="dialog"
        tabIndex={-1}
        data-stance-layer=""
        data-state="open"
        data-side={floating.side}
        className={cx('st-floating st-rewrite-menu__panel', className)}
        style={{ ...floating.style, ...style }}
        {...props}
      >
        {children}
      </div>
    </Portal>
  );
});

/**
 * A menu of ways to change selected text: improve, shorten, lengthen, change tone, translate
 * or a custom instruction. The result is shown as a preview that the person replaces or discards.
 */
export const RewriteMenu = React.forwardRef<HTMLDivElement, RewriteMenuProps>(function RewriteMenu(
  {
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    anchor,
    actions = rewriteMenuDefaultActions,
    onAction,
    allowCustom = true,
    onCustomSubmit,
    status = 'idle',
    preview,
    onAcceptPreview,
    onDiscardPreview,
    side = 'bottom',
    align = 'start',
    labels: labelsProp,
    className,
    ...props
  },
  ref,
) {
  const labels: RewriteMenuLabels = {
    label: 'Rewrite',
    custom: 'Custom instruction',
    customPlaceholder: 'Describe the change',
    customSubmit: 'Rewrite',
    back: 'Back',
    preview: 'Suggested rewrite',
    working: 'Rewriting',
    error: 'The rewrite could not be made',
    stopped: 'Rewrite stopped early',
    replace: 'Replace',
    discard: 'Discard',
    ...labelsProp,
  };
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const [view, setView] = React.useState<'menu' | 'custom'>('menu');
  const [instruction, setInstruction] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const hasResult = status !== 'idle' || preview != null;
  const busy = status === 'submitted' || status === 'streaming';
  const mode = !open ? null : hasResult ? 'result' : view;

  // One stable ref for the positioning code, whatever kind of anchor was passed.
  const spanRef = React.useRef<HTMLSpanElement>(null);
  const anchorLatest = React.useRef(anchor);
  anchorLatest.current = anchor;
  const anchorRef = React.useMemo<React.RefObject<HTMLElement | null>>(
    () => ({
      get current() {
        const target = anchorLatest.current;
        if (!target) return spanRef.current;
        if (isElement(target)) return target as HTMLElement;
        if (isRef(target)) return target.current as HTMLElement | null;
        return spanRef.current;
      },
    }),
    [],
  );
  const virtual = !anchor || (!isElement(anchor) && !isRef(anchor));
  // Measured while rendering so the stand in is in place before the menu is positioned.
  const rect = open && anchor && virtual ? anchor.getBoundingClientRect() : null;

  // Focus goes back to where it was before the menu opened, usually the text field.
  const returnRef = React.useRef<HTMLElement | null>(null);
  const wasOpen = React.useRef(false);
  useIsomorphicLayoutEffect(() => {
    if (open && !wasOpen.current) returnRef.current = document.activeElement as HTMLElement | null;
  }, [open]);
  React.useEffect(() => {
    const closed = wasOpen.current && !open;
    wasOpen.current = open;
    if (!closed) return;
    setView('menu');
    setInstruction('');
    const timer = window.setTimeout(() => {
      const active = document.activeElement;
      const lost = !active || active === document.body || !active.isConnected;
      if (lost && returnRef.current?.isConnected) returnRef.current.focus({ preventScroll: true });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  // After a choice the menu stays for the preview, and closes when no rewrite follows.
  const live = React.useRef({ hasResult });
  live.current = { hasResult };
  const settleTimer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(settleTimer.current), []);
  const settle = () => {
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      if (!live.current.hasResult) setOpen(false);
    }, 0);
  };

  const choose = (action: RewriteMenuAction, parent?: RewriteMenuAction) => {
    onAction?.(action, parent);
    settle();
  };
  const submitCustom = () => {
    const text = instruction.trim();
    if (!text) return;
    onCustomSubmit?.(text);
    settle();
  };
  const discard = () => {
    onDiscardPreview?.();
    setOpen(false);
  };
  const accept = () => {
    onAcceptPreview?.();
    setOpen(false);
  };

  return (
    <>
      {virtual && (
        <span
          ref={spanRef}
          aria-hidden="true"
          className="st-rewrite-menu__anchor"
          style={
            rect
              ? {
                  // Physical on purpose: these are viewport coordinates.
                  left: rect.left,
                  top: rect.top,
                  width: rect.width,
                  height: rect.height,
                }
              : undefined
          }
        />
      )}
      <MenuRoot
        open={mode === 'menu'}
        onOpenChange={(next) => {
          if (!next && mode === 'menu') setOpen(false);
        }}
        anchorRef={anchorRef}
      >
        <MenuContent
          ref={ref}
          side={side}
          align={align}
          labelledByTrigger={false}
          aria-label={labels.label}
          className={cx('st-rewrite-menu', className)}
          {...props}
        >
          {actions.map((action) =>
            action.children && action.children.length > 0 ? (
              <MenuSub key={action.id}>
                <MenuSubTrigger icon={action.icon}>{action.label}</MenuSubTrigger>
                <MenuSubContent aria-label={action.label}>
                  {action.children.map((child) => (
                    <MenuItem
                      key={child.id}
                      icon={child.icon}
                      closeOnSelect={false}
                      onSelect={() => choose(child, action)}
                    >
                      {child.label}
                    </MenuItem>
                  ))}
                </MenuSubContent>
              </MenuSub>
            ) : (
              <MenuItem
                key={action.id}
                icon={action.icon}
                closeOnSelect={false}
                onSelect={() => choose(action)}
              >
                {action.label}
              </MenuItem>
            ),
          )}
          {allowCustom && (
            <>
              {actions.length > 0 && <MenuSeparator />}
              <MenuItem
                icon={<Icon name="pencil" />}
                closeOnSelect={false}
                onSelect={() => setView('custom')}
              >
                {labels.custom}
              </MenuItem>
            </>
          )}
        </MenuContent>
      </MenuRoot>
      {mode === 'custom' && (
        <Panel
          ref={ref}
          anchorRef={anchorRef}
          side={side}
          align={align}
          onDismiss={() => setOpen(false)}
          initialFocus={inputRef}
          aria-label={labels.label}
          className={className}
          data-view="custom"
          {...props}
        >
          <form
            className="st-rewrite-menu__custom"
            onSubmit={(event) => {
              event.preventDefault();
              submitCustom();
            }}
          >
            <IconButton
              label={labels.back}
              icon={<Icon name="arrow-left" className="st-rewrite-menu__back-icon" />}
              size="sm"
              onClick={() => setView('menu')}
            />
            <input
              ref={inputRef}
              type="text"
              className="st-rewrite-menu__input"
              aria-label={labels.custom}
              placeholder={labels.customPlaceholder}
              autoComplete="off"
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
            />
            <Button type="submit" size="sm" disabled={instruction.trim() === ''}>
              {labels.customSubmit}
            </Button>
          </form>
        </Panel>
      )}
      {mode === 'result' && (
        <Panel
          ref={ref}
          anchorRef={anchorRef}
          side={side}
          align={align}
          onDismiss={discard}
          aria-label={labels.label}
          className={className}
          data-view="preview"
          data-status={status}
          {...props}
        >
          <div
            role="region"
            aria-label={labels.preview}
            aria-busy={busy || undefined}
            className="st-rewrite-menu__preview"
          >
            {status === 'submitted' && preview == null && (
              <ShimmerText role="status">{labels.working}</ShimmerText>
            )}
            {preview != null && <div className="st-rewrite-menu__preview-body">{preview}</div>}
            {status === 'error' && (
              <p className="st-rewrite-menu__note" data-tone="danger" role="alert">
                <Icon name="alert-circle" size={14} />
                <span>{labels.error}</span>
              </p>
            )}
            {status === 'stopped' && (
              <p className="st-rewrite-menu__note">
                <Icon name="stop" size={14} />
                <span>{labels.stopped}</span>
              </p>
            )}
          </div>
          <div className="st-rewrite-menu__actions">
            <Button size="sm" variant="ghost" onClick={discard}>
              {labels.discard}
            </Button>
            <Button
              size="sm"
              disabled={busy || preview == null || status === 'error'}
              onClick={accept}
            >
              {labels.replace}
            </Button>
          </div>
        </Panel>
      )}
    </>
  );
});

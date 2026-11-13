'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { getTabbables } from '../../internal/focusable.js';
import { useHotkey } from '../../internal/hotkey.js';
import { useComposedRefs } from '../../internal/refs.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { useMediaQuery } from '../../internal/use-media-query.js';
import { Icon } from '../../icons/Icon.js';
import { IconButton } from '../icon-button/IconButton.js';
import { Sheet, SheetContent, SheetTitle } from '../sheet/Sheet.js';

export interface CopilotPanelLabels {
  /** The title when none is given, and the accessible name. Default "Assistant". */
  title: string;
  /** Accessible name of the close button. Default "Close assistant". */
  close: string;
  /** Accessible name of the context area. Default "Context". */
  context: string;
}

export interface CopilotPanelProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  /** Controlled open state. */
  open?: boolean;
  /** Open on first render when uncontrolled. Default false. */
  defaultOpen?: boolean;
  /** Called when the panel opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** The title in the header. Default "Assistant". */
  title?: React.ReactNode;
  /** What the assistant is looking at, for example ContextChips for the current page. */
  context?: React.ReactNode;
  /** The conversation, usually a Thread. */
  children?: React.ReactNode;
  /** The input, usually a PromptComposer. It takes focus when the panel opens. */
  composer?: React.ReactNode;
  /** Which edge of the page the panel docks to. Default `end`. */
  side?: 'start' | 'end';
  /** Width when docked. A number is pixels. Default 380. */
  width?: number | string;
  /**
   * When the panel is a dialog over the page instead of a docked region.
   * `narrow` follows the viewport width. Default `narrow`.
   */
  modal?: 'narrow' | 'always' | 'never';
  /** Viewport width in px under which `narrow` becomes a dialog. Default 768. */
  narrowBreakpoint?: number;
  /** Extra controls in the header, before the close button. */
  headerActions?: React.ReactNode;
  /** A hotkey that opens the panel and moves focus to the composer, for example `mod+j`. */
  shortcut?: string;
  /** Show the close button. Default true. */
  showClose?: boolean;
  /** Heading level of the title. Default 2. */
  headingLevel?: 2 | 3 | 4;
  /** Translations for the built in strings. */
  labels?: Partial<CopilotPanelLabels>;
}

/**
 * A docked assistant panel for a product: a header with context, a thread and a composer.
 * It sits beside the page on wide screens and opens as a sheet on small ones.
 */
export const CopilotPanel = React.forwardRef<HTMLElement, CopilotPanelProps>(function CopilotPanel(
  {
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    title,
    context,
    children,
    composer,
    side = 'end',
    width = 380,
    modal = 'narrow',
    narrowBreakpoint = 768,
    headerActions,
    shortcut,
    showClose = true,
    headingLevel = 2,
    labels: labelsProp,
    className,
    style,
    ...props
  },
  forwardedRef,
) {
  const labels: CopilotPanelLabels = {
    title: 'Assistant',
    close: 'Close assistant',
    context: 'Context',
    ...labelsProp,
  };
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const narrow = useMediaQuery(`(max-width: ${narrowBreakpoint - 0.02}px)`);
  const isModal = modal === 'always' || (modal === 'narrow' && narrow);
  const titleId = React.useId();
  const panelRef = React.useRef<HTMLElement>(null);
  const composedPanel = useComposedRefs(forwardedRef, panelRef);
  const composerRef = React.useRef<HTMLDivElement>(null);
  // Resolves to the composer's field when something asks where focus should go.
  const composerField = React.useMemo<React.RefObject<HTMLElement | null>>(
    () => ({
      get current() {
        return composerRef.current ? (getTabbables(composerRef.current)[0] ?? null) : null;
      },
    }),
    [],
  );

  // Docked: move focus to the composer on open and give it back on close.
  // The dialog form does both itself.
  const returnRef = React.useRef<HTMLElement | null>(null);
  const wasOpen = React.useRef(open);
  if (open && !wasOpen.current && typeof document !== 'undefined') {
    returnRef.current = document.activeElement as HTMLElement | null;
  }
  React.useEffect(() => {
    const changed = wasOpen.current !== open;
    wasOpen.current = open;
    if (!changed || isModal) return;
    if (open) {
      composerField.current?.focus({ preventScroll: true });
      return;
    }
    const timer = window.setTimeout(() => {
      const active = document.activeElement;
      const lost = !active || active === document.body || !active.isConnected;
      if (lost && returnRef.current?.isConnected) returnRef.current.focus({ preventScroll: true });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open, isModal, composerField]);

  useHotkey(shortcut, (event) => {
    event.preventDefault();
    if (!open) {
      setOpen(true);
      return;
    }
    // Already open: the shortcut brings focus in, or closes when focus is already inside.
    if (panelRef.current?.contains(document.activeElement)) setOpen(false);
    else composerField.current?.focus({ preventScroll: true });
  });

  const Heading = `h${headingLevel}` as 'h2';
  const titleText = title ?? labels.title;
  const body = (
    <>
      <div className="st-copilot-panel__header">
        <Icon name="sparkle" size={18} className="st-copilot-panel__icon" />
        {isModal ? (
          <SheetTitle level={headingLevel} className="st-copilot-panel__title">
            {titleText}
          </SheetTitle>
        ) : (
          <Heading id={titleId} className="st-copilot-panel__title">
            {titleText}
          </Heading>
        )}
        <div className="st-copilot-panel__tools">
          {headerActions}
          {showClose && (
            <IconButton
              label={labels.close}
              icon={<Icon name="x" />}
              size="sm"
              onClick={() => setOpen(false)}
            />
          )}
        </div>
      </div>
      {context != null && (
        <div className="st-copilot-panel__context" role="group" aria-label={labels.context}>
          {context}
        </div>
      )}
      <div className="st-copilot-panel__thread">{children}</div>
      {composer != null && (
        <div ref={composerRef} className="st-copilot-panel__composer">
          {composer}
        </div>
      )}
    </>
  );

  if (isModal) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          ref={composedPanel as React.Ref<HTMLDivElement>}
          height="full"
          showClose={false}
          initialFocus={composerField}
          className={cx('st-copilot-panel', className)}
          data-modal=""
          data-side={side}
          style={style}
          {...props}
        >
          {body}
        </SheetContent>
      </Sheet>
    );
  }
  if (!open) return null;
  return (
    <aside
      ref={composedPanel}
      aria-labelledby={titleId}
      className={cx('st-copilot-panel', className)}
      data-side={side}
      data-state="open"
      style={{
        ['--st-copilot-panel-width' as string]: typeof width === 'number' ? `${width}px` : width,
        ...style,
      }}
      {...props}
    >
      {body}
    </aside>
  );
});

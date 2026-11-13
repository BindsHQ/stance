'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useComposedRefs } from '../../internal/refs.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { useIsomorphicLayoutEffect } from '../../internal/use-isomorphic-layout-effect.js';
import { ResizablePanel } from '../resizable-panel/ResizablePanel.js';
import { useSplitPanel } from '../split-panel/context.js';
import { ResizeHandle, SplitPanel } from '../split-panel/SplitPanel.js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../tabs/Tabs.js';

/** The side shown on a narrow screen. */
export type CanvasSplitViewNarrowView = 'conversation' | 'canvas';

export interface CanvasSplitViewLabels {
  /** Name of the conversation region and its tab. Default "Conversation". */
  conversation: string;
  /** Name of the canvas region and its tab. Default "Canvas". */
  canvas: string;
  /** Name of the divider. Default "Resize conversation and canvas". */
  resize: string;
  /** Name of the tab switch on narrow screens. Default "View". */
  views: string;
}

export interface CanvasSplitViewContextValue {
  /** Whether the canvas is open. */
  canvasOpen: boolean;
  /** Opens or closes the canvas. */
  setCanvasOpen: (open: boolean) => void;
  /** True when the view is too narrow for two columns. */
  narrow: boolean;
  /** The side shown on a narrow screen. */
  narrowView: CanvasSplitViewNarrowView;
  /** Switches the side shown on a narrow screen. */
  setNarrowView: (view: CanvasSplitViewNarrowView) => void;
}

const CanvasSplitViewContext = React.createContext<CanvasSplitViewContextValue | null>(null);
CanvasSplitViewContext.displayName = 'CanvasSplitViewContext';

/** Reads the nearest CanvasSplitView, for example to close the canvas from inside it. */
export function useCanvasSplitView(): CanvasSplitViewContextValue {
  const ctx = React.useContext(CanvasSplitViewContext);
  if (ctx === null) throw new Error('useCanvasSplitView must be used within <CanvasSplitView>.');
  return ctx;
}

export interface CanvasSplitViewProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children'
> {
  /** The conversation side: usually a Thread with a PromptComposer. */
  conversation: React.ReactNode;
  /** The working document side: usually an ArtifactPanel. */
  canvas?: React.ReactNode;
  /** Controlled open state of the canvas. */
  canvasOpen?: boolean;
  /** Whether the canvas is open on first render when uncontrolled. Default true. */
  defaultCanvasOpen?: boolean;
  /** Called when the canvas opens or closes through `useCanvasSplitView`. */
  onCanvasOpenChange?: (open: boolean) => void;
  /** The share of the width the conversation takes at first, from 0 to 1. Default 0.4. */
  defaultRatio?: number;
  /** Smallest conversation width, in percent of the view. Default 25. */
  minConversation?: number;
  /** Smallest canvas width, in percent of the view. Default 30. */
  minCanvas?: number;
  /** Controlled side shown on a narrow screen. */
  narrowView?: CanvasSplitViewNarrowView;
  /** Side shown first on a narrow screen when uncontrolled. Default `conversation`. */
  defaultNarrowView?: CanvasSplitViewNarrowView;
  /** Called when the reader switches side on a narrow screen. */
  onNarrowViewChange?: (view: CanvasSplitViewNarrowView) => void;
  /** Width of the view, in px, below which the tab switch replaces the divider. Default 640. */
  breakpoint?: number;
  /** Forces the narrow or the wide layout instead of measuring the view. */
  narrow?: boolean;
  /** Translations for the built in strings. */
  labels?: Partial<CanvasSplitViewLabels>;
}

const defaultLabels: CanvasSplitViewLabels = {
  conversation: 'Conversation',
  canvas: 'Canvas',
  resize: 'Resize conversation and canvas',
  views: 'View',
};

/** Gives the canvas its share when it joins a split that started with one panel. */
function SplitSizeSync({ active, ratio }: { active: boolean; ratio: number }) {
  const { sizes, setSizes } = useSplitPanel('CanvasSplitView');
  const count = sizes.length;
  useIsomorphicLayoutEffect(() => {
    if (active && count < 2) setSizes([ratio, 100 - ratio]);
  }, [active, count, ratio, setSizes]);
  return null;
}

/**
 * Conversation on one side and the working document on the other. On a wide view the
 * two are resizable regions with a divider; on a narrow one a tab switch shows one at a time.
 */
export const CanvasSplitView = React.forwardRef<HTMLDivElement, CanvasSplitViewProps>(
  function CanvasSplitView(
    {
      conversation,
      canvas,
      canvasOpen: canvasOpenProp,
      defaultCanvasOpen = true,
      onCanvasOpenChange,
      defaultRatio = 0.4,
      minConversation = 25,
      minCanvas = 30,
      narrowView: narrowViewProp,
      defaultNarrowView = 'conversation',
      onNarrowViewChange,
      breakpoint = 640,
      narrow: narrowProp,
      labels: labelsProp,
      className,
      ...props
    },
    ref,
  ) {
    const labels: CanvasSplitViewLabels = { ...defaultLabels, ...labelsProp };
    const rootRef = React.useRef<HTMLDivElement>(null);
    const composedRef = useComposedRefs(ref, rootRef);
    const [canvasOpen, setCanvasOpen] = useControllableState({
      value: canvasOpenProp,
      defaultValue: defaultCanvasOpen,
      onChange: onCanvasOpenChange,
    });
    const [narrowView, setNarrowView] = useControllableState<CanvasSplitViewNarrowView>({
      value: narrowViewProp,
      defaultValue: defaultNarrowView,
      onChange: onNarrowViewChange,
    });

    // The layout follows the width of the view itself, not of the window.
    const [measuredNarrow, setMeasuredNarrow] = React.useState(false);
    useIsomorphicLayoutEffect(() => {
      const root = rootRef.current;
      if (!root || narrowProp !== undefined) return;
      const read = () => {
        const width = root.clientWidth;
        if (width > 0) setMeasuredNarrow(width < breakpoint);
      };
      read();
      const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(read) : null;
      observer?.observe(root);
      return () => observer?.disconnect();
    }, [breakpoint, narrowProp]);
    const narrow = narrowProp ?? measuredNarrow;

    const showCanvas = canvasOpen && canvas != null;
    // A canvas that opens on a narrow view comes to the front; one that closes gives way.
    const wasShown = React.useRef(showCanvas);
    React.useEffect(() => {
      if (wasShown.current === showCanvas) return;
      wasShown.current = showCanvas;
      setNarrowView(showCanvas ? 'canvas' : 'conversation');
    }, [showCanvas, setNarrowView]);

    const context = React.useMemo(
      () => ({ canvasOpen, setCanvasOpen, narrow, narrowView, setNarrowView }),
      [canvasOpen, setCanvasOpen, narrow, narrowView, setNarrowView],
    );
    const ratio = Math.min(Math.max(defaultRatio, 0), 1) * 100;

    // Both layouts keep the conversation at the same place in the tree, so opening or
    // closing the canvas never remounts it and a draft or a scroll position survives.
    let content: React.ReactNode;
    if (narrow) {
      content = (
        <Tabs
          className="st-canvas-split-view__tabs"
          variant="pill"
          size="sm"
          value={showCanvas ? narrowView : 'conversation'}
          onValueChange={(next) => setNarrowView(next === 'canvas' ? 'canvas' : 'conversation')}
        >
          {showCanvas && (
            <TabsList aria-label={labels.views} fullWidth className="st-canvas-split-view__switch">
              <TabsTrigger value="conversation">{labels.conversation}</TabsTrigger>
              <TabsTrigger value="canvas">{labels.canvas}</TabsTrigger>
            </TabsList>
          )}
          <TabsContent
            value="conversation"
            forceMount
            className="st-canvas-split-view__pane"
            data-pane="conversation"
            // Without a tab to name it, the pane is a plain labelled region.
            {...(!showCanvas && {
              role: 'region',
              'aria-labelledby': undefined,
              'aria-label': labels.conversation,
            })}
          >
            {conversation}
          </TabsContent>
          {showCanvas && (
            <TabsContent
              value="canvas"
              forceMount
              className="st-canvas-split-view__pane"
              data-pane="canvas"
            >
              {canvas}
            </TabsContent>
          )}
        </Tabs>
      );
    } else {
      content = (
        <SplitPanel className="st-canvas-split-view__split">
          <ResizablePanel
            role="region"
            aria-label={labels.conversation}
            className="st-canvas-split-view__pane"
            data-pane="conversation"
            defaultSize={showCanvas ? ratio : 100}
            minSize={minConversation}
            maxSize={100 - minCanvas}
          >
            {conversation}
          </ResizablePanel>
          {showCanvas && <ResizeHandle aria-label={labels.resize} />}
          {showCanvas && (
            <ResizablePanel
              role="region"
              aria-label={labels.canvas}
              className="st-canvas-split-view__pane"
              data-pane="canvas"
              defaultSize={100 - ratio}
              minSize={minCanvas}
            >
              {canvas}
            </ResizablePanel>
          )}
          <SplitSizeSync active={showCanvas} ratio={ratio} />
        </SplitPanel>
      );
    }

    return (
      <CanvasSplitViewContext.Provider value={context}>
        <div
          ref={composedRef}
          className={cx('st-canvas-split-view', className)}
          data-layout={!showCanvas ? 'single' : narrow ? 'narrow' : 'wide'}
          data-canvas-open={showCanvas ? '' : undefined}
          {...props}
        >
          {content}
        </div>
      </CanvasSplitViewContext.Provider>
    );
  },
);

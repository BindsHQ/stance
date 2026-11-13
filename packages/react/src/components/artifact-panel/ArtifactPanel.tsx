'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import type { GenerationStatus } from '../../internal/generation-status.js';
import { useComposedRefs } from '../../internal/refs.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { useIsomorphicLayoutEffect } from '../../internal/use-isomorphic-layout-effect.js';
import { Icon } from '../../icons/Icon.js';
import { IconButton } from '../icon-button/IconButton.js';
import { NativeSelect } from '../native-select/NativeSelect.js';
import { ShimmerText } from '../shimmer-text/ShimmerText.js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../tabs/Tabs.js';

/** One saved version of an artifact. */
export interface ArtifactPanelVersion {
  /** Stable id. */
  id: string;
  /** The words for the version, for example "Version 2". */
  label: string;
}

/** The two ways to look at an artifact. */
export type ArtifactPanelView = 'preview' | 'code';

export interface ArtifactPanelLabels {
  /** Close button. Default "Close". */
  close: string;
  /** Name of the version switcher. Default "Version". */
  version: string;
  /** Name of the tab list. Default "View". */
  views: string;
  /** Preview tab. Default "Preview". */
  preview: string;
  /** Code tab. Default "Code". */
  code: string;
  /** Shown while the artifact is being made. Default "Generating". */
  generating: string;
  /** Shown when generation was stopped. Default "Stopped". */
  stopped: string;
  /** Shown when generation failed. Default "Something went wrong". */
  error: string;
}

export interface ArtifactPanelProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  /** The name of the artifact. It names the region. */
  title: React.ReactNode;
  /** The type of artifact in words, for example "Document" or "Web page". */
  kind?: React.ReactNode;
  /** The saved versions, oldest first. The switcher shows when there are two or more. */
  versions?: ArtifactPanelVersion[];
  /** Controlled id of the shown version. */
  versionId?: string;
  /** Version on first render when uncontrolled. Default: the last one. */
  defaultVersionId?: string;
  /** Called when the reader picks another version. */
  onVersionChange?: (id: string) => void;
  /** Controlled view. */
  view?: ArtifactPanelView;
  /** View on first render when uncontrolled. Default `preview`. */
  defaultView?: ArtifactPanelView;
  /** Called when the reader switches between preview and code. */
  onViewChange?: (view: ArtifactPanelView) => void;
  /** Actions in the header, before close: copy, download, publish. */
  actions?: React.ReactNode;
  /** Called when the reader closes the panel. Shows the close button. */
  onClose?: () => void;
  /** The preview. */
  children?: React.ReactNode;
  /** The source behind the preview. The preview and code tabs show when this is given. */
  code?: React.ReactNode;
  /** The generation status of the artifact. Default `complete`. */
  status?: GenerationStatus;
  /**
   * Where focus goes when the panel closes. Default: the element that had focus when the
   * panel appeared, which is usually the message action that opened it.
   */
  returnFocusRef?: React.RefObject<HTMLElement | null>;
  /** Heading level of the title. Default 2. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Translations for the built in strings. */
  labels?: Partial<ArtifactPanelLabels>;
}

const defaultLabels: ArtifactPanelLabels = {
  close: 'Close',
  version: 'Version',
  views: 'View',
  preview: 'Preview',
  code: 'Code',
  generating: 'Generating',
  stopped: 'Stopped',
  error: 'Something went wrong',
};

/**
 * A side panel for a generated document, page or app: a title, a version switcher,
 * preview and code tabs, and actions. Closing it returns focus to what opened it.
 */
export const ArtifactPanel = React.forwardRef<HTMLElement, ArtifactPanelProps>(
  function ArtifactPanel(
    {
      title,
      kind,
      versions,
      versionId: versionIdProp,
      defaultVersionId,
      onVersionChange,
      view: viewProp,
      defaultView = 'preview',
      onViewChange,
      actions,
      onClose,
      children,
      code,
      status = 'complete',
      returnFocusRef,
      headingLevel = 2,
      labels: labelsProp,
      className,
      ...props
    },
    ref,
  ) {
    const labels: ArtifactPanelLabels = { ...defaultLabels, ...labelsProp };
    const titleId = React.useId();
    const panelRef = React.useRef<HTMLElement>(null);
    const composedRef = useComposedRefs(ref, panelRef);
    const [view, setView] = useControllableState<ArtifactPanelView>({
      value: viewProp,
      defaultValue: defaultView,
      onChange: onViewChange,
    });
    const [versionId, setVersionId] = useControllableState<string>({
      value: versionIdProp,
      defaultValue: defaultVersionId ?? versions?.[versions.length - 1]?.id ?? '',
      onChange: onVersionChange,
    });

    // Remember what had focus when the panel appeared, so closing can give it back.
    const openerRef = React.useRef<HTMLElement | null>(null);
    const returnRef = React.useRef(returnFocusRef);
    returnRef.current = returnFocusRef;
    const restoreFocus = React.useCallback(() => {
      const target = returnRef.current?.current ?? openerRef.current;
      if (target?.isConnected) target.focus();
    }, []);
    useIsomorphicLayoutEffect(() => {
      const panel = panelRef.current;
      const active = document.activeElement;
      openerRef.current =
        active instanceof HTMLElement && active !== document.body && !panel?.contains(active)
          ? active
          : null;
      return () => {
        // Unmounted while focus was inside: do not strand the reader on the body.
        if (panel?.contains(document.activeElement)) restoreFocus();
      };
    }, [restoreFocus]);

    const busy = status === 'submitted' || status === 'streaming';
    const statusText = busy
      ? labels.generating
      : status === 'stopped'
        ? labels.stopped
        : status === 'error'
          ? labels.error
          : null;
    const Heading = `h${headingLevel}` as 'h2';
    const hasTabs = code != null;

    const header = (
      <div className="st-artifact-panel__header">
        <div className="st-artifact-panel__heading">
          <Heading id={titleId} className="st-artifact-panel__title">
            {title}
          </Heading>
          {kind != null && <span className="st-artifact-panel__kind">{kind}</span>}
          <span className="st-artifact-panel__status" role="status">
            {statusText &&
              (busy ? (
                <ShimmerText>{statusText}</ShimmerText>
              ) : (
                <>
                  {status === 'error' && <Icon name="alert-circle" size={14} />}
                  {statusText}
                </>
              ))}
          </span>
        </div>
        <div className="st-artifact-panel__controls">
          {versions && versions.length > 1 && (
            <NativeSelect
              size="sm"
              aria-label={labels.version}
              wrapperClassName="st-artifact-panel__version"
              value={versionId}
              onChange={(event) => setVersionId(event.target.value)}
              options={versions.map((version) => ({ value: version.id, label: version.label }))}
            />
          )}
          {versions?.length === 1 && (
            <span className="st-artifact-panel__kind">{versions[0]!.label}</span>
          )}
          {hasTabs && (
            <TabsList aria-label={labels.views} className="st-artifact-panel__views">
              <TabsTrigger value="preview">{labels.preview}</TabsTrigger>
              <TabsTrigger value="code">{labels.code}</TabsTrigger>
            </TabsList>
          )}
          {(actions != null || onClose) && (
            <span className="st-artifact-panel__actions">
              {actions}
              {onClose && (
                <IconButton
                  size="sm"
                  label={labels.close}
                  icon={<Icon name="x" size={16} />}
                  onClick={() => {
                    onClose();
                    restoreFocus();
                  }}
                />
              )}
            </span>
          )}
        </div>
      </div>
    );

    return (
      <aside
        ref={composedRef}
        aria-labelledby={titleId}
        className={cx('st-artifact-panel', className)}
        data-status={status}
        data-view={hasTabs ? view : 'preview'}
        {...props}
      >
        {hasTabs ? (
          <Tabs
            className="st-artifact-panel__tabs"
            variant="pill"
            size="sm"
            value={view}
            onValueChange={(next) => setView(next === 'code' ? 'code' : 'preview')}
          >
            {header}
            <TabsContent
              value="preview"
              forceMount
              className="st-artifact-panel__body"
              aria-busy={busy || undefined}
            >
              {children}
            </TabsContent>
            <TabsContent value="code" forceMount className="st-artifact-panel__body">
              {code}
            </TabsContent>
          </Tabs>
        ) : (
          <>
            {header}
            <div className="st-artifact-panel__body" aria-busy={busy || undefined}>
              {children}
            </div>
          </>
        )}
      </aside>
    );
  },
);

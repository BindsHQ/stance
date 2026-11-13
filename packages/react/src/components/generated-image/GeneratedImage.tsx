'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { logicalKey } from '../../internal/direction.js';
import { useAnnouncer } from '../../internal/use-announcer.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { Icon } from '../../icons/Icon.js';
import { IconButton } from '../icon-button/IconButton.js';
import { Skeleton } from '../skeleton/Skeleton.js';

/** `generating` while the image is being made, `ready` when it can be shown. */
export type GeneratedImageStatus = 'generating' | 'ready' | 'error';

/** An alternative version of the image. */
export interface GeneratedImageVariation {
  id: string;
  src: string;
  /** Describes this version. Required, like the main alt text. */
  alt: string;
}

export interface GeneratedImageLabels {
  /** Name of the progress bar while generating. Default "Generating image". */
  generating: string;
  /** Formats the progress. Default "40%". */
  progress: (value: number) => string;
  /** Announced when the image is ready. Default "Image ready". */
  ready: string;
  /** Shown and announced when the image could not be made. */
  error: string;
  /** Name of the group of variations. Default "Variations". */
  variations: string;
  /** Names one variation. Default "Variation 2 of 4". */
  variation: (index: number, count: number) => string;
  /** The words before the prompt. Default "Prompt". */
  prompt: string;
  /** Default "Download". */
  download: string;
  /** Default "Regenerate". */
  regenerate: string;
  /** Default "Edit". */
  edit: string;
}

export interface GeneratedImageProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  'onSelect' | 'children'
> {
  /** The image address. While generating it may be a partial preview, or be left out. */
  src?: string;
  /** Describes the image for people who cannot see it. Required. */
  alt: string;
  /** Where the image is in its life. Default `ready`. */
  status?: GeneratedImageStatus;
  /** Progress from 0 to 100 while generating. Omit for an indeterminate state. */
  progress?: number;
  /** Width over height, as a number or a CSS ratio such as `16 / 9`. Default 1. */
  aspectRatio?: number | string;
  /** Alternative versions. The selected one shows in the frame. */
  variations?: GeneratedImageVariation[];
  /** Controlled selected variation. */
  selectedId?: string;
  /** Variation selected on first render. Default: the first. */
  defaultSelectedId?: string;
  /** Called when the reader picks a variation. */
  onSelect?: (id: string) => void;
  /** Shows a download action. Receives the address of the image on show. */
  onDownload?: (src: string | undefined) => void;
  /** Shows a regenerate action. */
  onRegenerate?: () => void;
  /** Shows an edit action. */
  onEdit?: () => void;
  /** The prompt the image was made from, shown under it. */
  prompt?: React.ReactNode;
  /** Translations for the built in strings. */
  labels?: Partial<GeneratedImageLabels>;
}

const defaultLabels: GeneratedImageLabels = {
  generating: 'Generating image',
  progress: (value) => `${Math.round(value)}%`,
  ready: 'Image ready',
  error: 'Could not create this image',
  variations: 'Variations',
  variation: (index, count) => `Variation ${index} of ${count}`,
  prompt: 'Prompt',
  download: 'Download',
  regenerate: 'Regenerate',
  edit: 'Edit',
};

/**
 * A generated image with a loading state that holds its space, optional variations and
 * actions to download, regenerate and edit. Alt text is required.
 */
export const GeneratedImage = React.forwardRef<HTMLElement, GeneratedImageProps>(
  function GeneratedImage(
    {
      src,
      alt,
      status = 'ready',
      progress,
      aspectRatio = 1,
      variations,
      selectedId: selectedIdProp,
      defaultSelectedId,
      onSelect,
      onDownload,
      onRegenerate,
      onEdit,
      prompt,
      labels: labelsProp,
      className,
      style,
      ...props
    },
    ref,
  ) {
    const labels = { ...defaultLabels, ...labelsProp };
    const list = variations ?? [];
    const [selectedId, setSelectedId] = useControllableState<string | undefined>({
      value: selectedIdProp,
      defaultValue: defaultSelectedId ?? list[0]?.id,
      onChange: (id) => {
        if (id !== undefined) onSelect?.(id);
      },
    });
    const selected = list.find((v) => v.id === selectedId) ?? list[0];
    const shownSrc = selected?.src ?? src;
    const shownAlt = selected?.alt ?? alt;
    const generating = status === 'generating';
    const value =
      progress === undefined ? undefined : Math.min(100, Math.max(0, Math.round(progress)));

    const { announce, region } = useAnnouncer();
    const previous = React.useRef(status);
    const labelsRef = React.useRef(labels);
    labelsRef.current = labels;
    React.useEffect(() => {
      if (previous.current === status) return;
      const wasGenerating = previous.current === 'generating';
      previous.current = status;
      if (status === 'error') announce(labelsRef.current.error);
      else if (status === 'ready' && wasGenerating) announce(labelsRef.current.ready);
    }, [status, announce]);

    const groupRef = React.useRef<HTMLDivElement>(null);
    const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      const key = logicalKey(event.key, event.currentTarget);
      const index = list.findIndex((v) => v.id === selected?.id);
      let next = -1;
      if (key === 'ArrowRight' || key === 'ArrowDown') next = (index + 1) % list.length;
      else if (key === 'ArrowLeft' || key === 'ArrowUp')
        next = (index - 1 + list.length) % list.length;
      else if (key === 'Home') next = 0;
      else if (key === 'End') next = list.length - 1;
      if (next < 0) return;
      event.preventDefault();
      setSelectedId(list[next]!.id);
      groupRef.current?.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus();
    };

    const hasActions = onDownload || onRegenerate || onEdit;
    return (
      <figure
        ref={ref}
        className={cx('st-generated-image', className)}
        data-status={status}
        style={
          { '--st-generated-image-ratio': String(aspectRatio), ...style } as React.CSSProperties
        }
        {...props}
      >
        <div className="st-generated-image__frame">
          {status !== 'error' && shownSrc !== undefined && (
            <img
              className="st-generated-image__img"
              src={shownSrc}
              alt={shownAlt}
              data-partial={generating ? '' : undefined}
              decoding="async"
            />
          )}
          {generating && (
            <div
              className="st-generated-image__progress"
              role="progressbar"
              aria-label={labels.generating}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={value}
              aria-valuetext={value === undefined ? labels.generating : labels.progress(value)}
            >
              {shownSrc === undefined && (
                <Skeleton
                  variant="rect"
                  width="100%"
                  height="100%"
                  className="st-generated-image__skeleton"
                />
              )}
              <span className="st-generated-image__status">
                <Icon name="sparkle" size={14} />
                {labels.generating}
                {value !== undefined && (
                  <span className="st-generated-image__value">{labels.progress(value)}</span>
                )}
              </span>
            </div>
          )}
          {status === 'error' && (
            <div className="st-generated-image__error">
              <Icon name="alert-circle" size={20} />
              <span>{labels.error}</span>
            </div>
          )}
        </div>
        {list.length > 1 && (
          <div
            ref={groupRef}
            className="st-generated-image__variations"
            role="radiogroup"
            aria-label={labels.variations}
            onKeyDown={onKeyDown}
          >
            {list.map((variation, index) => {
              const checked = variation.id === selected?.id;
              return (
                <button
                  key={variation.id}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  aria-label={`${labels.variation(index + 1, list.length)}: ${variation.alt}`}
                  tabIndex={checked ? 0 : -1}
                  className="st-generated-image__variation"
                  onClick={() => setSelectedId(variation.id)}
                >
                  <img src={variation.src} alt="" decoding="async" />
                  {checked && (
                    <span className="st-generated-image__check" aria-hidden="true">
                      <Icon name="check" size={12} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
        {(prompt != null || hasActions) && (
          <figcaption className="st-generated-image__footer">
            {prompt != null && (
              <p className="st-generated-image__prompt">
                <span className="st-generated-image__prompt-label">{labels.prompt}</span> {prompt}
              </p>
            )}
            {hasActions && (
              <div className="st-generated-image__actions">
                {onDownload && (
                  <IconButton
                    size="sm"
                    label={labels.download}
                    icon={<Icon name="download" />}
                    disabled={status !== 'ready'}
                    onClick={() => onDownload(shownSrc)}
                  />
                )}
                {onRegenerate && (
                  <IconButton
                    size="sm"
                    label={labels.regenerate}
                    icon={<Icon name="refresh" />}
                    disabled={generating}
                    onClick={onRegenerate}
                  />
                )}
                {onEdit && (
                  <IconButton
                    size="sm"
                    label={labels.edit}
                    icon={<Icon name="pencil" />}
                    disabled={status !== 'ready'}
                    onClick={onEdit}
                  />
                )}
              </div>
            )}
          </figcaption>
        )}
        {region}
      </figure>
    );
  },
);

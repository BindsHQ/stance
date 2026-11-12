'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../hover-card/HoverCard.js';
import {
  SourcePreview,
  type Source,
  type SourcePreviewLabels,
} from '../source-preview/SourcePreview.js';

export interface CitationChipLabels extends SourcePreviewLabels {
  /** Builds the accessible name. Default "Source 2: title". */
  source: (index: number, title: string) => string;
}

export interface CitationChipProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  /** The citation number shown in the marker. */
  index: number;
  /** The source this marker points to. */
  source: Source;
  /** Called when the reader opens the source, from the marker or from its preview. */
  onOpen?: (source: Source) => void;
  /** Link for the marker. Defaults to `source.url`. Without either, the marker is a button. */
  href?: string;
  /** Link target. Default `_blank`. */
  target?: React.HTMLAttributeAnchorTarget;
  /** Show the source preview on hover, focus and tap. Default true. */
  preview?: boolean;
  /** Controlled open state of the preview. */
  previewOpen?: boolean;
  /** Called when the preview opens or closes. */
  onPreviewOpenChange?: (open: boolean) => void;
  /** Delay before the preview opens on hover, in ms. Default 300. */
  openDelay?: number;
  /** Translations for the built in strings. */
  labels?: Partial<CitationChipLabels>;
}

/**
 * An inline numbered marker that links a claim to its source. Hover, keyboard focus or a
 * tap shows a preview of the source; activating the marker opens it.
 */
export const CitationChip = React.forwardRef<HTMLElement, CitationChipProps>(function CitationChip(
  {
    index,
    source,
    onOpen,
    href,
    target = '_blank',
    preview = true,
    previewOpen,
    onPreviewOpenChange,
    openDelay = 300,
    labels: labelsProp,
    className,
    onClick,
    onPointerDown,
    ...props
  },
  ref,
) {
  const labels: CitationChipLabels = {
    source: (i, title) => `Source ${i}: ${title}`,
    newTab: 'opens in a new tab',
    ...labelsProp,
  };
  const [open, setOpen] = useControllableState({
    value: previewOpen,
    defaultValue: false,
    onChange: onPreviewOpenChange,
  });
  const touch = React.useRef(false);
  const previewId = `${React.useId()}-citation`;
  const url = href ?? source.url;
  const shown = preview && open;

  const shared = {
    className: cx('st-citation-chip', className),
    'aria-label': labels.source(index, source.title),
    'aria-describedby': shown ? previewId : undefined,
    'data-state': shown ? 'open' : 'closed',
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      onPointerDown?.(event);
      touch.current = event.pointerType === 'touch';
    },
    onClick: (event: React.MouseEvent<HTMLElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      // On touch there is no hover, so a tap shows the preview, which holds the link.
      if (touch.current && preview) {
        touch.current = false;
        event.preventDefault();
        setOpen(!open);
        return;
      }
      onOpen?.(source);
    },
    ...props,
  };
  const number = <span className="st-citation-chip__number">{index}</span>;
  const marker = url ? (
    <a
      ref={ref as React.Ref<HTMLAnchorElement>}
      href={url}
      target={target}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      {...shared}
    >
      {number}
    </a>
  ) : (
    <button ref={ref as React.Ref<HTMLButtonElement>} type="button" {...shared}>
      {number}
    </button>
  );
  if (!preview) return marker;
  return (
    <HoverCard open={open} onOpenChange={setOpen} openDelay={openDelay} closeDelay={150}>
      <HoverCardTrigger asChild>{marker}</HoverCardTrigger>
      <HoverCardContent id={previewId} side="top" className="st-citation-chip__preview">
        <SourcePreview
          source={source}
          index={index}
          size="sm"
          target={target}
          labels={{ newTab: labels.newTab }}
          {...(onOpen && { onOpen })}
        />
      </HoverCardContent>
    </HoverCard>
  );
});

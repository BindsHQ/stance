'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { Icon } from '../../icons/Icon.js';
import type { IconName } from '../../icons/paths.js';
import { IconButton } from '../icon-button/IconButton.js';

/** The broad type of a file. It picks the icon; `kindLabel` or the labels give the words. */
export type FilePreviewCardKind =
  'document' | 'image' | 'code' | 'data' | 'pdf' | 'archive' | 'folder' | 'other';

/** `generating` while the file is being made, `ready` when it can be opened. */
export type FilePreviewCardStatus = 'generating' | 'ready' | 'error';

export interface FilePreviewCardLabels {
  /** Names the open action. Default "Open report.pdf". */
  open: (name: string) => string;
  /** Names the download action. Default "Download report.pdf". */
  download: (name: string) => string;
  /** Shown while the file is being made. Default "Generating". */
  generating: string;
  /** Shown when the file could not be made. Default "Could not create this file". */
  error: string;
  /** Formats the progress for assistive technology. Default "40%". */
  progress: (value: number) => string;
  /** The words for each kind. */
  kind: Record<FilePreviewCardKind, string>;
}

export interface FilePreviewCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** The file name, with its extension. */
  name: string;
  /** The broad type of the file. Default `document`. */
  kind?: FilePreviewCardKind;
  /** Overrides the words for the kind, for example "Spreadsheet". */
  kindLabel?: string;
  /** The size: a number of bytes, or text that is already formatted. */
  size?: number | string;
  /** Extra detail after the kind and size, such as a page count or a date. */
  meta?: React.ReactNode;
  /** A preview: an image URL, or any node. Without it the card shows the kind icon. */
  thumbnail?: string | React.ReactNode;
  /** Where the file is in its life. Default `ready`. */
  status?: FilePreviewCardStatus;
  /** Progress from 0 to 100 while generating. Omit for an indeterminate bar. */
  progress?: number;
  /** Called when the reader opens the file. Shows the open action. */
  onOpen?: () => void;
  /** Called when the reader downloads the file. Shows the download action. */
  onDownload?: () => void;
  /** Extra actions after open and download. */
  actions?: React.ReactNode;
  /** `row` is a compact horizontal card; `tile` puts a larger preview on top. Default `row`. */
  layout?: 'row' | 'tile';
  /** Translations for the built in strings. Nested groups can be partial too. */
  labels?: Partial<Omit<FilePreviewCardLabels, 'kind'>> & {
    kind?: Partial<Record<FilePreviewCardKind, string>>;
  };
}

const kindIcons: Record<FilePreviewCardKind, IconName> = {
  document: 'file-text',
  image: 'image',
  code: 'code',
  data: 'bar-chart',
  pdf: 'file-text',
  archive: 'inbox',
  folder: 'folder',
  other: 'file',
};

const defaultLabels: FilePreviewCardLabels = {
  open: (name) => `Open ${name}`,
  download: (name) => `Download ${name}`,
  generating: 'Generating',
  error: 'Could not create this file',
  progress: (value) => `${Math.round(value)}%`,
  kind: {
    document: 'Document',
    image: 'Image',
    code: 'Code',
    data: 'Data',
    pdf: 'PDF',
    archive: 'Archive',
    folder: 'Folder',
    other: 'File',
  },
};

/** Formats a number of bytes as short text: 820 B, 2.4 MB. */
function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '';
  const units = ['B', 'kB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1000 && unit < units.length - 1) {
    value /= 1000;
    unit++;
  }
  const rounded = unit === 0 || value >= 100 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded} ${units[unit]}`;
}

/**
 * A card for a file the assistant made or used: its name, type and size, a preview,
 * and actions to open and download it. While the file is being made it shows progress.
 */
export const FilePreviewCard = React.forwardRef<HTMLDivElement, FilePreviewCardProps>(
  function FilePreviewCard(
    {
      name,
      kind = 'document',
      kindLabel,
      size,
      meta,
      thumbnail,
      status = 'ready',
      progress,
      onOpen,
      onDownload,
      actions,
      layout = 'row',
      labels: labelsProp,
      className,
      ...props
    },
    ref,
  ) {
    const labels: FilePreviewCardLabels = {
      ...defaultLabels,
      ...labelsProp,
      kind: { ...defaultLabels.kind, ...labelsProp?.kind },
    };
    const generating = status === 'generating';
    const failed = status === 'error';
    const sizeText = typeof size === 'number' ? formatSize(size) : size;
    const details = [kindLabel ?? labels.kind[kind], sizeText].filter(Boolean);
    const value =
      progress === undefined ? undefined : Math.min(100, Math.max(0, Math.round(progress)));

    return (
      <div
        ref={ref}
        role="group"
        aria-label={name}
        aria-busy={generating || undefined}
        className={cx('st-file-preview-card', className)}
        data-status={status}
        data-layout={layout}
        data-kind={kind}
        {...props}
      >
        <span className="st-file-preview-card__thumbnail" aria-hidden="true">
          {typeof thumbnail === 'string' ? (
            <img className="st-file-preview-card__image" src={thumbnail} alt="" />
          ) : (
            (thumbnail ?? <Icon name={failed ? 'alert-circle' : kindIcons[kind]} size={20} />)
          )}
        </span>
        <span className="st-file-preview-card__body">
          <span className="st-file-preview-card__name" title={name}>
            {name}
          </span>
          {failed ? (
            <span className="st-file-preview-card__error" role="alert">
              {labels.error}
            </span>
          ) : generating ? (
            <span className="st-file-preview-card__progress">
              <span
                className="st-file-preview-card__track"
                role="progressbar"
                aria-label={labels.generating}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={value}
                aria-valuetext={value === undefined ? undefined : labels.progress(value)}
                data-indeterminate={value === undefined ? '' : undefined}
              >
                <span
                  className="st-file-preview-card__fill"
                  style={value === undefined ? undefined : { inlineSize: `${value}%` }}
                />
              </span>
              <span className="st-file-preview-card__meta" aria-hidden="true">
                {labels.generating}
                {value !== undefined && ` ${labels.progress(value)}`}
              </span>
            </span>
          ) : (
            <span className="st-file-preview-card__meta">
              {details.map((detail, i) => (
                <span key={i} className="st-file-preview-card__detail">
                  {detail}
                </span>
              ))}
              {meta != null && <span className="st-file-preview-card__detail">{meta}</span>}
            </span>
          )}
        </span>
        {(onOpen || onDownload || actions) && (
          <span className="st-file-preview-card__actions">
            {onOpen && (
              <IconButton
                size="sm"
                label={labels.open(name)}
                icon={<Icon name="external-link" size={16} />}
                disabled={status !== 'ready'}
                onClick={onOpen}
              />
            )}
            {onDownload && (
              <IconButton
                size="sm"
                label={labels.download(name)}
                icon={<Icon name="download" size={16} />}
                disabled={status !== 'ready'}
                onClick={onDownload}
              />
            )}
            {actions}
          </span>
        )}
      </div>
    );
  },
);

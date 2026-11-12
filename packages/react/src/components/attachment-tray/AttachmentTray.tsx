'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useComposedRefs } from '../../internal/refs.js';
import { useAnnouncer } from '../../internal/use-announcer.js';
import { Icon } from '../../icons/Icon.js';

export interface AttachmentItem {
  /** Stable identifier. */
  id: string;
  /** File name, shown and used to name the remove button. */
  name: string;
  /** Images show a thumbnail; files show an icon. */
  kind: 'image' | 'file';
  /** Size in bytes. */
  size?: number;
  /** Thumbnail address for images. */
  previewUrl?: string;
  /** Upload progress from 0 to 1. Leave out once the upload is done. */
  progress?: number;
  /** A message when the upload failed. Shown on the item and announced once. */
  error?: string;
}

export interface AttachmentTrayLabels {
  /** Accessible name of the list. Default "Attachments". */
  list: string;
  /** Names the remove button of one file. Default "Remove {name}". */
  remove: (name: string) => string;
  /** Names the progress bar of one file. Default "Uploading {name}". */
  uploading: (name: string) => string;
  /** Announced when an upload fails. Default "{name} could not be attached. {error}". */
  failed: (name: string, error: string) => string;
}

export interface AttachmentTrayProps extends Omit<
  React.HTMLAttributes<HTMLUListElement>,
  'children'
> {
  /** The attachments to show. An empty list renders nothing. */
  items: AttachmentItem[];
  /** Called with the id of the attachment to remove. Without it there are no remove buttons. */
  onRemove?: (id: string) => void;
  /** Show the attachments of a sent message: no remove buttons. Default false. */
  readOnly?: boolean;
  /** Formats a size in bytes. Default gives "12 KB" or "1.4 MB". */
  formatSize?: (bytes: number) => string;
  /** Translations for the built in strings. */
  labels?: Partial<AttachmentTrayLabels>;
}

const defaultLabels: AttachmentTrayLabels = {
  list: 'Attachments',
  remove: (name) => `Remove ${name}`,
  uploading: (name) => `Uploading ${name}`,
  failed: (name, error) => `${name} could not be attached. ${error}`,
};

const defaultFormatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) return `${mb < 10 ? Math.round(mb * 10) / 10 : Math.round(mb)} MB`;
  return `${Math.round((mb / 1024) * 10) / 10} GB`;
};

/**
 * The attachments on a draft or a sent message: files and images with upload progress,
 * errors and remove buttons.
 */
export const AttachmentTray = React.forwardRef<HTMLUListElement, AttachmentTrayProps>(
  function AttachmentTray(
    {
      items,
      onRemove,
      readOnly = false,
      formatSize = defaultFormatSize,
      labels: labelsProp,
      className,
      ...props
    },
    forwardedRef,
  ) {
    const labels = { ...defaultLabels, ...labelsProp };
    const listRef = React.useRef<HTMLUListElement>(null);
    const composed = useComposedRefs(forwardedRef, listRef);
    const { announce, region } = useAnnouncer();
    const removable = !readOnly && Boolean(onRemove);

    // Announce each failure once, when it first appears after the tray is on screen.
    const seenErrors = React.useRef<Set<string> | null>(null);
    const failed = labels.failed;
    React.useEffect(() => {
      const current = new Set(
        items.filter((item) => item.error).map((item) => `${item.id}\u0000${item.error}`),
      );
      const previous = seenErrors.current;
      seenErrors.current = current;
      if (!previous) return;
      const fresh = items.filter(
        (item) => item.error && !previous.has(`${item.id}\u0000${item.error}`),
      );
      if (fresh.length)
        announce(fresh.map((item) => failed(item.name, item.error as string)).join(' '));
    }, [items, announce, failed]);

    // After a removal, keep keyboard focus in the tray: on the next remove button, or the list.
    const pendingFocus = React.useRef<number | null>(null);
    React.useEffect(() => {
      const index = pendingFocus.current;
      if (index === null) return;
      pendingFocus.current = null;
      const list = listRef.current;
      if (!list || list.contains(document.activeElement)) return;
      const buttons = list.querySelectorAll<HTMLButtonElement>('.st-attachment-tray__remove');
      (buttons[Math.min(index, buttons.length - 1)] ?? list).focus();
    }, [items]);

    if (items.length === 0) return region;

    return (
      <>
        <ul
          ref={composed}
          aria-label={labels.list}
          tabIndex={-1}
          className={cx('st-attachment-tray', className)}
          data-readonly={readOnly ? '' : undefined}
          {...props}
        >
          {items.map((item, index) => {
            const uploading = !item.error && typeof item.progress === 'number' && item.progress < 1;
            const percent = uploading
              ? Math.round(Math.min(Math.max(item.progress as number, 0), 1) * 100)
              : 0;
            return (
              <li
                key={item.id}
                className="st-attachment-tray__item"
                data-kind={item.kind}
                data-state={item.error ? 'error' : uploading ? 'uploading' : 'ready'}
              >
                <span className="st-attachment-tray__visual" aria-hidden="true">
                  {item.kind === 'image' && item.previewUrl ? (
                    <img className="st-attachment-tray__thumbnail" src={item.previewUrl} alt="" />
                  ) : (
                    <Icon
                      name={item.error ? 'alert-circle' : item.kind === 'image' ? 'image' : 'file'}
                      size={18}
                    />
                  )}
                </span>
                <span className="st-attachment-tray__body">
                  <span className="st-attachment-tray__name" title={item.name}>
                    {item.name}
                  </span>
                  {item.error ? (
                    <span className="st-attachment-tray__error">{item.error}</span>
                  ) : uploading ? (
                    <span
                      role="progressbar"
                      aria-label={labels.uploading(item.name)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={percent}
                      aria-valuetext={`${percent}%`}
                      className="st-attachment-tray__progress"
                    >
                      <span
                        className="st-attachment-tray__progress-bar"
                        style={{ inlineSize: `${percent}%` }}
                      />
                    </span>
                  ) : (
                    typeof item.size === 'number' && (
                      <span className="st-attachment-tray__meta">{formatSize(item.size)}</span>
                    )
                  )}
                </span>
                {removable && (
                  <button
                    type="button"
                    className="st-attachment-tray__remove"
                    aria-label={labels.remove(item.name)}
                    title={labels.remove(item.name)}
                    onClick={() => {
                      pendingFocus.current = index;
                      onRemove?.(item.id);
                    }}
                  >
                    <Icon name="x" size={14} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        {region}
      </>
    );
  },
);

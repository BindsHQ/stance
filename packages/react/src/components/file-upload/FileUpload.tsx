'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { Icon } from '../../icons/Icon.js';
import { useFormFieldControl } from '../form-field/FormField.js';

export type FileRejectionReason = 'file-too-large' | 'file-invalid-type' | 'too-many-files';

export interface FileRejection {
  file: File;
  reason: FileRejectionReason;
  message: string;
}

export interface FileUploadProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'defaultValue' | 'onChange' | 'title'
> {
  /** Accepted types, as for the native `accept` attribute: ".pdf,image/*". */
  accept?: string;
  /** Maximum size per file in bytes. */
  maxSize?: number;
  /** Maximum number of files (when `multiple`). */
  maxFiles?: number;
  multiple?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  required?: boolean;
  /** Controlled list of accepted files. */
  value?: File[];
  defaultValue?: File[];
  onFilesChange?: (files: File[]) => void;
  /** Called with files that failed validation. */
  onReject?: (rejections: FileRejection[]) => void;
  /** Heading inside the drop zone. */
  title?: React.ReactNode;
  /** Supporting text, e.g. "PDF or DOCX, up to 10 MB". */
  hint?: React.ReactNode;
  /** Text of the browse button. Default "Browse files". */
  buttonLabel?: string;
  /** `dropzone` shows a drag-and-drop area; `compact` shows only a button and list. Default `dropzone`. */
  variant?: 'dropzone' | 'compact';
  /** Hide the selected-file list (render your own). */
  hideFileList?: boolean;
  /** Field name for native form submission. */
  name?: string;
  id?: string;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v < 10 ? v.toFixed(1) : Math.round(v)} ${units[i]}`;
}

function matchesAccept(file: File, accept?: string): boolean {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return accept
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .some((rule) => {
      if (rule.startsWith('.')) return name.endsWith(rule);
      if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, -1));
      return type === rule;
    });
}

/** Select files by browsing or dragging, with type, size and count validation. */
export const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(function FileUpload(
  {
    accept,
    maxSize,
    maxFiles,
    multiple = false,
    disabled: disabledProp,
    invalid,
    required,
    value,
    defaultValue = [],
    onFilesChange,
    onReject,
    title = 'Drag files here',
    hint,
    buttonLabel = 'Browse files',
    variant = 'dropzone',
    hideFileList = false,
    name,
    id,
    className,
    ...props
  },
  ref,
) {
  const [files, setFiles] = useControllableState({ value, defaultValue, onChange: onFilesChange });
  const field = useFormFieldControl<{
    id?: string | undefined;
    disabled?: boolean | undefined;
    required?: boolean | undefined;
    'aria-invalid'?: boolean | undefined;
    'aria-describedby'?: string | undefined;
  }>({
    id,
    disabled: disabledProp,
    required,
    ...(invalid !== undefined && { 'aria-invalid': invalid }),
  });
  const disabled = !!field.disabled;
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [rejections, setRejections] = React.useState<FileRejection[]>([]);
  const [announcement, setAnnouncement] = React.useState('');
  const hintId = React.useId();
  const isInvalid = String(field['aria-invalid']) === 'true' || rejections.length > 0;

  const addFiles = (incoming: File[]) => {
    const accepted: File[] = [];
    const rejected: FileRejection[] = [];
    const base = multiple ? files : [];
    for (const file of incoming) {
      if (!matchesAccept(file, accept)) {
        rejected.push({
          file,
          reason: 'file-invalid-type',
          message: `${file.name} is not an accepted file type.`,
        });
      } else if (maxSize !== undefined && file.size > maxSize) {
        rejected.push({
          file,
          reason: 'file-too-large',
          message: `${file.name} is larger than ${formatBytes(maxSize)}.`,
        });
      } else if (
        (!multiple && accepted.length >= 1) ||
        (maxFiles !== undefined && base.length + accepted.length >= maxFiles)
      ) {
        rejected.push({
          file,
          reason: 'too-many-files',
          message: `${file.name} was not added: the limit is ${multiple ? (maxFiles ?? 1) : 1} file${(maxFiles ?? 1) === 1 ? '' : 's'}.`,
        });
      } else {
        accepted.push(file);
      }
    }
    setRejections(rejected);
    if (rejected.length) onReject?.(rejected);
    if (accepted.length) {
      const next = [...base, ...accepted];
      setFiles(next);
      setAnnouncement(
        `${accepted.length} file${accepted.length === 1 ? '' : 's'} added. ${next.length} selected.`,
      );
    }
  };

  const remove = (index: number) => {
    const removed = files[index];
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    setAnnouncement(`${removed?.name ?? 'File'} removed. ${next.length} selected.`);
    if (inputRef.current) inputRef.current.value = '';
  };

  // Keep the native input in sync so dropped and removed files are reflected in native form posts.
  React.useEffect(() => {
    const input = inputRef.current;
    if (!input || typeof DataTransfer === 'undefined') return;
    try {
      const transfer = new DataTransfer();
      for (const file of files) transfer.items.add(file);
      input.files = transfer.files;
    } catch {
      /* Older browsers cannot assign FileList; onFilesChange still reports every file. */
    }
  }, [files]);

  const describedBy =
    [field['aria-describedby'], hint != null ? hintId : undefined].filter(Boolean).join(' ') ||
    undefined;

  const browse = (
    <button
      type="button"
      id={field.id}
      className="st-button st-file-upload__browse"
      data-variant={variant === 'dropzone' ? 'outline' : 'secondary'}
      data-size="sm"
      disabled={disabled}
      aria-describedby={describedBy}
      onClick={() => inputRef.current?.click()}
    >
      <Icon name="upload" size={14} />
      <span className="st-button__label">{buttonLabel}</span>
    </button>
  );

  return (
    <div
      ref={ref}
      className={cx('st-file-upload', className)}
      data-variant={variant}
      data-disabled={disabled ? '' : undefined}
      data-invalid={isInvalid ? '' : undefined}
      {...props}
    >
      <input
        ref={inputRef}
        type="file"
        className="st-sr-only"
        tabIndex={-1}
        aria-hidden="true"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        name={name}
        onChange={(e) => {
          addFiles(Array.from(e.target.files ?? []));
        }}
      />
      {variant === 'dropzone' ? (
        <div
          className="st-file-upload__dropzone"
          data-dragging={dragging ? '' : undefined}
          onDragEnter={(e) => {
            if (disabled) return;
            e.preventDefault();
            setDragging(true);
          }}
          onDragOver={(e) => {
            if (disabled) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
          }}
          onDrop={(e) => {
            if (disabled) return;
            e.preventDefault();
            setDragging(false);
            addFiles(Array.from(e.dataTransfer.files));
          }}
          onClick={(e) => {
            if (!disabled && e.target === e.currentTarget) inputRef.current?.click();
          }}
        >
          <span className="st-file-upload__icon" aria-hidden="true">
            <Icon name="upload" size={20} />
          </span>
          <span className="st-file-upload__title">{title}</span>
          {hint != null && (
            <span id={hintId} className="st-file-upload__hint">
              {hint}
            </span>
          )}
          {browse}
        </div>
      ) : (
        <div className="st-file-upload__compact">
          {browse}
          {hint != null && (
            <span id={hintId} className="st-file-upload__hint">
              {hint}
            </span>
          )}
        </div>
      )}
      {rejections.length > 0 && (
        <ul className="st-file-upload__errors" role="alert">
          {rejections.map((r) => (
            <li key={`${r.file.name}-${r.reason}`}>{r.message}</li>
          ))}
        </ul>
      )}
      {!hideFileList && files.length > 0 && (
        <ul className="st-file-upload__list" aria-label="Selected files">
          {files.map((file, i) => (
            <li key={`${file.name}-${file.size}-${i}`} className="st-file-upload__item">
              <Icon
                name={file.type.startsWith('image/') ? 'image' : 'file-text'}
                size={16}
                className="st-file-upload__file-icon"
              />
              <span className="st-file-upload__name" title={file.name}>
                {file.name}
              </span>
              <span className="st-file-upload__size">{formatBytes(file.size)}</span>
              <button
                type="button"
                className="st-file-upload__remove"
                aria-label={`Remove ${file.name}`}
                title={`Remove ${file.name}`}
                disabled={disabled}
                onClick={() => remove(i)}
              >
                <Icon name="x" size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <span className="st-sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
});

'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { Icon } from '../../icons/Icon.js';

export interface InlineEditLabels {
  confirm: string;
  cancel: string;
}

export interface InlineEditProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> {
  /** Controlled committed value. */
  value?: string;
  defaultValue?: string;
  /** Called with the new value when the edit is committed. */
  onCommit?: (value: string) => void;
  onCancel?: () => void;
  /** Return an error message to reject the value and keep editing. */
  validate?: (value: string) => string | undefined;
  /** What is being edited, e.g. "template name". The read view is named "Edit <label>". */
  label: string;
  /** Shown in the read view when the value is empty. */
  placeholder?: string;
  /** Edit in a textarea. Enter adds a line; Ctrl/⌘+Enter commits. */
  multiline?: boolean;
  /** Show confirm and cancel buttons while editing. With them, blur no longer commits. */
  showActions?: boolean;
  /** Start in edit mode. */
  defaultEditing?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  /** Matches the text size of the surrounding content. Default `md`. */
  size?: 'sm' | 'md' | 'lg';
  /** Trim whitespace before committing. Default true. */
  trim?: boolean;
  labels?: Partial<InlineEditLabels>;
}

/**
 * Text that can be edited in place. The read view is a button; activating it swaps in
 * an input. Enter or leaving the field commits, Escape cancels.
 */
export const InlineEdit = React.forwardRef<HTMLDivElement, InlineEditProps>(function InlineEdit(
  {
    value: valueProp,
    defaultValue = '',
    onCommit,
    onCancel,
    validate,
    label,
    placeholder = 'Add a value',
    multiline = false,
    showActions = false,
    defaultEditing = false,
    disabled = false,
    readOnly = false,
    size = 'md',
    trim = true,
    labels: labelsProp,
    className,
    ...props
  },
  ref,
) {
  const labels = { confirm: 'Save', cancel: 'Cancel', ...labelsProp };
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange: onCommit,
  });
  const [editing, setEditing] = React.useState(defaultEditing && !disabled && !readOnly);
  const [draft, setDraft] = React.useState(value);
  const [error, setError] = React.useState<string | undefined>(undefined);
  const readRef = React.useRef<HTMLButtonElement>(null);
  const inputRef = React.useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const restoreFocus = React.useRef(false);
  const errorId = React.useId();

  React.useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    } else if (restoreFocus.current) {
      restoreFocus.current = false;
      readRef.current?.focus();
    }
  }, [editing]);

  const start = () => {
    if (disabled || readOnly) return;
    setDraft(value);
    setError(undefined);
    setEditing(true);
  };
  const commit = (focusRead: boolean) => {
    const next = trim ? draft.trim() : draft;
    const message = validate?.(next);
    if (message) {
      setError(message);
      inputRef.current?.focus();
      return;
    }
    restoreFocus.current = focusRead;
    setEditing(false);
    setError(undefined);
    if (next !== value) setValue(next);
  };
  const cancel = () => {
    restoreFocus.current = true;
    setEditing(false);
    setError(undefined);
    setDraft(value);
    onCancel?.();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      cancel();
    } else if (event.key === 'Enter' && (!multiline || event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      commit(true);
    }
  };
  const onBlur = (event: React.FocusEvent) => {
    // Moving between the field and its own buttons is not leaving the editor.
    if (rootRef.current?.contains(event.relatedTarget as Node | null)) return;
    if (showActions) return;
    commit(false);
  };

  const Field = multiline ? 'textarea' : 'input';
  const empty = value === '';

  return (
    <div
      ref={(node) => {
        rootRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      className={cx('st-inline-edit', className)}
      data-size={size}
      data-editing={editing ? '' : undefined}
      data-invalid={error ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      data-multiline={multiline ? '' : undefined}
      {...props}
    >
      {editing ? (
        <>
          <div className="st-inline-edit__editor">
            <Field
              ref={inputRef}
              className="st-inline-edit__input"
              {...(!multiline && { type: 'text' })}
              {...(multiline && { rows: 3 })}
              value={draft}
              aria-label={label}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                setDraft(e.target.value);
                if (error) setError(undefined);
              }}
              onKeyDown={onKeyDown}
              onBlur={onBlur}
            />
            {showActions && (
              <span className="st-inline-edit__actions">
                <button
                  type="button"
                  className="st-inline-edit__action"
                  aria-label={labels.confirm}
                  title={labels.confirm}
                  onClick={() => commit(true)}
                >
                  <Icon name="check" size={16} />
                </button>
                <button
                  type="button"
                  className="st-inline-edit__action"
                  aria-label={labels.cancel}
                  title={labels.cancel}
                  onClick={cancel}
                >
                  <Icon name="x" size={16} />
                </button>
              </span>
            )}
          </div>
          {error && (
            <p id={errorId} className="st-inline-edit__error" role="alert">
              {error}
            </p>
          )}
        </>
      ) : readOnly ? (
        <span className="st-inline-edit__static" data-empty={empty ? '' : undefined}>
          {empty ? placeholder : value}
        </span>
      ) : (
        <button
          ref={readRef}
          type="button"
          className="st-inline-edit__read"
          data-empty={empty ? '' : undefined}
          disabled={disabled}
          onClick={start}
        >
          {/* Hidden prefix instead of aria-label, so the visible text stays in the accessible name (WCAG 2.5.3). */}
          <span className="st-sr-only">Edit {label}: </span>
          <span className="st-inline-edit__value">{empty ? placeholder : value}</span>
          <Icon name="pencil" size={14} className="st-inline-edit__icon" />
        </button>
      )}
    </div>
  );
});

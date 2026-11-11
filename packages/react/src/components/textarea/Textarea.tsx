'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useComposedRefs } from '../../internal/refs.js';
import { useIsomorphicLayoutEffect } from '../../internal/use-isomorphic-layout-effect.js';
import { useFormFieldControl } from '../form-field/FormField.js';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Grow with content between `rows` and `maxRows`. */
  autoResize?: boolean;
  /** Upper bound when auto-resizing. Default 12. */
  maxRows?: number;
  /** Show a character counter (uses `maxLength` as the limit when set). */
  showCount?: boolean;
  invalid?: boolean;
  /** Default `vertical` (ignored when autoResize). */
  resize?: 'none' | 'vertical' | 'both';
  wrapperClassName?: string;
}

/** Multi-line text input with optional auto-resize and character count. */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    autoResize = false,
    maxRows = 12,
    rows = 3,
    showCount = false,
    invalid,
    resize = 'vertical',
    className,
    wrapperClassName,
    onChange,
    value,
    defaultValue,
    ...rest
  },
  forwardedRef,
) {
  const props = useFormFieldControl({
    ...rest,
    ...(invalid !== undefined && { 'aria-invalid': invalid }),
  });
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const composed = useComposedRefs(forwardedRef, ref);
  const countId = React.useId();
  const [length, setLength] = React.useState(() => String(value ?? defaultValue ?? '').length);

  const fit = React.useCallback(() => {
    const el = ref.current;
    if (!el || !autoResize) return;
    const style = window.getComputedStyle(el);
    const line = parseFloat(style.lineHeight) || 20;
    const pad = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    el.style.height = 'auto';
    const max = line * maxRows + pad;
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
    el.style.overflowY = el.scrollHeight > max ? 'auto' : 'hidden';
  }, [autoResize, maxRows]);

  useIsomorphicLayoutEffect(() => {
    if (value !== undefined) setLength(String(value).length);
    fit();
  }, [value, fit]);

  const isInvalid = String(props['aria-invalid']) === 'true';
  const limit = props.maxLength;
  const describedBy =
    [props['aria-describedby'], showCount ? countId : undefined].filter(Boolean).join(' ') ||
    undefined;
  return (
    <div
      className={cx('st-input st-textarea', wrapperClassName)}
      data-invalid={isInvalid ? '' : undefined}
      data-disabled={props.disabled ? '' : undefined}
      data-readonly={props.readOnly ? '' : undefined}
    >
      <textarea
        ref={composed}
        rows={rows}
        value={value}
        defaultValue={defaultValue}
        className={cx('st-textarea__control', className)}
        data-resize={autoResize ? 'none' : resize}
        onChange={(e) => {
          setLength(e.target.value.length);
          fit();
          onChange?.(e);
        }}
        {...props}
        aria-describedby={describedBy}
      />
      {showCount && (
        <span
          id={countId}
          className="st-textarea__count"
          data-over={limit !== undefined && length > limit ? '' : undefined}
        >
          {limit !== undefined ? `${length} / ${limit}` : length}
          <span className="st-sr-only"> characters</span>
        </span>
      )}
    </div>
  );
});

'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useFormField, useFormFieldControl } from '../form-field/FormField.js';

export interface SliderMark {
  value: number;
  label?: React.ReactNode;
}

export interface SliderCommonProps {
  min?: number;
  max?: number;
  /** Default 1. */
  step?: number;
  /** Step size for PageUp/PageDown. Default 10% of range, snapped to step. */
  largeStep?: number;
  orientation?: 'horizontal' | 'vertical';
  disabled?: boolean;
  invalid?: boolean;
  /** Tick marks. `true` places one at every step (only for small ranges). */
  marks?: SliderMark[] | boolean;
  /** Show the formatted value above each thumb while interacting / always. */
  showValue?: boolean | 'always';
  /** Formats values for display and aria-valuetext, e.g. `(v) => \`${v}%\``. */
  formatValue?: (value: number) => string;
  /** Form field name; hidden inputs are rendered for each thumb. */
  name?: string;
  size?: 'sm' | 'md';
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

interface CoreProps extends SliderCommonProps {
  values: number[];
  onValuesChange: (values: number[]) => void;
  onValuesCommit?: ((values: number[]) => void) | undefined;
  /** Minimum gap between thumbs (in steps) for ranges. */
  minStepsBetween?: number;
  thumbLabels?: string[] | undefined;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const decimals = (n: number) => (String(n).split('.')[1] ?? '').length;

export const SliderCore = React.forwardRef<HTMLDivElement, CoreProps>(function SliderCore(
  {
    values,
    onValuesChange,
    onValuesCommit,
    min = 0,
    max = 100,
    step = 1,
    largeStep,
    orientation = 'horizontal',
    disabled: disabledProp,
    invalid,
    marks,
    showValue = false,
    formatValue = (v) => String(v),
    name,
    size = 'md',
    minStepsBetween = 0,
    thumbLabels,
    className,
    style,
    id: idProp,
    ...aria
  },
  ref,
) {
  const field = useFormFieldControl({
    id: idProp,
    disabled: disabledProp,
    'aria-describedby': aria['aria-describedby'],
    ...(invalid !== undefined && { 'aria-invalid': invalid }),
  });
  const formField = useFormField();
  const disabled = !!field.disabled;
  const trackRef = React.useRef<HTMLDivElement>(null);
  const thumbRefs = React.useRef<(HTMLSpanElement | null)[]>([]);
  const [active, setActive] = React.useState<number | null>(null);
  const valuesRef = React.useRef(values);
  valuesRef.current = values;
  const places = decimals(step);
  const big = largeStep ?? Math.max(step, Math.round((max - min) / 10 / step) * step);
  const vertical = orientation === 'vertical';
  const gap = minStepsBetween * step;

  const snap = (v: number) => {
    const snapped = Math.round((v - min) / step) * step + min;
    return Number(clamp(snapped, min, max).toFixed(places));
  };
  const setAt = (index: number, raw: number, commit = false) => {
    const next = [...valuesRef.current];
    const lo = index > 0 ? next[index - 1]! + gap : min;
    const hi = index < next.length - 1 ? next[index + 1]! - gap : max;
    next[index] = clamp(snap(raw), lo, hi);
    if (next[index] !== valuesRef.current[index]) {
      valuesRef.current = next;
      onValuesChange(next);
    }
    if (commit) onValuesCommit?.(next);
  };
  const percent = (v: number) => ((v - min) / (max - min || 1)) * 100;
  const valueFromPointer = (clientX: number, clientY: number) => {
    const rect = trackRef.current!.getBoundingClientRect();
    const ratio = vertical
      ? 1 - (clientY - rect.top) / (rect.height || 1)
      : (clientX - rect.left) / (rect.width || 1);
    return min + clamp(ratio, 0, 1) * (max - min);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0) return;
    e.preventDefault();
    const raw = valueFromPointer(e.clientX, e.clientY);
    // Pick the nearest thumb; for ties choose the one that can move in that direction.
    let index = 0;
    let best = Infinity;
    valuesRef.current.forEach((v, i) => {
      const d = Math.abs(v - raw);
      if (d < best || (d === best && raw > v)) {
        best = d;
        index = i;
      }
    });
    setActive(index);
    setAt(index, raw);
    thumbRefs.current[index]?.focus();
    const target = e.currentTarget;
    target.setPointerCapture?.(e.pointerId);
    const move = (ev: PointerEvent) => setAt(index, valueFromPointer(ev.clientX, ev.clientY));
    const up = () => {
      target.removeEventListener('pointermove', move);
      target.removeEventListener('pointerup', up);
      target.removeEventListener('pointercancel', up);
      setActive(null);
      onValuesCommit?.(valuesRef.current);
    };
    target.addEventListener('pointermove', move);
    target.addEventListener('pointerup', up);
    target.addEventListener('pointercancel', up);
  };

  const onKeyDown = (index: number) => (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (disabled) return;
    const v = valuesRef.current[index]!;
    const map: Record<string, number> = {
      ArrowRight: v + step,
      ArrowUp: v + step,
      ArrowLeft: v - step,
      ArrowDown: v - step,
      PageUp: v + big,
      PageDown: v - big,
      Home: min,
      End: max,
    };
    const next = map[e.key];
    if (next === undefined) return;
    e.preventDefault();
    setAt(index, next, true);
  };

  const markList: SliderMark[] =
    marks === true
      ? (max - min) / step <= 50
        ? Array.from({ length: Math.floor((max - min) / step) + 1 }, (_, i) => ({
            value: Number((min + i * step).toFixed(places)),
          }))
        : []
      : marks || [];
  const lo = values.length > 1 ? values[0]! : min;
  const hi = values[values.length - 1]!;
  const isInvalid = String(field['aria-invalid']) === 'true';
  const hasMarkLabels = markList.some((m) => m.label != null);

  return (
    <div
      ref={ref}
      className={cx('st-slider', className)}
      style={style}
      data-orientation={orientation}
      data-size={size}
      data-disabled={disabled ? '' : undefined}
      data-invalid={isInvalid ? '' : undefined}
      data-has-labels={hasMarkLabels ? '' : undefined}
    >
      <div ref={trackRef} className="st-slider__control" onPointerDown={onPointerDown}>
        <div className="st-slider__track">
          <div
            className="st-slider__range"
            style={
              vertical
                ? { bottom: `${percent(lo)}%`, top: `${100 - percent(hi)}%` }
                : { left: `${percent(lo)}%`, right: `${100 - percent(hi)}%` }
            }
          />
        </div>
        {markList.map((m) => (
          <span
            key={m.value}
            className="st-slider__mark"
            data-in-range={m.value >= lo && m.value <= hi ? '' : undefined}
            style={vertical ? { bottom: `${percent(m.value)}%` } : { left: `${percent(m.value)}%` }}
            aria-hidden="true"
          >
            {m.label != null && <span className="st-slider__mark-label">{m.label}</span>}
          </span>
        ))}
        {values.map((v, i) => (
          <span
            key={i}
            ref={(el) => {
              thumbRefs.current[i] = el;
            }}
            role="slider"
            tabIndex={disabled ? -1 : 0}
            id={i === 0 ? field.id : undefined}
            aria-label={thumbLabels?.[i] ?? aria['aria-label']}
            aria-labelledby={
              thumbLabels?.[i]
                ? undefined
                : (aria['aria-labelledby'] ??
                  (formField && !aria['aria-label'] ? formField.labelId : undefined))
            }
            aria-describedby={field['aria-describedby']}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={v}
            aria-valuetext={formatValue(v)}
            aria-orientation={orientation}
            aria-disabled={disabled || undefined}
            aria-invalid={isInvalid || undefined}
            data-active={active === i ? '' : undefined}
            className="st-slider__thumb"
            style={vertical ? { bottom: `${percent(v)}%` } : { left: `${percent(v)}%` }}
            onKeyDown={onKeyDown(i)}
            onFocus={() => setActive((a) => (a === null ? i : a))}
            onBlur={() => setActive(null)}
          >
            {showValue && (
              <span
                className="st-slider__value"
                data-visible={showValue === 'always' ? '' : undefined}
                aria-hidden="true"
              >
                {formatValue(v)}
              </span>
            )}
          </span>
        ))}
      </div>
      {name &&
        values.map((v, i) => (
          <input
            key={i}
            type="hidden"
            name={values.length > 1 ? `${name}[${i}]` : name}
            value={v}
            disabled={disabled}
          />
        ))}
    </div>
  );
});

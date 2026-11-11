'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { Icon } from '../../icons/Icon.js';
import { Button } from '../button/Button.js';
import { useFormFieldControl } from '../form-field/FormField.js';

/** A point in CSS pixels relative to the pad's top-left corner. */
export interface SignaturePoint {
  x: number;
  y: number;
}
/** One continuous pen stroke. */
export type SignatureStroke = SignaturePoint[];

export interface SignaturePadHandle {
  /** Removes every stroke. */
  clear: () => void;
  /** Removes the last stroke. */
  undo: () => void;
  isEmpty: () => boolean;
  /** The signature as an image data URL (PNG by default). Empty string when nothing is drawn. */
  toDataURL: (type?: string) => string;
  /** The signature as a standalone SVG document. Empty string when nothing is drawn. */
  toSVG: () => string;
}

export interface SignaturePadLabels {
  clear: string;
  undo: string;
  hint: string;
  empty: string;
  signed: string;
  captured: string;
  cleared: string;
  undone: string;
  /** Read to keyboard and screen-reader users, who cannot draw. */
  description: string;
}

const defaultLabels: SignaturePadLabels = {
  clear: 'Clear',
  undo: 'Undo',
  hint: 'Sign here',
  empty: 'no signature yet',
  signed: 'signature captured',
  captured: 'Signature captured',
  cleared: 'Signature cleared',
  undone: 'Last stroke removed',
  description:
    'Draw your signature with a mouse, finger or stylus. If you cannot draw, use the typed or uploaded signature option instead.',
};

export interface SignaturePadProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> {
  /** Controlled strokes. */
  value?: SignatureStroke[];
  defaultValue?: SignatureStroke[];
  onChange?: (strokes: SignatureStroke[]) => void;
  /** Drawing area height in px. Default 180. */
  height?: number;
  /** Pen width in px. Default 2.5. */
  penWidth?: number;
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  required?: boolean;
  /** Submit with forms: a hidden input with this name carries the signature. */
  name?: string;
  /** What the hidden input contains. Default `svg`. */
  format?: 'svg' | 'png';
  /** Accessible name of the drawing area. Default "Signature". */
  label?: string;
  /** Show the Clear and Undo buttons. Default true. */
  showActions?: boolean;
  labels?: Partial<SignaturePadLabels>;
}

const round = (n: number) => Math.round(n * 10) / 10;

/** SVG path data for one stroke, smoothed with quadratic curves through segment midpoints. */
export function strokeToPath(stroke: SignatureStroke): string {
  const first = stroke[0];
  if (!first) return '';
  if (stroke.length === 1) return `M${round(first.x)} ${round(first.y)}l0.01 0`;
  let d = `M${round(first.x)} ${round(first.y)}`;
  for (let i = 1; i < stroke.length - 1; i++) {
    const p = stroke[i]!;
    const next = stroke[i + 1]!;
    d += `Q${round(p.x)} ${round(p.y)} ${round((p.x + next.x) / 2)} ${round((p.y + next.y) / 2)}`;
  }
  const last = stroke[stroke.length - 1]!;
  return `${d}L${round(last.x)} ${round(last.y)}`;
}

/** A standalone SVG document for a set of strokes. */
export function strokesToSVG(
  strokes: SignatureStroke[],
  width: number,
  height: number,
  penWidth = 2.5,
  color = 'currentColor',
): string {
  if (strokes.length === 0) return '';
  const paths = strokes.map((s) => `<path d="${strokeToPath(s)}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${round(width)} ${round(height)}" fill="none" stroke="${color}" stroke-width="${penWidth}" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: SignatureStroke) {
  const first = stroke[0];
  if (!first) return;
  ctx.beginPath();
  ctx.moveTo(first.x, first.y);
  if (stroke.length === 1) {
    ctx.lineTo(first.x + 0.01, first.y);
  } else {
    for (let i = 1; i < stroke.length - 1; i++) {
      const p = stroke[i]!;
      const next = stroke[i + 1]!;
      ctx.quadraticCurveTo(p.x, p.y, (p.x + next.x) / 2, (p.y + next.y) / 2);
    }
    const last = stroke[stroke.length - 1]!;
    ctx.lineTo(last.x, last.y);
  }
  ctx.stroke();
}

/**
 * Captures a hand-drawn signature. Strokes are stored as points, so the drawing survives
 * resizes and theme changes. Drawing is not accessible to everyone: always offer a typed
 * or uploaded alternative next to it.
 */
export const SignaturePad = React.forwardRef<SignaturePadHandle, SignaturePadProps>(
  function SignaturePad(
    {
      value,
      defaultValue,
      onChange,
      height = 180,
      penWidth = 2.5,
      disabled: disabledProp,
      readOnly: readOnlyProp,
      invalid,
      required,
      name,
      format = 'svg',
      label = 'Signature',
      showActions = true,
      labels: labelsProp,
      className,
      id: idProp,
      'aria-describedby': describedByProp,
      ...props
    },
    ref,
  ) {
    const labels = { ...defaultLabels, ...labelsProp };
    const field = useFormFieldControl({
      id: idProp,
      disabled: disabledProp,
      readOnly: readOnlyProp,
      required,
      'aria-describedby': describedByProp,
      ...(invalid !== undefined && { 'aria-invalid': invalid }),
    });
    const disabled = !!field.disabled;
    const readOnly = !!field.readOnly;
    const isInvalid = String(field['aria-invalid']) === 'true';
    const locked = disabled || readOnly;

    const [strokes, setStrokes] = useControllableState<SignatureStroke[]>({
      value,
      defaultValue: defaultValue ?? [],
      onChange,
    });
    const [announcement, setAnnouncement] = React.useState('');
    const [size, setSize] = React.useState({ width: 0, height });
    const [hiddenValue, setHiddenValue] = React.useState('');
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const surfaceRef = React.useRef<HTMLDivElement>(null);
    const activeRef = React.useRef<SignatureStroke | null>(null);
    const strokesRef = React.useRef(strokes);
    strokesRef.current = strokes;
    const descriptionId = React.useId();
    const empty = strokes.length === 0;

    const redraw = React.useCallback(() => {
      const canvas = canvasRef.current;
      const surface = surfaceRef.current;
      if (!canvas || !surface) return;
      const rect = surface.getBoundingClientRect();
      const width = rect.width || surface.clientWidth || 0;
      const h = rect.height || height;
      const ratio = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
      if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(h * ratio)) {
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(h * ratio);
      }
      setSize((prev) => (prev.width === width && prev.height === h ? prev : { width, height: h }));
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, width, h);
      // Ink follows the theme: the canvas inherits `color` from --st-color-fg-default.
      ctx.strokeStyle = getComputedStyle(canvas).color || '#000';
      ctx.lineWidth = penWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (const stroke of strokesRef.current) drawStroke(ctx, stroke);
      if (activeRef.current) drawStroke(ctx, activeRef.current);
    }, [height, penWidth]);

    // Redraw on stroke changes, resizes and theme changes.
    React.useEffect(() => {
      redraw();
    }, [redraw, strokes]);
    React.useEffect(() => {
      const surface = surfaceRef.current;
      if (!surface) return;
      const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(redraw) : null;
      ro?.observe(surface);
      const mo = typeof MutationObserver !== 'undefined' ? new MutationObserver(redraw) : null;
      const themed = [
        document.documentElement,
        ...Array.from(document.querySelectorAll('[data-theme]')),
      ];
      for (const el of themed)
        mo?.observe(el, { attributes: true, attributeFilter: ['data-theme', 'class'] });
      return () => {
        ro?.disconnect();
        mo?.disconnect();
      };
    }, [redraw]);

    const exportSVG = React.useCallback(
      (list: SignatureStroke[] = strokesRef.current) => {
        const surface = surfaceRef.current;
        const width =
          surface?.getBoundingClientRect().width || surface?.clientWidth || size.width || 300;
        return strokesToSVG(list, width, height, penWidth);
      },
      [height, penWidth, size.width],
    );
    const exportDataURL = React.useCallback((type?: string) => {
      if (strokesRef.current.length === 0) return '';
      try {
        return canvasRef.current?.toDataURL(type) ?? '';
      } catch {
        return '';
      }
    }, []);

    React.useEffect(() => {
      if (!name) return;
      setHiddenValue(
        empty ? '' : format === 'png' ? exportDataURL('image/png') : exportSVG(strokes),
      );
    }, [name, format, strokes, empty, exportDataURL, exportSVG]);

    const clear = React.useCallback(() => {
      if (strokesRef.current.length === 0) return;
      setStrokes([]);
      setAnnouncement(labels.cleared);
    }, [setStrokes, labels.cleared]);
    const undo = React.useCallback(() => {
      if (strokesRef.current.length === 0) return;
      const next = strokesRef.current.slice(0, -1);
      setStrokes(next);
      setAnnouncement(next.length === 0 ? labels.cleared : labels.undone);
    }, [setStrokes, labels.cleared, labels.undone]);

    React.useImperativeHandle(
      ref,
      () => ({
        clear,
        undo,
        isEmpty: () => strokesRef.current.length === 0,
        toDataURL: exportDataURL,
        toSVG: () => exportSVG(),
      }),
      [clear, undo, exportDataURL, exportSVG],
    );

    const pointFrom = (event: React.PointerEvent): SignaturePoint => {
      const rect = surfaceRef.current!.getBoundingClientRect();
      return { x: round(event.clientX - rect.left), y: round(event.clientY - rect.top) };
    };
    const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (locked || (event.pointerType === 'mouse' && event.button !== 0)) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture?.(event.pointerId);
      activeRef.current = [pointFrom(event)];
      redraw();
    };
    const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
      const active = activeRef.current;
      if (!active) return;
      const p = pointFrom(event);
      const last = active[active.length - 1]!;
      if (Math.abs(p.x - last.x) + Math.abs(p.y - last.y) < 1) return;
      active.push(p);
      redraw();
    };
    const finish = () => {
      const active = activeRef.current;
      if (!active) return;
      activeRef.current = null;
      setStrokes([...strokesRef.current, active]);
      setAnnouncement(labels.captured);
    };

    const describedBy = [field['aria-describedby'], descriptionId].filter(Boolean).join(' ');

    return (
      <div
        className={cx('st-signature-pad', className)}
        data-empty={empty ? '' : undefined}
        data-disabled={disabled ? '' : undefined}
        data-readonly={readOnly ? '' : undefined}
        data-invalid={isInvalid ? '' : undefined}
        {...props}
      >
        <div ref={surfaceRef} className="st-signature-pad__surface" style={{ height }}>
          <canvas
            ref={canvasRef}
            id={field.id}
            className="st-signature-pad__canvas"
            role="img"
            aria-label={`${label}${field.required ? ', required' : ''}: ${empty ? labels.empty : labels.signed}`}
            aria-describedby={describedBy}
            tabIndex={disabled ? -1 : 0}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={finish}
            onPointerCancel={finish}
            onKeyDown={(event) => {
              if (locked) return;
              if (event.key === 'Backspace' || event.key === 'Delete') {
                event.preventDefault();
                undo();
              }
            }}
          />
          <span className="st-signature-pad__baseline" aria-hidden="true" />
          {empty && (
            <span className="st-signature-pad__hint" aria-hidden="true">
              <Icon name="signature" size={16} />
              {labels.hint}
            </span>
          )}
        </div>
        <p id={descriptionId} className="st-sr-only">
          {labels.description}
        </p>
        {showActions && !readOnly && (
          <div className="st-signature-pad__actions">
            <Button variant="ghost" size="sm" onClick={undo} disabled={disabled || empty}>
              {labels.undo}
            </Button>
            <Button variant="ghost" size="sm" onClick={clear} disabled={disabled || empty}>
              {labels.clear}
            </Button>
          </div>
        )}
        {name && <input type="hidden" name={name} value={hiddenValue} disabled={disabled} />}
        <span className="st-sr-only" role="status" aria-live="polite">
          {announcement}
        </span>
      </div>
    );
  },
);

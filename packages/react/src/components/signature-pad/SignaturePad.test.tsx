import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { FormField } from '../form-field/FormField';
import {
  SignaturePad,
  strokesToSVG,
  strokeToPath,
  type SignaturePadHandle,
  type SignatureStroke,
} from './SignaturePad';

const ctx = {
  setTransform: vi.fn(),
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  quadraticCurveTo: vi.fn(),
  stroke: vi.fn(),
  strokeStyle: '',
  lineWidth: 0,
  lineCap: '',
  lineJoin: '',
};

beforeEach(() => {
  Object.values(ctx).forEach((v) => typeof v === 'function' && v.mockClear());
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    ctx as unknown as CanvasRenderingContext2D,
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,AAA');
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    right: 400,
    bottom: 180,
    width: 400,
    height: 180,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
});
afterEach(() => vi.restoreAllMocks());

function draw(canvas: Element, points: [number, number][]) {
  const [first, ...rest] = points;
  fireEvent.pointerDown(canvas, {
    clientX: first![0],
    clientY: first![1],
    pointerId: 1,
    button: 0,
  });
  for (const [x, y] of rest)
    fireEvent.pointerMove(canvas, { clientX: x, clientY: y, pointerId: 1 });
  fireEvent.pointerUp(canvas, { pointerId: 1 });
}

describe('SignaturePad', () => {
  it('exposes an image whose name says whether a signature is present', () => {
    render(<SignaturePad label="Your signature" />);
    const pad = screen.getByRole('img', { name: 'Your signature: no signature yet' });
    expect(pad).toHaveAccessibleDescription(/typed or uploaded signature/);
    expect(pad).toHaveAttribute('tabindex', '0');
  });

  it('captures strokes from pointer events and announces it', () => {
    const onChange = vi.fn();
    render(<SignaturePad onChange={onChange} />);
    draw(screen.getByRole('img'), [
      [10, 20],
      [30, 40],
      [60, 50],
    ]);
    expect(onChange).toHaveBeenCalledTimes(1);
    const strokes = onChange.mock.calls[0]![0] as SignatureStroke[];
    expect(strokes).toHaveLength(1);
    expect(strokes[0]).toEqual([
      { x: 10, y: 20 },
      { x: 30, y: 40 },
      { x: 60, y: 50 },
    ]);
    expect(screen.getByRole('img', { name: 'Signature: signature captured' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Signature captured');
    expect(ctx.quadraticCurveTo).toHaveBeenCalled();
  });

  it('undoes the last stroke and clears everything', async () => {
    const onChange = vi.fn();
    render(<SignaturePad onChange={onChange} />);
    const pad = screen.getByRole('img');
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
    draw(pad, [
      [10, 10],
      [50, 50],
    ]);
    draw(pad, [
      [60, 10],
      [90, 50],
    ]);
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onChange.mock.lastCall![0]).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('Last stroke removed');
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onChange.mock.lastCall![0]).toEqual([]);
    expect(screen.getByRole('status')).toHaveTextContent('Signature cleared');
    expect(screen.getByRole('img', { name: /no signature yet/ })).toBeInTheDocument();
  });

  it('removes the last stroke with Backspace from the keyboard', async () => {
    render(<SignaturePad />);
    const pad = screen.getByRole('img');
    draw(pad, [
      [10, 10],
      [50, 50],
    ]);
    pad.focus();
    await userEvent.keyboard('{Backspace}');
    expect(screen.getByRole('img', { name: /no signature yet/ })).toBeInTheDocument();
  });

  it('submits an SVG through the hidden input', () => {
    const { container } = render(<SignaturePad name="signature" />);
    const input = container.querySelector('input[type="hidden"]') as HTMLInputElement;
    expect(input.value).toBe('');
    draw(screen.getByRole('img'), [
      [10, 20],
      [40, 60],
    ]);
    expect(input.value).toContain('<svg');
    expect(input.value).toContain('viewBox="0 0 400 180"');
    expect(input.value).toContain('M10 20L40 60');
  });

  it('can submit a PNG data URL instead', () => {
    const { container } = render(<SignaturePad name="signature" format="png" />);
    draw(screen.getByRole('img'), [
      [10, 20],
      [40, 60],
    ]);
    expect((container.querySelector('input[type="hidden"]') as HTMLInputElement).value).toBe(
      'data:image/png;base64,AAA',
    );
  });

  it('ignores drawing when disabled or read-only', () => {
    const onChange = vi.fn();
    const { rerender } = render(<SignaturePad disabled onChange={onChange} />);
    draw(screen.getByRole('img'), [
      [10, 10],
      [50, 50],
    ]);
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('img')).toHaveAttribute('tabindex', '-1');
    rerender(<SignaturePad readOnly onChange={onChange} />);
    draw(screen.getByRole('img'), [
      [10, 10],
      [50, 50],
    ]);
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
  });

  it('supports controlled strokes and the imperative handle', () => {
    const ref = React.createRef<SignaturePadHandle>();
    const strokes: SignatureStroke[] = [
      [
        { x: 5, y: 5 },
        { x: 25, y: 30 },
        { x: 50, y: 10 },
      ],
    ];
    const onChange = vi.fn();
    render(<SignaturePad ref={ref} value={strokes} onChange={onChange} />);
    expect(ref.current!.isEmpty()).toBe(false);
    expect(ref.current!.toSVG()).toContain('Q25 30 37.5 20');
    expect(ref.current!.toDataURL()).toBe('data:image/png;base64,AAA');
    act(() => ref.current!.clear());
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('picks up label, description and required from FormField', () => {
    render(
      <FormField
        label="Signature"
        description="Sign as it appears on your ID."
        required
        error="A signature is required"
      >
        <SignaturePad />
      </FormField>,
    );
    const pad = screen.getByRole('img', { name: /required/ });
    expect(pad).toHaveAccessibleDescription(
      /Sign as it appears on your ID\. A signature is required/,
    );
    expect(pad.closest('.st-signature-pad')).toHaveAttribute('data-invalid');
  });

  it('builds smooth path data', () => {
    expect(strokeToPath([{ x: 1, y: 2 }])).toBe('M1 2l0.01 0');
    expect(strokesToSVG([], 100, 50)).toBe('');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <SignaturePad label="Signature" name="sig" />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { FormField } from '../form-field/FormField';
import { Slider } from './Slider';

describe('Slider', () => {
  it('exposes slider semantics', () => {
    render(<Slider aria-label="Opacity" defaultValue={40} formatValue={(v) => `${v}%`} />);
    const s = screen.getByRole('slider', { name: 'Opacity' });
    expect(s).toHaveAttribute('aria-valuenow', '40');
    expect(s).toHaveAttribute('aria-valuemin', '0');
    expect(s).toHaveAttribute('aria-valuemax', '100');
    expect(s).toHaveAttribute('aria-valuetext', '40%');
    expect(s).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('implements the APG keyboard model', async () => {
    const onChange = vi.fn();
    const onCommit = vi.fn();
    render(
      <Slider
        aria-label="Volume"
        defaultValue={50}
        step={5}
        onValueChange={onChange}
        onValueCommit={onCommit}
      />,
    );
    const s = screen.getByRole('slider');
    s.focus();
    const user = userEvent.setup();
    await user.keyboard('{ArrowRight}');
    expect(s).toHaveAttribute('aria-valuenow', '55');
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(s).toHaveAttribute('aria-valuenow', '45');
    await user.keyboard('{PageUp}');
    expect(s).toHaveAttribute('aria-valuenow', '55');
    await user.keyboard('{End}');
    expect(s).toHaveAttribute('aria-valuenow', '100');
    await user.keyboard('{Home}');
    expect(s).toHaveAttribute('aria-valuenow', '0');
    expect(onChange).toHaveBeenLastCalledWith(0);
    expect(onCommit).toHaveBeenLastCalledWith(0);
  });

  it('updates from pointer position', () => {
    const onChange = vi.fn();
    const { container } = render(<Slider aria-label="X" onValueChange={onChange} />);
    const control = container.querySelector('.st-slider__control') as HTMLElement;
    control.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 200,
      height: 10,
      right: 200,
      bottom: 10,
      x: 0,
      y: 0,
      toJSON() {},
    });
    fireEvent.pointerDown(control, { clientX: 150, clientY: 5, button: 0, pointerId: 1 });
    expect(onChange).toHaveBeenLastCalledWith(75);
    expect(screen.getByRole('slider')).toHaveFocus();
  });

  it('is controlled, respects disabled, and submits via hidden input', async () => {
    const { container, rerender } = render(
      <Slider aria-label="X" value={10} onValueChange={() => {}} name="level" />,
    );
    screen.getByRole('slider').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '10');
    expect((container.querySelector('input[name="level"]') as HTMLInputElement).value).toBe('10');
    rerender(<Slider aria-label="X" defaultValue={10} disabled />);
    expect(screen.getByRole('slider')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('slider')).toHaveAttribute('tabindex', '-1');
  });

  it('is labelled by FormField', () => {
    render(
      <FormField label="Reminder frequency" description="Days between reminders">
        <Slider min={1} max={14} />
      </FormField>,
    );
    const s = screen.getByRole('slider', { name: 'Reminder frequency' });
    expect(s).toHaveAccessibleDescription('Days between reminders');
  });

  it.each(THEMES)('axe clean in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <Slider
          aria-label="Zoom"
          defaultValue={2}
          min={0}
          max={4}
          marks={[
            { value: 0, label: '0×' },
            { value: 4, label: '4×' },
          ]}
          showValue="always"
        />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

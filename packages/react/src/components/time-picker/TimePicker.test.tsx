import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { FormField } from '../form-field/FormField';
import { TimePicker } from './TimePicker';

describe('TimePicker', () => {
  it('renders labelled spinbutton segments inside a FormField group', () => {
    render(
      <FormField label="Send at" description="Local time">
        <TimePicker hourCycle={24} defaultValue="09:30" />
      </FormField>,
    );
    const group = screen.getByRole('group', { name: 'Send at' });
    expect(group).toHaveAccessibleDescription('Local time');
    const hours = screen.getByRole('spinbutton', { name: 'Hours' });
    expect(hours).toHaveAttribute('aria-valuenow', '9');
    expect(hours).toHaveAttribute('aria-valuemax', '23');
    expect(screen.getByRole('spinbutton', { name: 'Minutes' })).toHaveAttribute(
      'aria-valuetext',
      '30',
    );
  });

  it('types digits with auto-advance and emits HH:MM', async () => {
    const onValueChange = vi.fn();
    render(<TimePicker aria-label="Time" hourCycle={24} onValueChange={onValueChange} name="at" />);
    const user = userEvent.setup();
    await user.tab();
    expect(screen.getByRole('spinbutton', { name: 'Hours' })).toHaveFocus();
    await user.keyboard('14');
    expect(screen.getByRole('spinbutton', { name: 'Minutes' })).toHaveFocus();
    await user.keyboard('7');
    expect(onValueChange).toHaveBeenLastCalledWith('14:07');
    expect(document.querySelector('input[name=at]')).toHaveValue('14:07');
  });

  it('increments with arrows, wraps and honours step', async () => {
    const onValueChange = vi.fn();
    render(
      <TimePicker
        aria-label="Time"
        hourCycle={24}
        step={15}
        defaultValue="23:45"
        onValueChange={onValueChange}
      />,
    );
    const user = userEvent.setup();
    screen.getByRole('spinbutton', { name: 'Minutes' }).focus();
    await user.keyboard('{ArrowUp}');
    expect(onValueChange).toHaveBeenLastCalledWith('23:00');
    await user.keyboard('{ArrowDown}');
    expect(onValueChange).toHaveBeenLastCalledWith('23:45');
    await user.keyboard('{ArrowLeft}{ArrowUp}');
    expect(onValueChange).toHaveBeenLastCalledWith('00:45');
  });

  it('supports a 12-hour cycle with an AM/PM segment', async () => {
    const onValueChange = vi.fn();
    render(
      <TimePicker
        aria-label="Time"
        hourCycle={12}
        defaultValue="09:00"
        onValueChange={onValueChange}
      />,
    );
    const period = screen.getByRole('spinbutton', { name: 'AM/PM' });
    expect(period).toHaveAttribute('aria-valuetext', 'AM');
    period.focus();
    await userEvent.keyboard('p');
    expect(onValueChange).toHaveBeenLastCalledWith('21:00');
    expect(screen.getByRole('spinbutton', { name: 'Hours' })).toHaveAttribute('aria-valuenow', '9');
  });

  it('clears segments with Backspace and emits null', async () => {
    const onValueChange = vi.fn();
    render(
      <TimePicker
        aria-label="Time"
        hourCycle={24}
        defaultValue="10:15"
        onValueChange={onValueChange}
      />,
    );
    screen.getByRole('spinbutton', { name: 'Hours' }).focus();
    await userEvent.keyboard('{Backspace}');
    expect(onValueChange).toHaveBeenLastCalledWith(null);
    expect(screen.getByRole('spinbutton', { name: 'Hours' })).toHaveTextContent('--');
  });

  it('is not focusable when disabled', () => {
    render(<TimePicker aria-label="Time" hourCycle={24} disabled />);
    expect(screen.getByRole('spinbutton', { name: 'Hours' })).toHaveAttribute('tabindex', '-1');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <FormField label="Send at">
          <TimePicker hourCycle={12} defaultValue="16:30" clearable />
        </FormField>
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

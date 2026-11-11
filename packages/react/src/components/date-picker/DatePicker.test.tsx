import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { toISODate } from '../../internal/date';
import { FormField } from '../form-field/FormField';
import { DatePicker } from './DatePicker';

const TODAY = new Date(2026, 10, 11);

describe('DatePicker', () => {
  it('integrates with FormField and shows a locale placeholder', () => {
    render(
      <FormField label="Start date" description="When the signature goes live">
        <DatePicker locale="en-GB" today={TODAY} />
      </FormField>,
    );
    const input = screen.getByRole('textbox', { name: 'Start date' });
    expect(input).toHaveAttribute('placeholder', 'dd/mm/yyyy');
    expect(input).toHaveAccessibleDescription('When the signature goes live');
  });

  it('picks a date from the calendar, closes and restores focus', async () => {
    const onValueChange = vi.fn();
    render(
      <DatePicker
        aria-label="Start date"
        locale="en-GB"
        today={TODAY}
        name="start"
        onValueChange={onValueChange}
      />,
    );
    const user = userEvent.setup();
    const trigger = screen.getByRole('button', { name: 'Choose date' });
    await user.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Choose date' })).toBeInTheDocument();
    await waitFor(() => expect(document.querySelector('[data-date="2026-11-11"]')).toHaveFocus());
    await user.keyboard('{ArrowRight}{Enter}');
    expect(toISODate(onValueChange.mock.calls[0]![0])).toBe('2026-11-12');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('textbox')).toHaveValue('12/11/2026');
    expect(document.querySelector('input[type=hidden][name=start]')).toHaveValue('2026-11-12');
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('parses typed dates on blur and flags invalid input', async () => {
    const onValueChange = vi.fn();
    render(
      <DatePicker aria-label="Due" locale="en-US" today={TODAY} onValueChange={onValueChange} />,
    );
    const user = userEvent.setup();
    const input = screen.getByRole('textbox');
    await user.type(input, '01/31/2026');
    await user.tab();
    expect(toISODate(onValueChange.mock.calls[0]![0])).toBe('2026-01-31');
    await user.clear(input);
    await user.type(input, '02/30/2026{Enter}');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('clears the value', async () => {
    const onValueChange = vi.fn();
    render(
      <DatePicker
        aria-label="Due"
        locale="en-GB"
        defaultValue={new Date(2026, 0, 5)}
        onValueChange={onValueChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Clear date' }));
    expect(onValueChange).toHaveBeenCalledWith(null);
    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('opens with Alt+ArrowDown', async () => {
    render(<DatePicker aria-label="Due" locale="en-GB" today={TODAY} />);
    screen.getByRole('textbox').focus();
    await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <FormField label="Start date">
          <DatePicker locale="en-GB" defaultValue={TODAY} />
        </FormField>
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

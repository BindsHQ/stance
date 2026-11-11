import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { toISODate } from '../../internal/date';
import { Calendar } from './Calendar';

const TODAY = new Date(2026, 10, 11); // Wed 11 Nov 2026
const day = (iso: string) => document.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)!;

describe('Calendar', () => {
  it('renders a labelled grid with weekday headers starting Monday', () => {
    render(<Calendar today={TODAY} locale="en-GB" />);
    const grid = screen.getByRole('grid', { name: 'November 2026' });
    const headers = grid.querySelectorAll('th');
    expect(headers[0]).toHaveAttribute('abbr', 'Monday');
    expect(day('2026-11-11')).toHaveAttribute('aria-current', 'date');
    expect(day('2026-11-11')).toHaveAccessibleName(/^Wednesday,? 11 November 2026, Today$/);
  });

  it('has a single tab stop on today and selects with click', async () => {
    const onValueChange = vi.fn();
    render(<Calendar today={TODAY} locale="en-GB" onValueChange={onValueChange} />);
    const tabbable = Array.from(document.querySelectorAll('.st-calendar__day')).filter(
      (b) => (b as HTMLElement).tabIndex === 0,
    );
    expect(tabbable).toHaveLength(1);
    expect(tabbable[0]).toBe(day('2026-11-11'));
    await userEvent.click(day('2026-11-20'));
    expect(toISODate(onValueChange.mock.calls[0]![0])).toBe('2026-11-20');
    expect(day('2026-11-20').closest('td')).toHaveAttribute('aria-selected', 'true');
  });

  it('implements the date grid keyboard model', async () => {
    render(<Calendar today={TODAY} locale="en-GB" />);
    const user = userEvent.setup();
    day('2026-11-11').focus();
    await user.keyboard('{ArrowRight}');
    expect(day('2026-11-12')).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(day('2026-11-19')).toHaveFocus();
    await user.keyboard('{ArrowLeft}{ArrowUp}');
    expect(day('2026-11-11')).toHaveFocus();
    await user.keyboard('{Home}');
    expect(day('2026-11-09')).toHaveFocus();
    await user.keyboard('{End}');
    expect(day('2026-11-15')).toHaveFocus();
    await user.keyboard('{PageDown}');
    expect(screen.getByRole('grid', { name: 'December 2026' })).toBeInTheDocument();
    expect(day('2026-12-15')).toHaveFocus();
    await user.keyboard('{Shift>}{PageDown}{/Shift}');
    expect(day('2027-12-15')).toHaveFocus();
    await user.keyboard('{Shift>}{PageUp}{/Shift}{PageUp}');
    expect(day('2026-11-15')).toHaveFocus();
  });

  it('clamps PageUp from 31 March to the end of February', async () => {
    render(<Calendar today={new Date(2026, 2, 31)} locale="en-GB" />);
    const user = userEvent.setup();
    day('2026-03-31').focus();
    await user.keyboard('{PageUp}');
    expect(day('2026-02-28')).toHaveFocus();
  });

  it('moves into the next month with arrows past the month end', async () => {
    render(<Calendar today={new Date(2026, 10, 30)} locale="en-GB" />);
    const user = userEvent.setup();
    day('2026-11-30').focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('grid', { name: 'December 2026' })).toBeInTheDocument();
    expect(day('2026-12-01')).toHaveFocus();
  });

  it('respects min, max and disabled dates', async () => {
    const onValueChange = vi.fn();
    render(
      <Calendar
        today={TODAY}
        locale="en-GB"
        min={new Date(2026, 10, 5)}
        max={new Date(2026, 10, 25)}
        isDateDisabled={(d) => d.getDay() === 0 || d.getDay() === 6}
        onValueChange={onValueChange}
      />,
    );
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
    expect(day('2026-11-14')).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(day('2026-11-14'));
    await userEvent.click(day('2026-11-04'));
    expect(onValueChange).not.toHaveBeenCalled();
    const user = userEvent.setup();
    day('2026-11-11').focus();
    await user.keyboard('{PageDown}');
    expect(day('2026-11-25')).toHaveFocus();
  });

  it('navigates months with the header buttons', async () => {
    render(<Calendar today={TODAY} locale="en-GB" />);
    await userEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByRole('grid', { name: 'December 2026' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    await userEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(screen.getByRole('grid', { name: 'October 2026' })).toBeInTheDocument();
  });

  it('selects ranges, swapping when the end precedes the start', async () => {
    const onValueChange = vi.fn();
    render(
      <Calendar
        mode="range"
        today={TODAY}
        locale="en-GB"
        numberOfMonths={2}
        onValueChange={onValueChange}
      />,
    );
    expect(screen.getAllByRole('grid')).toHaveLength(2);
    await userEvent.click(day('2026-12-03'));
    await userEvent.click(day('2026-11-20'));
    const last = onValueChange.mock.calls.at(-1)![0];
    expect(toISODate(last.start)).toBe('2026-11-20');
    expect(toISODate(last.end)).toBe('2026-12-03');
    expect(day('2026-11-25').closest('td')).toHaveAttribute('data-in-range');
    expect(day('2026-11-20')).toHaveAccessibleName(/Start of range/);
  });

  it('honours weekStartsOn and controlled value', () => {
    render(
      <Calendar today={TODAY} locale="en-US" weekStartsOn={0} value={new Date(2026, 10, 3)} />,
    );
    expect(screen.getByRole('grid').querySelector('th')).toHaveAttribute('abbr', 'Sunday');
    expect(day('2026-11-03')).toHaveAttribute('data-selected');
    expect(day('2026-11-03').tabIndex).toBe(0);
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <Calendar today={TODAY} locale="en-GB" defaultValue={new Date(2026, 10, 18)} />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

describe('Calendar month and year menus', () => {
  const TODAY_FIXED = new Date(2026, 10, 11);

  it('offers month and year menus on a single month calendar', () => {
    render(
      <Calendar
        aria-label="Date"
        today={TODAY_FIXED}
        defaultMonth={new Date(2026, 10, 1)}
        locale="en-GB"
      />,
    );
    expect(screen.getByRole('combobox', { name: 'Month' })).toHaveValue('10');
    expect(screen.getByRole('combobox', { name: 'Year' })).toHaveValue('2026');
  });

  it('jumps to the chosen month and year', async () => {
    const onMonthChange = vi.fn();
    render(
      <Calendar
        aria-label="Date"
        today={TODAY_FIXED}
        defaultMonth={new Date(2026, 10, 1)}
        locale="en-GB"
        onMonthChange={onMonthChange}
      />,
    );
    const user = userEvent.setup();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Year' }), '1994');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Month' }), '2');
    expect(toISODate(onMonthChange.mock.lastCall![0])).toBe('1994-03-01');
    expect(screen.getByRole('button', { name: /15 March 1994/ })).toBeInTheDocument();
  });

  it('limits years and months to min and max', () => {
    render(
      <Calendar
        aria-label="Date"
        today={TODAY_FIXED}
        defaultMonth={new Date(2026, 10, 1)}
        min={new Date(2026, 8, 10)}
        max={new Date(2027, 1, 20)}
        locale="en-GB"
      />,
    );
    const years = [
      ...screen.getByRole('combobox', { name: 'Year' }).querySelectorAll('option'),
    ].map((o) => o.value);
    expect(years).toEqual(['2026', '2027']);
    const months = screen.getByRole('combobox', { name: 'Month' }).querySelectorAll('option');
    expect(months[7]).toBeDisabled(); // August 2026 is before min
    expect(months[8]).not.toBeDisabled();
  });

  it('keeps a plain title with captionLayout="label" and for two months', () => {
    const { rerender } = render(
      <Calendar
        aria-label="Date"
        today={TODAY_FIXED}
        defaultMonth={new Date(2026, 10, 1)}
        captionLayout="label"
        locale="en-GB"
      />,
    );
    expect(screen.queryByRole('combobox', { name: 'Year' })).toBeNull();
    rerender(
      <Calendar
        aria-label="Date"
        today={TODAY_FIXED}
        defaultMonth={new Date(2026, 10, 1)}
        numberOfMonths={2}
        locale="en-GB"
      />,
    );
    expect(screen.queryByRole('combobox', { name: 'Year' })).toBeNull();
  });

  it('has no axe violations with the menus', async () => {
    const { container } = render(
      <Calendar aria-label="Date" today={TODAY_FIXED} defaultMonth={new Date(2026, 10, 1)} />,
    );
    await expectNoA11yViolations(container);
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { addDays, toISODate } from '../../internal/date';
import { FormField } from '../form-field/FormField';
import { DateRangePicker } from './DateRangePicker';

const TODAY = new Date(2026, 10, 11);
const presets = [
  { label: 'Last 7 days', range: (t: Date) => ({ start: addDays(t, -6), end: t }) },
  { label: 'Last 30 days', range: (t: Date) => ({ start: addDays(t, -29), end: t }) },
];
const day = (iso: string) => document.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)!;

describe('DateRangePicker', () => {
  it('opens a two-month range calendar labelled by the FormField', async () => {
    render(
      <FormField label="Reporting period">
        <DateRangePicker locale="en-GB" today={TODAY} />
      </FormField>,
    );
    const trigger = screen.getByRole('button', { name: /Reporting period/ });
    expect(trigger).toHaveTextContent('Select dates');
    await userEvent.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Choose date range' })).toBeInTheDocument();
    expect(screen.getAllByRole('grid')).toHaveLength(2);
  });

  it('selects a range, closes and submits ISO values', async () => {
    const onValueChange = vi.fn();
    render(
      <DateRangePicker
        aria-label="Period"
        locale="en-GB"
        today={TODAY}
        startName="from"
        endName="to"
        onValueChange={onValueChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /^Period,/ }));
    await userEvent.click(day('2026-11-03'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await userEvent.click(day('2026-11-17'));
    expect(screen.queryByRole('dialog')).toBeNull();
    const last = onValueChange.mock.calls.at(-1)![0];
    expect([toISODate(last.start), toISODate(last.end)]).toEqual(['2026-11-03', '2026-11-17']);
    expect(document.querySelector('input[name=from]')).toHaveValue('2026-11-03');
    expect(document.querySelector('input[name=to]')).toHaveValue('2026-11-17');
    expect(screen.getByRole('button', { name: /^Period,/ })).toHaveTextContent(/3.*17 Nov 2026/);
  });

  it('applies presets and marks the active one', async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <DateRangePicker
        aria-label="Period"
        locale="en-GB"
        today={TODAY}
        presets={presets}
        onValueChange={onValueChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /^Period,/ }));
    expect(screen.getByRole('group', { name: 'Quick ranges' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Last 7 days' }));
    const r = onValueChange.mock.calls[0]![0];
    expect([toISODate(r.start), toISODate(r.end)]).toEqual(['2026-11-05', '2026-11-11']);
    rerender(
      <DateRangePicker
        aria-label="Period"
        locale="en-GB"
        today={TODAY}
        presets={presets}
        value={r}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /^Period,/ }));
    expect(screen.getByRole('button', { name: 'Last 7 days' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    render(
      <div data-theme={theme}>
        <DateRangePicker aria-label="Period" locale="en-GB" today={TODAY} presets={presets} />
      </div>,
    );
    await userEvent.click(screen.getByRole('button', { name: /^Period,/ }));
    await expectNoA11yViolations(document.body);
  });
});

describe('DateRangePicker label in name', () => {
  it('keeps the visible value inside the accessible name when aria-label is used', () => {
    render(<DateRangePicker aria-label="Deployment window" />);
    const trigger = screen.getByRole('button', { name: /^Deployment window,/ });
    expect(trigger).not.toHaveAttribute('aria-label');
  });
});

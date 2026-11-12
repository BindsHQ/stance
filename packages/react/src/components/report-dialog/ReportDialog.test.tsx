import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { ReportDialog } from './ReportDialog';

const categories = [
  { id: 'inaccurate', label: 'Inaccurate', description: 'It states something that is not true.' },
  { id: 'harmful', label: 'Harmful or unsafe' },
  { id: 'other', label: 'Something else' },
];
const trigger = <button type="button">Report</button>;

describe('ReportDialog', () => {
  it('opens from its trigger as a named, described dialog with focus inside', async () => {
    render(<ReportDialog categories={categories} trigger={trigger} />);
    expect(screen.queryByRole('dialog')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Report' }));
    const dialog = screen.getByRole('dialog', { name: 'Report this response' });
    expect(dialog).toHaveAccessibleDescription(/Tell us what is wrong/);
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('offers the categories as one radio group with descriptions and a labelled details field', async () => {
    render(<ReportDialog categories={categories} defaultOpen />);
    const group = screen.getByRole('radiogroup', { name: /What is the problem\?/ });
    const radios = within(group).getAllByRole('radio');
    expect(radios).toHaveLength(3);
    expect(radios[0]).toHaveAccessibleName('Inaccurate');
    expect(radios[0]).toHaveAccessibleDescription('It states something that is not true.');
    expect(radios.every((r) => !(r as HTMLInputElement).checked)).toBe(true);
    expect(screen.getByRole('textbox', { name: 'Details (optional)' })).toBeInTheDocument();
  });

  it('keeps submit disabled until a category is chosen, then submits and closes', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ReportDialog
        categories={categories}
        trigger={trigger}
        onSubmit={onSubmit}
        onOpenChange={onOpenChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Report' }));
    const submit = screen.getByRole('button', { name: 'Send report' });
    expect(submit).toBeDisabled();
    await user.click(screen.getByRole('radio', { name: 'Harmful or unsafe' }));
    expect(submit).toBeEnabled();
    await user.type(screen.getByRole('textbox'), '  Suggests skipping a review step. ');
    await user.click(submit);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      category: 'harmful',
      details: 'Suggests skipping a review step.',
    });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: 'Report' })).toHaveFocus();
  });

  it('can be completed with the keyboard alone', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ReportDialog categories={categories} trigger={trigger} onSubmit={onSubmit} />);
    await user.tab();
    await user.keyboard('{Enter}');
    const radios = screen.getAllByRole('radio');
    radios[0]!.focus();
    await user.keyboard('{ArrowDown}');
    expect(radios[1]).toBeChecked();
    await user.tab();
    expect(screen.getByRole('textbox')).toHaveFocus();
    await user.keyboard('Details');
    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Send report' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenCalledWith({ category: 'harmful', details: 'Details' });
  });

  it('resets the form each time it opens, and Cancel and Escape close without submitting', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ReportDialog categories={categories} trigger={trigger} onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: 'Report' }));
    await user.click(screen.getByRole('radio', { name: 'Inaccurate' }));
    await user.type(screen.getByRole('textbox'), 'Draft');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Report' }));
    expect(screen.getByRole('radio', { name: 'Inaccurate' })).not.toBeChecked();
    expect(screen.getByRole('textbox')).toHaveValue('');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('stays open and busy while an async submit is pending, then closes', async () => {
    const user = userEvent.setup();
    let resolve!: () => void;
    const onSubmit = vi.fn(() => new Promise<void>((r) => (resolve = r)));
    render(<ReportDialog categories={categories} defaultOpen onSubmit={onSubmit} />);
    await user.click(screen.getByRole('radio', { name: 'Something else' }));
    await user.click(screen.getByRole('button', { name: 'Send report' }));
    const busy = screen.getByRole('button', { name: /Sending/ });
    expect(busy).toHaveAttribute('aria-busy', 'true');
    await user.click(busy);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await act(async () => resolve());
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('stays open with the form intact when an async submit fails', async () => {
    const user = userEvent.setup();
    let reject!: (e: Error) => void;
    const onSubmit = vi.fn(() => new Promise<void>((_, r) => (reject = r)));
    render(<ReportDialog categories={categories} defaultOpen onSubmit={onSubmit} />);
    await user.click(screen.getByRole('radio', { name: 'Inaccurate' }));
    await user.type(screen.getByRole('textbox'), 'Wrong year');
    await user.click(screen.getByRole('button', { name: 'Send report' }));
    await act(async () => reject(new Error('offline')));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Inaccurate' })).toBeChecked();
    expect(screen.getByRole('textbox')).toHaveValue('Wrong year');
    expect(screen.getByRole('button', { name: 'Send report' })).toBeEnabled();
  });

  it('works controlled, with submitting, closeOnSubmit off and required details', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <ReportDialog
        open
        onOpenChange={onOpenChange}
        categories={categories}
        onSubmit={onSubmit}
        closeOnSubmit={false}
        detailsRequired
        labels={{ details: 'Details' }}
      />,
    );
    await user.click(screen.getByRole('radio', { name: 'Inaccurate' }));
    expect(screen.getByRole('button', { name: 'Send report' })).toBeDisabled();
    await user.type(screen.getByRole('textbox', { name: 'Details' }), 'Wrong year');
    await user.click(screen.getByRole('button', { name: 'Send report' }));
    expect(onSubmit).toHaveBeenCalledWith({ category: 'inaccurate', details: 'Wrong year' });
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    rerender(
      <ReportDialog
        open
        submitting
        onOpenChange={onOpenChange}
        categories={categories}
        onSubmit={onSubmit}
      />,
    );
    expect(screen.getByRole('button', { name: /Sending/ })).toHaveAttribute('aria-busy', 'true');
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    rerender(<ReportDialog open={false} categories={categories} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('translates every string and passes className and ref to the dialog', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <ReportDialog
        ref={ref}
        defaultOpen
        className="custom"
        categories={categories}
        labels={{
          title: 'Prijavi odgovor',
          description: '',
          category: 'Kaj je narobe?',
          details: 'Podrobnosti',
          submit: 'Pošlji',
          cancel: 'Prekliči',
          close: 'Zapri',
        }}
      />,
    );
    const dialog = screen.getByRole('dialog', { name: 'Prijavi odgovor' });
    expect(ref.current).toBe(dialog);
    expect(dialog).toHaveClass('st-dialog', 'st-report-dialog', 'custom');
    expect(dialog).not.toHaveAttribute('aria-describedby');
    expect(screen.getByRole('radiogroup', { name: /Kaj je narobe\?/ })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Podrobnosti' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pošlji' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Prekliči' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zapri' })).toBeInTheDocument();
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    render(
      <div data-theme={theme}>
        <ReportDialog categories={categories} defaultOpen />
      </div>,
    );
    await expectNoA11yViolations(document.body);
  });
});

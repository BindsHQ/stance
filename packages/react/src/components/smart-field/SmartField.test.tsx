import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { SmartField, type SmartFieldStatus } from './SmartField';

const announcer = (container: HTMLElement) => container.querySelector('[data-st-announcer]')!;

describe('SmartField', () => {
  it('is a plain labelled field when idle', () => {
    render(<SmartField label="Supplier" defaultValue="Acme" />);
    const input = screen.getByRole('textbox', { name: 'Supplier' });
    expect(input).toHaveValue('Acme');
    expect(input).not.toHaveAttribute('aria-describedby');
    expect(screen.queryByText('Suggested by AI')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('says in words that a value is being suggested', () => {
    render(<SmartField label="Supplier" status="suggesting" />);
    const input = screen.getByRole('textbox', { name: 'Supplier' });
    expect(input).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Suggesting a value')).toHaveAttribute('role', 'status');
    expect(input).toHaveAccessibleDescription('Suggesting a value');
  });

  it('shows the suggestion with its mark and source, described on the control', () => {
    render(
      <SmartField
        label="Supplier"
        value=""
        suggestedValue="Northwind Ltd"
        suggestionSource="invoice.pdf"
        status="suggested"
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Supplier' });
    expect(input).toHaveValue('Northwind Ltd');
    expect(input).toHaveAccessibleDescription(/^Suggested by AI,\s*From invoice\.pdf$/);
    expect(screen.getByRole('button', { name: 'Accept' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled();
  });

  it('accepts the suggestion: value changes, status moves on, and it is announced', async () => {
    const onValueChange = vi.fn();
    const onAccept = vi.fn();
    const onStatusChange = vi.fn();
    const { container } = render(
      <SmartField
        label="Supplier"
        defaultValue="Old"
        suggestedValue="Northwind Ltd"
        defaultStatus="suggested"
        onValueChange={onValueChange}
        onAccept={onAccept}
        onStatusChange={onStatusChange}
      />,
    );
    expect(onValueChange).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Accept' }));
    expect(onValueChange).toHaveBeenCalledWith('Northwind Ltd');
    expect(onAccept).toHaveBeenCalledWith('Northwind Ltd');
    expect(onStatusChange).toHaveBeenCalledWith('accepted');
    expect(screen.getByRole('textbox')).toHaveValue('Northwind Ltd');
    expect(screen.getByText('Filled in by AI')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Accept' })).toBeNull();
    expect(announcer(container)).toHaveTextContent('Suggestion accepted');
  });

  it('undo after accepting restores the earlier value and is announced', async () => {
    const user = userEvent.setup();
    const onUndo = vi.fn();
    const { container } = render(
      <SmartField
        label="Supplier"
        defaultValue="Old"
        suggestedValue="Northwind Ltd"
        defaultStatus="suggested"
        onUndo={onUndo}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Accept' }));
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByRole('textbox')).toHaveValue('Old');
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Filled in by AI')).toBeNull();
    expect(announcer(container)).toHaveTextContent('Suggestion removed');
  });

  it('undo on an offered suggestion keeps the value the person had', async () => {
    const onValueChange = vi.fn();
    render(
      <SmartField
        label="Supplier"
        defaultValue="Mine"
        suggestedValue="Theirs"
        defaultStatus="suggested"
        onValueChange={onValueChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByRole('textbox')).toHaveValue('Mine');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('editing the value clears the AI mark', async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();
    render(
      <SmartField
        label="Supplier"
        suggestedValue="Northwind Ltd"
        defaultStatus="suggested"
        onStatusChange={onStatusChange}
      />,
    );
    await user.type(screen.getByRole('textbox'), '!');
    expect(screen.getByRole('textbox')).toHaveValue('Northwind Ltd!');
    expect(onStatusChange).toHaveBeenCalledWith('idle');
    expect(screen.queryByText('Suggested by AI')).toBeNull();
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-describedby');
  });

  it('works fully controlled', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = React.useState('');
      const [status, setStatus] = React.useState<SmartFieldStatus>('suggested');
      return (
        <>
          <SmartField
            label="Supplier"
            value={value}
            onValueChange={setValue}
            status={status}
            onStatusChange={setStatus}
            suggestedValue="Northwind Ltd"
          />
          <output>{`${status}:${value}`}</output>
        </>
      );
    }
    render(<Controlled />);
    expect(screen.getByText('suggested:')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Accept' }));
    expect(screen.getByText('accepted:Northwind Ltd')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByText('idle:')).toBeInTheDocument();
  });

  it('stays put when controlled status does not change', async () => {
    const onStatusChange = vi.fn();
    render(
      <SmartField
        label="Supplier"
        value=""
        status="suggested"
        suggestedValue="Northwind Ltd"
        onStatusChange={onStatusChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Accept' }));
    expect(onStatusChange).toHaveBeenCalledWith('accepted');
    expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
  });

  it('announces a suggestion when it arrives', () => {
    const { rerender, container } = render(<SmartField label="Supplier" status="suggesting" />);
    expect(announcer(container)).toBeEmptyDOMElement();
    rerender(<SmartField label="Supplier" status="suggested" suggestedValue="Northwind Ltd" />);
    expect(announcer(container)).toHaveTextContent('Suggestion ready');
  });

  it('offers regenerate and works from the keyboard', async () => {
    const user = userEvent.setup();
    const onRegenerate = vi.fn();
    render(
      <SmartField
        label="Supplier"
        suggestedValue="Northwind Ltd"
        defaultStatus="suggested"
        onRegenerate={onRegenerate}
      />,
    );
    await user.tab();
    expect(screen.getByRole('textbox')).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Accept' })).toHaveFocus();
    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Suggest again' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onRegenerate).toHaveBeenCalledTimes(1);
  });

  it('wires a custom control through a render function', async () => {
    const onValueChange = vi.fn();
    render(
      <SmartField
        label="Notes"
        suggestedValue="Net 30"
        defaultStatus="suggested"
        onValueChange={onValueChange}
      >
        {(control) => (
          <textarea
            id="notes"
            aria-label="Notes"
            value={control.value}
            aria-describedby={control['aria-describedby']}
            onChange={(e) => control.onValueChange(e.target.value)}
          />
        )}
      </SmartField>,
    );
    const area = screen.getByRole('textbox', { name: 'Notes' });
    expect(area).toHaveValue('Net 30');
    expect(area).toHaveAccessibleDescription('Suggested by AI');
    await userEvent.type(area, 'x');
    expect(onValueChange).toHaveBeenLastCalledWith('Net 30x');
  });

  it('passes description, error, required and disabled to the field', () => {
    render(
      <SmartField
        label="Supplier"
        description="As on the invoice"
        error="Enter a supplier"
        required
        disabled
        status="suggested"
        suggestedValue="A"
      />,
    );
    const input = screen.getByRole('textbox', { name: /Supplier/ });
    expect(input).toBeDisabled();
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.getAttribute('aria-describedby')!.split(' ')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Accept' })).toBeDisabled();
  });

  it('honours translated labels, ref, className and props', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <SmartField
        ref={ref}
        className="mine"
        id="supplier-field"
        label="Leverantör"
        status="suggested"
        suggestedValue="A"
        suggestionSource="faktura.pdf"
        labels={{ suggested: 'Föreslaget av AI', accept: 'Godkänn', source: (s) => <>Från {s}</> }}
      />,
    );
    expect(ref.current).toHaveClass('st-smart-field', 'mine');
    expect(ref.current).toHaveAttribute('id', 'supplier-field');
    expect(ref.current).toHaveAttribute('data-status', 'suggested');
    expect(screen.getByText('Föreslaget av AI')).toBeVisible();
    expect(screen.getByText('Från faktura.pdf')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Godkänn' })).toBeInTheDocument();
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <SmartField label="Supplier" />
        <SmartField label="Amount" status="suggesting" />
        <SmartField
          label="Due date"
          status="suggested"
          suggestedValue="30 June 2027"
          suggestionSource="invoice.pdf"
          onRegenerate={() => {}}
        />
        <SmartField label="Reference" status="accepted" defaultValue="INV 204" />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

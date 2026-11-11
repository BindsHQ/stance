import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { FormField } from '../form-field/FormField';
import { PinInput } from './PinInput';

const cells = () => screen.getAllByRole('textbox') as HTMLInputElement[];
const values = () =>
  cells()
    .map((c) => c.value)
    .join('');

describe('PinInput', () => {
  it('renders a labelled group of cells with one-time-code autofill on the first', () => {
    render(<PinInput aria-label="Verification code" />);
    expect(screen.getByRole('group', { name: 'Verification code' })).toBeInTheDocument();
    expect(cells()).toHaveLength(6);
    expect(screen.getByRole('textbox', { name: 'Digit 1 of 6' })).toHaveAttribute(
      'autocomplete',
      'one-time-code',
    );
    expect(screen.getByRole('textbox', { name: 'Digit 1 of 6' })).toHaveAttribute(
      'inputmode',
      'numeric',
    );
    expect(screen.getByRole('textbox', { name: 'Digit 2 of 6' })).toHaveAttribute(
      'autocomplete',
      'off',
    );
  });

  it('advances while typing and reports completion once', async () => {
    const onChange = vi.fn();
    const onComplete = vi.fn();
    render(<PinInput aria-label="Code" length={4} onChange={onChange} onComplete={onComplete} />);
    const user = userEvent.setup();
    await user.click(cells()[0]!);
    await user.keyboard('12');
    expect(cells()[2]).toHaveFocus();
    expect(onChange).toHaveBeenLastCalledWith('12');
    await user.keyboard('34');
    expect(values()).toBe('1234');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('1234');
    expect(screen.getByRole('group')).toHaveAttribute('data-complete');
  });

  it('rejects characters that are not allowed', async () => {
    render(<PinInput aria-label="Code" length={4} />);
    const user = userEvent.setup();
    await user.click(cells()[0]!);
    await user.keyboard('a1b2');
    expect(values()).toBe('12');
  });

  it('accepts letters when alphanumeric', async () => {
    render(<PinInput aria-label="Code" length={4} type="alphanumeric" />);
    await userEvent.click(cells()[0]!);
    await userEvent.keyboard('a1B2');
    expect(values()).toBe('a1B2');
    expect(screen.getByRole('textbox', { name: 'Character 1 of 4' })).toBeInTheDocument();
  });

  it('steps back with Backspace', async () => {
    render(<PinInput aria-label="Code" length={4} defaultValue="123" />);
    const user = userEvent.setup();
    await user.click(cells()[3]!);
    await user.keyboard('{Backspace}');
    expect(values()).toBe('12');
    expect(cells()[2]).toHaveFocus();
    await user.keyboard('{Backspace}{Backspace}');
    expect(values()).toBe('');
  });

  it('moves between cells with arrow keys, Home and End', async () => {
    render(<PinInput aria-label="Code" length={4} defaultValue="12" />);
    const user = userEvent.setup();
    await user.click(cells()[0]!);
    await user.keyboard('{ArrowRight}');
    expect(cells()[1]).toHaveFocus();
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(cells()[0]).toHaveFocus();
    await user.keyboard('{End}');
    expect(cells()[2]).toHaveFocus();
    await user.keyboard('{Home}');
    expect(cells()[0]).toHaveFocus();
  });

  it('fills every cell from a paste, ignoring separators', () => {
    const onComplete = vi.fn();
    render(<PinInput aria-label="Code" onComplete={onComplete} />);
    fireEvent.paste(cells()[0]!, { clipboardData: { getData: () => '482-915' } });
    expect(values()).toBe('482915');
    expect(onComplete).toHaveBeenCalledWith('482915');
    expect(cells()[5]).toHaveFocus();
  });

  it('accepts a whole code autofilled into the first cell', () => {
    render(<PinInput aria-label="Code" />);
    fireEvent.change(cells()[0]!, { target: { value: '730164' } });
    expect(values()).toBe('730164');
  });

  it('submits the joined value and supports masking', () => {
    const { container } = render(
      <form>
        <PinInput aria-label="PIN" name="pin" length={4} defaultValue="9021" mask />
      </form>,
    );
    expect(new FormData(container.querySelector('form')!).get('pin')).toBe('9021');
    expect(container.querySelectorAll('input[type="password"]')).toHaveLength(4);
  });

  it('supports controlled usage and disabled', async () => {
    function Controlled() {
      const [v, setV] = React.useState('1');
      return <PinInput aria-label="Code" length={3} value={v} onChange={setV} />;
    }
    const { unmount } = render(<Controlled />);
    await userEvent.click(cells()[1]!);
    await userEvent.keyboard('2');
    expect(values()).toBe('12');
    unmount();
    render(<PinInput aria-label="Code" disabled />);
    cells().forEach((c) => expect(c).toBeDisabled());
  });

  it('is labelled, described and marked invalid by FormField', async () => {
    render(
      <FormField
        label="Verification code"
        description="Sent to your email."
        error="That code has expired"
        required
      >
        <PinInput />
      </FormField>,
    );
    const group = screen.getByRole('group', { name: /Verification code/ });
    expect(group).toHaveAccessibleDescription('Sent to your email. That code has expired');
    expect(group).toHaveAttribute('data-invalid');
    expect(cells()[0]).toHaveAttribute('aria-invalid', 'true');
    expect(cells()[0]).toHaveAttribute('aria-required', 'true');
    await userEvent.click(screen.getByText('Verification code'));
    expect(cells()[0]).toHaveFocus();
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <FormField label="Verification code" error="That code has expired">
          <PinInput name="code" defaultValue="12" />
        </FormField>
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

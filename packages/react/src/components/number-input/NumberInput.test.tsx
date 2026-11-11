import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { FormField } from '../form-field/FormField';
import { NumberInput } from './NumberInput';

describe('NumberInput', () => {
  it('is a spinbutton with value attributes', () => {
    render(<NumberInput aria-label="Seats" defaultValue={5} min={1} max={50} />);
    const sb = screen.getByRole('spinbutton', { name: 'Seats' });
    expect(sb).toHaveAttribute('aria-valuenow', '5');
    expect(sb).toHaveAttribute('aria-valuemin', '1');
    expect(sb).toHaveAttribute('aria-valuemax', '50');
  });

  it('supports the APG keyboard model', async () => {
    const onChange = vi.fn();
    render(
      <NumberInput aria-label="Seats" defaultValue={5} min={1} max={50} onValueChange={onChange} />,
    );
    const sb = screen.getByRole('spinbutton');
    sb.focus();
    const user = userEvent.setup();
    await user.keyboard('{ArrowUp}');
    expect(sb).toHaveValue('6');
    await user.keyboard('{PageUp}');
    expect(sb).toHaveValue('16');
    await user.keyboard('{End}');
    expect(sb).toHaveValue('50');
    await user.keyboard('{ArrowUp}');
    expect(sb).toHaveValue('50');
    await user.keyboard('{Home}');
    expect(sb).toHaveValue('1');
    await user.keyboard('{PageDown}');
    expect(sb).toHaveValue('1');
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  it('parses and clamps typed text on blur', async () => {
    const onChange = vi.fn();
    render(
      <NumberInput aria-label="Price" min={0} max={100} step={0.5} onValueChange={onChange} />,
    );
    const sb = screen.getByRole('spinbutton');
    await userEvent.type(sb, '250');
    await userEvent.tab();
    expect(onChange).toHaveBeenLastCalledWith(100);
    expect(sb).toHaveValue('100.0');
    await userEvent.clear(sb);
    await userEvent.tab();
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('steps with the buttons, which are not tab stops', async () => {
    render(<NumberInput aria-label="Qty" defaultValue={0} max={1} />);
    const inc = screen.getByRole('button', { name: 'Increase' });
    expect(inc).toHaveAttribute('tabindex', '-1');
    await userEvent.click(inc);
    expect(screen.getByRole('spinbutton')).toHaveValue('1');
    expect(inc).toBeDisabled();
  });

  it('is controlled', async () => {
    render(<NumberInput aria-label="Qty" value={3} onValueChange={() => {}} />);
    screen.getByRole('spinbutton').focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(screen.getByRole('spinbutton')).toHaveValue('3');
  });

  it('integrates with FormField', () => {
    render(
      <FormField label="Users" required error="Required">
        <NumberInput />
      </FormField>,
    );
    const sb = screen.getByRole('spinbutton', { name: /Users/ });
    expect(sb).toBeRequired();
    expect(sb).toHaveAttribute('aria-invalid', 'true');
  });

  it.each(THEMES)('axe clean in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <FormField label="Licences">
          <NumberInput defaultValue={10} min={0} />
        </FormField>
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

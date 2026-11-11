import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { FormField } from '../form-field/FormField';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('toggles uncontrolled with label click and Space', async () => {
    const onChange = vi.fn();
    render(<Checkbox label="Send copy to signer" onCheckedChange={onChange} />);
    const cb = screen.getByRole('checkbox', { name: 'Send copy to signer' });
    await userEvent.click(screen.getByText('Send copy to signer'));
    expect(cb).toBeChecked();
    await userEvent.keyboard(' ');
    expect(cb).not.toBeChecked();
    expect(onChange).toHaveBeenNthCalledWith(1, true);
    expect(onChange).toHaveBeenNthCalledWith(2, false);
  });

  it('supports controlled indeterminate', () => {
    render(<Checkbox aria-label="Select all" checked="indeterminate" onCheckedChange={() => {}} />);
    const cb = screen.getByRole('checkbox', { name: 'Select all' }) as HTMLInputElement;
    expect(cb.indeterminate).toBe(true);
    expect(cb).toBePartiallyChecked();
  });

  it('links description and stays controlled', async () => {
    render(
      <Checkbox
        label="Archive"
        description="Hidden from the dashboard"
        checked={false}
        onCheckedChange={() => {}}
      />,
    );
    const cb = screen.getByRole('checkbox', { name: 'Archive' });
    expect(cb).toHaveAccessibleDescription('Hidden from the dashboard');
    await userEvent.click(cb);
    expect(cb).not.toBeChecked();
  });

  it('integrates with FormField', () => {
    render(
      <FormField label="Terms" error="You must accept the terms" required>
        <Checkbox />
      </FormField>,
    );
    const cb = screen.getByRole('checkbox', { name: /Terms/ });
    expect(cb).toBeRequired();
    expect(cb).toHaveAttribute('aria-invalid', 'true');
    expect(cb).toHaveAccessibleDescription('You must accept the terms');
  });

  it.each(THEMES)('axe clean in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <Checkbox label="One" defaultChecked />
        <Checkbox label="Two" description="Detail" disabled />
        <Checkbox aria-label="Three" checked="indeterminate" onCheckedChange={() => {}} />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { FormField } from '../form-field/FormField';
import { estimatePasswordStrength, PasswordInput } from './PasswordInput';

describe('PasswordInput', () => {
  it('toggles visibility with an accessible pressed button', async () => {
    render(
      <FormField label="Password">
        <PasswordInput />
      </FormField>,
    );
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');
    const toggle = screen.getByRole('button', { name: 'Show password' });
    await userEvent.click(toggle);
    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('shows strength feedback linked to the input', async () => {
    render(
      <FormField label="New password">
        <PasswordInput strength autoComplete="new-password" />
      </FormField>,
    );
    const input = screen.getByLabelText('New password');
    await userEvent.type(input, 'Tr0ub4dor&3xyz');
    expect(screen.getByText('Strength: Strong')).toBeInTheDocument();
    expect(input).toHaveAccessibleDescription('Strength: Strong');
  });

  it('scores passwords', () => {
    expect(estimatePasswordStrength('').score).toBe(0);
    expect(estimatePasswordStrength('abc').score).toBeLessThanOrEqual(1);
    expect(estimatePasswordStrength('Binds-2026-signing!').score).toBe(4);
  });

  it.each(THEMES)('axe clean in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <FormField label="Password">
          <PasswordInput strength defaultValue="abc12345" />
        </FormField>
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

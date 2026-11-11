import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { FormField } from '../form-field/FormField';
import { Input } from './Input';

describe('Input + FormField', () => {
  it('associates label, description and error', () => {
    render(
      <FormField
        label="Work email"
        description="We never share it."
        error="Enter a valid email"
        required
      >
        <Input type="email" />
      </FormField>,
    );
    const input = screen.getByRole('textbox', { name: /Work email/ });
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('We never share it. Enter a valid email');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email');
  });

  it('accepts typing and respects disabled', async () => {
    render(
      <>
        <FormField label="Name">
          <Input />
        </FormField>
        <FormField label="Locked" disabled>
          <Input />
        </FormField>
      </>,
    );
    const user = userEvent.setup();
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Ada');
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Ada');
    expect(screen.getByRole('textbox', { name: 'Locked' })).toBeDisabled();
  });

  it('works standalone with aria-label and renders affixes', () => {
    render(<Input aria-label="Website" prefix="https://" suffix=".com" invalid />);
    const input = screen.getByRole('textbox', { name: 'Website' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('https://')).toBeInTheDocument();
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <FormField label="Company" description="Legal name" error="Required" required>
          <Input />
        </FormField>
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

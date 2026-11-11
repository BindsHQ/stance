import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { Checkbox } from '../checkbox/Checkbox';
import { CheckboxGroup } from './CheckboxGroup';

function Example(props: Partial<React.ComponentProps<typeof CheckboxGroup>>) {
  return (
    <CheckboxGroup
      label="Notify me about"
      description="Email notifications"
      name="notify"
      {...props}
    >
      <Checkbox value="signed" label="Signed documents" />
      <Checkbox value="viewed" label="Viewed documents" />
      <Checkbox value="expired" label="Expired requests" />
    </CheckboxGroup>
  );
}

describe('CheckboxGroup', () => {
  it('renders a fieldset with legend and manages an array value', async () => {
    const onChange = vi.fn();
    render(<Example defaultValue={['signed']} onValueChange={onChange} />);
    expect(screen.getByRole('group', { name: 'Notify me about' })).toHaveAccessibleDescription(
      'Email notifications',
    );
    expect(screen.getByRole('checkbox', { name: 'Signed documents' })).toBeChecked();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Expired requests' }));
    expect(onChange).toHaveBeenLastCalledWith(['signed', 'expired']);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Signed documents' }));
    expect(onChange).toHaveBeenLastCalledWith(['expired']);
  });

  it('applies name and disabled to all items', () => {
    render(<Example disabled />);
    for (const cb of screen.getAllByRole('checkbox')) {
      expect(cb).toBeDisabled();
      expect(cb).toHaveAttribute('name', 'notify');
    }
  });

  it('is controlled', async () => {
    render(<Example value={['viewed']} onValueChange={() => {}} />);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Signed documents' }));
    expect(screen.getByRole('checkbox', { name: 'Signed documents' })).not.toBeChecked();
  });

  it('shows errors and marks items invalid', () => {
    render(<Example error="Choose at least one" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Choose at least one');
    expect(screen.getByRole('checkbox', { name: 'Viewed documents' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it.each(THEMES)('axe clean in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <Example orientation="horizontal" required />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

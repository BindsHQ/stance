import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { FormField } from '../form-field/FormField';
import { NativeSelect } from './NativeSelect';

const options = [
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer', disabled: true },
];

describe('NativeSelect', () => {
  it('renders options with placeholder selected by default', () => {
    render(
      <FormField label="Role">
        <NativeSelect options={options} placeholder="Choose a role" />
      </FormField>,
    );
    const select = screen.getByRole('combobox', { name: 'Role' }) as HTMLSelectElement;
    expect(select.value).toBe('');
    expect(screen.getByRole('option', { name: 'Viewer' })).toBeDisabled();
  });

  it('changes value and calls onChange', async () => {
    const onChange = vi.fn();
    render(
      <NativeSelect
        aria-label="Role"
        options={options}
        onChange={(e) => onChange(e.target.value)}
      />,
    );
    await userEvent.selectOptions(screen.getByRole('combobox'), 'editor');
    expect(onChange).toHaveBeenCalledWith('editor');
  });

  it('supports children and FormField errors', () => {
    render(
      <FormField label="Region" error="Pick a region">
        <NativeSelect>
          <optgroup label="Europe">
            <option value="uk">United Kingdom</option>
          </optgroup>
        </NativeSelect>
      </FormField>,
    );
    expect(screen.getByRole('combobox', { name: 'Region' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it.each(THEMES)('axe clean in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <FormField label="Role">
          <NativeSelect options={options} defaultValue="admin" />
        </FormField>
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

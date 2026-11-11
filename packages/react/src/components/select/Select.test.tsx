import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { FormField } from '../form-field/FormField';
import { Select } from './Select';
import type { SelectOptions } from './listbox-core';

const roles: SelectOptions = [
  { value: 'owner', label: 'Owner', description: 'Full access including billing' },
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'auditor', label: 'Auditor', disabled: true },
  { value: 'viewer', label: 'Viewer' },
];

const grouped: SelectOptions = [
  {
    label: 'Europe',
    options: [
      { value: 'gb', label: 'United Kingdom' },
      { value: 'fr', label: 'France' },
    ],
  },
  {
    label: 'Asia',
    options: [
      { value: 'in', label: 'India' },
      { value: 'sg', label: 'Singapore' },
    ],
  },
];

describe('Select', () => {
  it('renders a labelled select-only combobox inside FormField', () => {
    render(
      <FormField label="Role" description="Controls what the member can change">
        <Select options={roles} placeholder="Choose a role" />
      </FormField>,
    );
    const combo = screen.getByRole('combobox', { name: 'Role' });
    expect(combo).toHaveAttribute('aria-haspopup', 'listbox');
    expect(combo).toHaveAttribute('aria-expanded', 'false');
    expect(combo).toHaveTextContent('Choose a role');
    expect(combo).toHaveAccessibleDescription('Controls what the member can change');
  });

  it('opens on click, selects with a click and closes', async () => {
    const onValueChange = vi.fn();
    render(<Select aria-label="Role" options={roles} onValueChange={onValueChange} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('combobox'));
    const listbox = screen.getByRole('listbox', { name: 'Role' });
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-controls', listbox.id);
    await user.click(screen.getByRole('option', { name: /Editor/ }));
    expect(onValueChange).toHaveBeenCalledWith('editor');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(screen.getByRole('combobox')).toHaveTextContent('Editor');
    expect(screen.getByRole('combobox')).toHaveFocus();
  });

  it('supports the full keyboard model with aria-activedescendant', async () => {
    render(<Select aria-label="Role" options={roles} />);
    const user = userEvent.setup();
    await user.tab();
    const combo = screen.getByRole('combobox');
    await user.keyboard('{ArrowDown}');
    expect(combo).toHaveAttribute('aria-expanded', 'true');
    const active = () => document.getElementById(combo.getAttribute('aria-activedescendant')!);
    expect(active()).toHaveTextContent('Owner');
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    expect(active()).toHaveTextContent('Viewer'); // skips disabled Auditor
    await user.keyboard('{Home}');
    expect(active()).toHaveTextContent('Owner');
    await user.keyboard('{End}');
    expect(active()).toHaveTextContent('Viewer');
    await user.keyboard('{Enter}');
    expect(combo).toHaveTextContent('Viewer');
    expect(combo).toHaveAttribute('aria-expanded', 'false');
  });

  it('typeahead selects by label, and Escape closes without changing', async () => {
    render(<Select aria-label="Role" options={roles} defaultValue="admin" />);
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard('e');
    const combo = screen.getByRole('combobox');
    expect(document.getElementById(combo.getAttribute('aria-activedescendant')!)).toHaveTextContent(
      'Editor',
    );
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(combo).toHaveTextContent('Admin');
  });

  it('marks the selected option and renders groups', async () => {
    render(<Select aria-label="Country" options={grouped} defaultValue="in" />);
    await userEvent.click(screen.getByRole('combobox'));
    expect(screen.getByRole('group', { name: 'Asia' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'India' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: 'France' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('submits its value with a form', async () => {
    const onSubmit = vi.fn((e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      return new FormData(e.currentTarget).get('role');
    });
    render(
      <form onSubmit={onSubmit}>
        <Select aria-label="Role" name="role" options={roles} />
        <button type="submit">Invite</button>
      </form>,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Admin' }));
    await user.click(screen.getByRole('button', { name: 'Invite' }));
    expect(onSubmit.mock.results[0]!.value).toBe('admin');
  });

  it('is controllable', async () => {
    function Controlled() {
      const [v, setV] = React.useState<string | null>('owner');
      return (
        <>
          <Select aria-label="Role" options={roles} value={v} onValueChange={setV} />
          <button type="button" onClick={() => setV(null)}>
            Reset
          </button>
        </>
      );
    }
    render(<Controlled />);
    expect(screen.getByRole('combobox')).toHaveTextContent('Owner');
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByRole('combobox')).toHaveTextContent('Select…');
  });

  it('respects disabled and invalid states from FormField', () => {
    render(
      <FormField label="Role" error="Choose a role" disabled>
        <Select options={roles} />
      </FormField>,
    );
    const combo = screen.getByRole('combobox', { name: 'Role' });
    expect(combo).toBeDisabled();
    expect(combo).toHaveAttribute('aria-invalid', 'true');
  });

  it.each(THEMES)('has no axe violations when open in %s', async (theme) => {
    render(
      <div data-theme={theme}>
        <FormField label="Country">
          <Select options={grouped} defaultValue="gb" />
        </FormField>
      </div>,
    );
    await userEvent.click(screen.getByRole('combobox'));
    await expectNoA11yViolations(document.body);
  });
});

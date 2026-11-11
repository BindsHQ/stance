import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { FormField } from '../form-field/FormField';
import type { SelectOptions } from '../select/listbox-core';
import { MultiSelect } from './MultiSelect';

const departments: SelectOptions = [
  { value: 'sales', label: 'Sales' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'legal', label: 'Legal' },
  { value: 'finance', label: 'Finance', disabled: true },
  { value: 'support', label: 'Support' },
];

describe('MultiSelect', () => {
  it('exposes a combobox with a multi-selectable listbox', async () => {
    render(
      <FormField label="Departments">
        <MultiSelect options={departments} />
      </FormField>,
    );
    const combo = screen.getByRole('combobox', { name: 'Departments' });
    await userEvent.click(combo);
    const listbox = screen.getByRole('listbox', { name: 'Departments' });
    expect(listbox).toHaveAttribute('aria-multiselectable', 'true');
  });

  it('toggles options with the keyboard and stays open', async () => {
    const onValueChange = vi.fn();
    render(
      <MultiSelect aria-label="Departments" options={departments} onValueChange={onValueChange} />,
    );
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith(['sales']);
    await user.keyboard('{ArrowDown} ');
    expect(onValueChange).toHaveBeenLastCalledWith(['sales', 'marketing']);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Sales' })).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith(['sales']);
  });

  it('shows removable tags and clears', async () => {
    render(
      <MultiSelect
        aria-label="Departments"
        options={departments}
        defaultValue={['legal', 'support']}
      />,
    );
    const user = userEvent.setup();
    expect(screen.getByRole('list', { name: 'Selected' })).toHaveTextContent('Legal');
    await user.click(screen.getByRole('button', { name: 'Remove Legal' }));
    expect(screen.queryByRole('button', { name: 'Remove Legal' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(screen.queryByRole('list', { name: 'Selected' })).toBeNull();
  });

  it('selects all enabled options with the action and Ctrl+A', async () => {
    const onValueChange = vi.fn();
    render(
      <MultiSelect aria-label="Departments" options={departments} onValueChange={onValueChange} />,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('button', { name: 'Select all' }));
    expect(onValueChange).toHaveBeenLastCalledWith(['sales', 'marketing', 'legal', 'support']);
    await user.keyboard('{Control>}a{/Control}');
    expect(onValueChange).toHaveBeenLastCalledWith([]);
  });

  it('filters with search and removes the last tag with Backspace', async () => {
    render(
      <MultiSelect
        aria-label="Departments"
        options={departments}
        searchable
        defaultValue={['sales']}
      />,
    );
    const user = userEvent.setup();
    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.type(input, 'le');
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Sales', 'Legal']);
    await user.clear(input);
    await user.keyboard('{Backspace}');
    expect(screen.queryByRole('button', { name: 'Remove Sales' })).toBeNull();
  });

  it('submits each value with a form', async () => {
    const onSubmit = vi.fn((e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      return new FormData(e.currentTarget).getAll('dept');
    });
    render(
      <form onSubmit={onSubmit}>
        <MultiSelect
          aria-label="Departments"
          name="dept"
          options={departments}
          defaultValue={['sales', 'legal']}
        />
        <button type="submit">Save</button>
      </form>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit.mock.results[0]!.value).toEqual(['sales', 'legal']);
  });

  it.each(THEMES)('has no axe violations when open in %s', async (theme) => {
    render(
      <div data-theme={theme}>
        <FormField label="Departments">
          <MultiSelect options={departments} defaultValue={['sales']} />
        </FormField>
      </div>,
    );
    await userEvent.click(screen.getByRole('combobox'));
    await expectNoA11yViolations(document.body);
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { FormField } from '../form-field/FormField';
import type { SelectOptions } from '../select/listbox-core';
import { Combobox } from './Combobox';

const people: SelectOptions = [
  { value: 'u1', label: 'Amara Okafor', description: 'Legal' },
  { value: 'u2', label: 'Ben Hughes', description: 'Sales' },
  { value: 'u3', label: 'Chen Wei', description: 'Finance' },
  { value: 'u4', label: 'Dana Ruiz', description: 'Marketing', disabled: true },
];

describe('Combobox', () => {
  it('implements the APG combobox roles', async () => {
    render(
      <FormField label="Assign to">
        <Combobox options={people} />
      </FormField>,
    );
    const input = screen.getByRole('combobox', { name: 'Assign to' });
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    await userEvent.type(input, 'b');
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox', { name: 'Assign to' })).toBeInTheDocument();
  });

  it('filters as you type and selects with arrows + Enter', async () => {
    const onValueChange = vi.fn();
    render(<Combobox aria-label="Assign to" options={people} onValueChange={onValueChange} />);
    const user = userEvent.setup();
    const input = screen.getByRole('combobox');
    await user.type(input, 'chen');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(document.getElementById(input.getAttribute('aria-activedescendant')!)).toHaveTextContent(
      'Chen Wei',
    );
    await user.keyboard('{Enter}');
    expect(onValueChange).toHaveBeenCalledWith('u3');
    expect(input).toHaveValue('Chen Wei');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('opens with ArrowDown showing all options, skipping disabled ones', async () => {
    render(<Combobox aria-label="Assign to" options={people} />);
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard('{ArrowDown}');
    const input = screen.getByRole('combobox');
    expect(screen.getAllByRole('option')).toHaveLength(4);
    expect(document.getElementById(input.getAttribute('aria-activedescendant')!)).toHaveTextContent(
      'Amara Okafor',
    );
    await user.keyboard('{ArrowUp}');
    expect(document.getElementById(input.getAttribute('aria-activedescendant')!)).toHaveTextContent(
      'Chen Wei',
    );
    await user.keyboard('{ArrowDown}');
    expect(document.getElementById(input.getAttribute('aria-activedescendant')!)).toHaveTextContent(
      'Amara Okafor',
    );
  });

  it('Escape closes the list, then clears the input', async () => {
    render(<Combobox aria-label="Assign to" options={people} defaultValue="u1" />);
    const user = userEvent.setup();
    const input = screen.getByRole('combobox');
    expect(input).toHaveValue('Amara Okafor');
    await user.click(input);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
    await user.keyboard('{Escape}');
    expect(input).toHaveValue('');
  });

  it('reverts unmatched text on blur unless custom values are allowed', async () => {
    const onValueChange = vi.fn();
    const { unmount } = render(
      <>
        <Combobox aria-label="Assign to" options={people} defaultValue="u2" />
        <button type="button">Next</button>
      </>,
    );
    const user = userEvent.setup();
    await user.clear(screen.getByRole('combobox'));
    await user.type(screen.getByRole('combobox'), 'zzz');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('combobox')).toHaveValue('Ben Hughes');
    unmount();

    render(
      <Combobox aria-label="Tag" options={people} allowCustomValue onValueChange={onValueChange} />,
    );
    await user.type(screen.getByRole('combobox'), 'Partners');
    expect(screen.getByRole('status')).toHaveTextContent('Press Enter to use “Partners”');
    await user.keyboard('{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith('Partners');
  });

  it('supports async search with controlled text and loading state', async () => {
    function Async() {
      const [text, setText] = React.useState('');
      return (
        <Combobox
          aria-label="Search users"
          options={[]}
          filter={false}
          loading={text.length > 0}
          inputValue={text}
          onInputChange={setText}
        />
      );
    }
    render(<Async />);
    await userEvent.type(screen.getByRole('combobox'), 'am');
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
  });

  it('shows an empty state', async () => {
    render(<Combobox aria-label="Assign to" options={people} emptyText="No people found" />);
    await userEvent.type(screen.getByRole('combobox'), 'xyz');
    expect(screen.getByRole('status')).toHaveTextContent('No people found');
  });

  it('submits the value with a form', async () => {
    const onSubmit = vi.fn((e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      return new FormData(e.currentTarget).get('owner');
    });
    render(
      <form onSubmit={onSubmit}>
        <Combobox aria-label="Owner" name="owner" options={people} defaultValue="u3" />
        <button type="submit">Save</button>
      </form>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit.mock.results[0]!.value).toBe('u3');
  });

  it.each(THEMES)('has no axe violations when open in %s', async (theme) => {
    render(
      <div data-theme={theme}>
        <FormField label="Assign to">
          <Combobox options={people} />
        </FormField>
      </div>,
    );
    await userEvent.click(screen.getByRole('combobox'));
    await expectNoA11yViolations(document.body);
  });
});

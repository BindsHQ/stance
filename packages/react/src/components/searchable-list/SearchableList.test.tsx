import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { SearchableList } from './SearchableList';

const people = [
  { id: 'amara', name: 'Amara Okafor', team: 'Sales' },
  { id: 'lukas', name: 'Lukas Brenner', team: 'Legal' },
  { id: 'priya', name: 'Priya Nair', team: 'Sales' },
  { id: 'tomas', name: 'Tomás Ruiz', team: 'Finance', disabled: true },
  { id: 'hana', name: 'Hana Sato', team: 'Operations' },
];

const base = {
  items: people,
  getItemLabel: (p: (typeof people)[number]) => p.name,
  getItemKey: (p: (typeof people)[number]) => p.id,
  getItemKeywords: (p: (typeof people)[number]) => [p.team],
  listLabel: 'Organisation users',
  searchLabel: 'Search users',
};

describe('SearchableList', () => {
  it('filters by label and keywords and announces counts', async () => {
    render(<SearchableList {...base} />);
    expect(screen.getByRole('status')).toHaveTextContent('5 results');
    const user = userEvent.setup();
    await user.type(screen.getByRole('searchbox', { name: 'Search users' }), 'sales');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByRole('status')).toHaveTextContent('2 of 5 results');
  });

  it('shows an empty state', async () => {
    render(<SearchableList {...base} emptyState={(q) => <p>No users match {q}</p>} />);
    await userEvent.type(screen.getByRole('searchbox'), 'zzz');
    expect(screen.getByText('No users match zzz')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('No results for “zzz”');
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('supports fuzzy ranking', async () => {
    render(<SearchableList {...base} matchMode="fuzzy" />);
    await userEvent.type(screen.getByRole('searchbox'), 'pn');
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Priya Nair');
  });

  it('selectable: combobox drives a listbox with aria-activedescendant', async () => {
    const onSelectionChange = vi.fn();
    render(
      <SearchableList
        {...base}
        selectable
        isItemDisabled={(p) => Boolean(p.disabled)}
        onSelectionChange={onSelectionChange}
      />,
    );
    const input = screen.getByRole('combobox', { name: 'Search users' });
    expect(input).toHaveAttribute(
      'aria-controls',
      screen.getByRole('listbox', { name: 'Organisation users' }).id,
    );
    const user = userEvent.setup();
    await user.click(input);
    await user.keyboard('{ArrowDown}');
    expect(input.getAttribute('aria-activedescendant')).toBe(
      screen.getByRole('option', { name: 'Amara Okafor' }).id,
    );
    await user.keyboard('{ArrowUp}');
    // ArrowUp at first item stays on first
    expect(input.getAttribute('aria-activedescendant')).toBe(
      screen.getByRole('option', { name: 'Amara Okafor' }).id,
    );
    await user.keyboard('{Control>}{End}{/Control}');
    expect(input.getAttribute('aria-activedescendant')).toBe(
      screen.getByRole('option', { name: 'Hana Sato' }).id,
    );
    await user.keyboard('{ArrowUp}');
    // Tomás is disabled → skipped
    expect(input.getAttribute('aria-activedescendant')).toBe(
      screen.getByRole('option', { name: 'Priya Nair' }).id,
    );
    await user.keyboard('{Enter}');
    expect(onSelectionChange).toHaveBeenCalledWith('priya', people[2]);
    expect(screen.getByRole('option', { name: 'Priya Nair' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('selectable: controlled selection and click', async () => {
    function Controlled() {
      const [key, setKey] = React.useState<React.Key | null>('lukas');
      return <SearchableList {...base} selectable selectedKey={key} onSelectionChange={setKey} />;
    }
    render(<Controlled />);
    expect(screen.getByRole('option', { name: 'Lukas Brenner' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await userEvent.click(screen.getByRole('option', { name: 'Hana Sato' }));
    expect(screen.getByRole('option', { name: 'Hana Sato' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('supports a controlled query', async () => {
    function Controlled() {
      const [q, setQ] = React.useState('legal');
      return (
        <>
          <SearchableList {...base} query={q} onQueryChange={setQ} />
          <button type="button" onClick={() => setQ('')}>
            Reset
          </button>
        </>
      );
    }
    render(<Controlled />);
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    await userEvent.click(screen.getByText('Reset'));
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <SearchableList {...base} />
        <SearchableList {...base} selectable searchLabel="Pick a user" listLabel="Users to pick" />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

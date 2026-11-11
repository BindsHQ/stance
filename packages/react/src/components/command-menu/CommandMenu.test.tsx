import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { fuzzyScore } from '../../internal/fuzzy-score';
import {
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandMenu,
  CommandSeparator,
} from './CommandMenu';

function Example({ onSelect = vi.fn() }: { onSelect?: (v: string) => void }) {
  return (
    <CommandMenu label="Actions">
      <CommandInput />
      <CommandList>
        <CommandGroup heading="Templates">
          <CommandItem
            value="New template"
            keywords={['create']}
            onSelect={onSelect}
            shortcut="⌘N"
          />
          <CommandItem value="Import from Outlook" onSelect={onSelect} disabled />
          <CommandItem value="Browse gallery" onSelect={onSelect} />
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="People">
          <CommandItem value="Invite user" onSelect={onSelect} />
        </CommandGroup>
      </CommandList>
      <CommandEmpty>No commands match.</CommandEmpty>
    </CommandMenu>
  );
}

describe('CommandMenu', () => {
  it('wires the combobox to the listbox and highlights the first item', () => {
    render(<Example />);
    const input = screen.getByRole('combobox', { name: 'Actions' });
    const listbox = screen.getByRole('listbox', { name: 'Actions' });
    expect(input).toHaveAttribute('aria-controls', listbox.id);
    const first = screen.getByRole('option', { name: /New template/ });
    expect(input).toHaveAttribute('aria-activedescendant', first.id);
    expect(first).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('group', { name: 'Templates' })).toBeInTheDocument();
  });

  it('moves with arrow keys, skips disabled items and wraps', async () => {
    render(<Example />);
    const input = screen.getByRole('combobox');
    await userEvent.click(input);
    await userEvent.keyboard('{ArrowDown}');
    expect(input).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'Browse gallery' }).id,
    );
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(input).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: /New template/ }).id,
    );
    await userEvent.keyboard('{ArrowUp}');
    expect(input).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'Invite user' }).id,
    );
  });

  it('filters by value and keywords, and runs onSelect with Enter', async () => {
    const onSelect = vi.fn();
    render(<Example onSelect={onSelect} />);
    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'create');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith('New template');
  });

  it('runs onSelect on click but not for disabled items', async () => {
    const onSelect = vi.fn();
    render(<Example onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('option', { name: 'Import from Outlook' }));
    expect(onSelect).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('option', { name: 'Invite user' }));
    expect(onSelect).toHaveBeenCalledWith('Invite user');
  });

  it('shows the empty state as a status message', async () => {
    render(<Example />);
    await userEvent.type(screen.getByRole('combobox'), 'zzzz');
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByRole('status')).toHaveTextContent('No commands match.');
  });

  it('fuzzyScore ranks exact > prefix > word > substring > subsequence', () => {
    const s = (t: string) => fuzzyScore(t, 'temp');
    expect(fuzzyScore('temp', 'temp')).toBeGreaterThan(s('template'));
    expect(s('template')).toBeGreaterThan(s('new template'));
    expect(s('new template')).toBeGreaterThan(s('attempt'));
    expect(s('attempt')).toBeGreaterThan(fuzzyScore('the empire', 'temp'));
    expect(fuzzyScore('invite', 'xyz')).toBe(0);
  });

  it('has no axe violations', async () => {
    const { container } = render(<Example />);
    await expectNoA11yViolations(container);
  });
});

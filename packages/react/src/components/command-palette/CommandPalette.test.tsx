import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { CommandGroup, CommandItem } from '../command-menu/CommandMenu';
import { CommandPalette } from './CommandPalette';

function Example({ onSelect = vi.fn() }: { onSelect?: (v: string) => void }) {
  return (
    <CommandPalette trigger={<button type="button">Search</button>}>
      <CommandGroup heading="Go to">
        <CommandItem value="Dashboard" onSelect={onSelect} />
        <CommandItem value="Integrations" onSelect={onSelect} />
      </CommandGroup>
    </CommandPalette>
  );
}

describe('CommandPalette', () => {
  it('opens with Ctrl+K / ⌘K and focuses the search', async () => {
    render(<Example />);
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    // Exactly one of the two matches `mod` on this platform, so the palette is open.
    const dialog = await screen.findByRole('dialog', { name: 'Command palette' });
    expect(dialog).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'Command palette' })).toHaveFocus(),
    );
  });

  it('closes after selecting and restores focus to the trigger', async () => {
    const onSelect = vi.fn();
    render(<Example onSelect={onSelect} />);
    const user = userEvent.setup();
    const trigger = screen.getByRole('button', { name: 'Search' });
    await user.click(trigger);
    await user.keyboard('integ{Enter}');
    expect(onSelect).toHaveBeenCalledWith('Integrations');
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('closes on Escape', async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('can disable the hotkey', () => {
    render(
      <CommandPalette hotkey={false}>
        <CommandItem value="Dashboard" />
      </CommandPalette>,
    );
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('has no axe violations', async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    await expectNoA11yViolations(document.body);
  });
});

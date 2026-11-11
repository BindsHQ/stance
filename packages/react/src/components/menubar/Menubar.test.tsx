import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarShortcut,
  MenubarTrigger,
} from './Menubar';

function Example({ onSelect = vi.fn() }: { onSelect?: (v: string) => void }) {
  return (
    <Menubar aria-label="Template editor">
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onSelect={() => onSelect('new')}>
            New template <MenubarShortcut>⌘N</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onSelect={() => onSelect('export')}>Export HTML</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onSelect={() => onSelect('undo')}>Undo</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>View</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onSelect={() => onSelect('preview')}>Preview in Outlook</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

describe('Menubar', () => {
  it('renders a menubar with a single tab stop and roving arrows', async () => {
    render(<Example />);
    const user = userEvent.setup();
    expect(screen.getByRole('menubar', { name: 'Template editor' })).toBeInTheDocument();
    await user.tab();
    expect(screen.getByRole('menuitem', { name: 'File' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus();
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(screen.getByRole('menuitem', { name: 'View' })).toHaveFocus();
    expect(screen.getAllByRole('menuitem').filter((el) => el.tabIndex === 0)).toHaveLength(1);
  });

  it('opens with ArrowDown and moves between open menus with ArrowRight/Left', async () => {
    render(<Example />);
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menu', { name: 'File' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /New template/ })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.queryByRole('menu', { name: 'File' })).toBeNull();
    expect(screen.getByRole('menu', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Undo' })).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('menu', { name: 'File' })).toBeInTheDocument();
  });

  it('selects an item, closes and returns focus to its trigger', async () => {
    const onSelect = vi.fn();
    render(<Example onSelect={onSelect} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('menuitem', { name: 'View' }));
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith('preview');
    expect(screen.queryByRole('menu')).toBeNull();
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'View' })).toHaveFocus());
  });

  it('Escape closes the open menu', async () => {
    render(<Example />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('menuitem', { name: 'Edit' }));
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus());
  });

  it('has no axe violations when a menu is open', async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole('menuitem', { name: 'File' }));
    await expectNoA11yViolations(document.body);
  });
});

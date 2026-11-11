import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './DropdownMenu';

function Example({
  onSelect = vi.fn(),
  onOpenChange,
}: {
  onSelect?: (v: string) => void;
  onOpenChange?: (o: boolean) => void;
}) {
  const [show, setShow] = React.useState(true);
  const [density, setDensity] = React.useState('comfortable');
  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger>Template actions</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup label="Template">
          <DropdownMenuItem onSelect={() => onSelect('edit')}>
            Edit <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onSelect('duplicate')}>Duplicate</DropdownMenuItem>
          <DropdownMenuItem disabled onSelect={() => onSelect('archive')}>
            Archive
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked={show} onCheckedChange={setShow}>
          Show preview
        </DropdownMenuCheckboxItem>
        <DropdownMenuRadioGroup value={density} onValueChange={setDensity}>
          <DropdownMenuRadioItem value="comfortable">Comfortable</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Share</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onSelect={() => onSelect('email')}>Email link</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onSelect('copy')}>Copy link</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem destructive onSelect={() => onSelect('delete')}>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const trigger = () => screen.getByRole('button', { name: 'Template actions' });

describe('DropdownMenu', () => {
  it('opens on click with correct ARIA and focuses the first item', async () => {
    render(<Example />);
    expect(trigger()).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger());
    const menu = screen.getByRole('menu', { name: 'Template actions' });
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(trigger()).toHaveAttribute('aria-controls', menu.id);
    expect(screen.getByRole('menuitem', { name: /Edit/ })).toHaveFocus();
  });

  it('ArrowUp on the trigger opens with the last item focused', async () => {
    render(<Example />);
    trigger().focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus();
  });

  it('navigates with arrows, Home/End, skips disabled items and wraps', async () => {
    render(<Example />);
    const user = userEvent.setup();
    trigger().focus();
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitemcheckbox', { name: 'Show preview' })).toHaveFocus();
    await user.keyboard('{End}');
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: /Edit/ })).toHaveFocus();
    await user.keyboard('{Home}{ArrowUp}');
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus();
  });

  it('supports typeahead', async () => {
    render(<Example />);
    await userEvent.click(trigger());
    await userEvent.keyboard('co');
    expect(screen.getByRole('menuitemradio', { name: 'Compact' })).toHaveFocus();
  });

  it('selects with Enter, closes and returns focus to the trigger', async () => {
    const onSelect = vi.fn();
    render(<Example onSelect={onSelect} />);
    const user = userEvent.setup();
    trigger().focus();
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(onSelect).toHaveBeenCalledWith('duplicate');
    expect(screen.queryByRole('menu')).toBeNull();
    await waitFor(() => expect(trigger()).toHaveFocus());
  });

  it('does not select disabled items', async () => {
    const onSelect = vi.fn();
    render(<Example onSelect={onSelect} />);
    await userEvent.click(trigger());
    await userEvent.click(screen.getByRole('menuitem', { name: 'Archive' }));
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole('menuitem', { name: 'Archive' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('toggles checkbox and radio items without closing', async () => {
    render(<Example />);
    await userEvent.click(trigger());
    const check = screen.getByRole('menuitemcheckbox', { name: 'Show preview' });
    expect(check).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(check);
    expect(check).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Compact' }));
    expect(screen.getByRole('menuitemradio', { name: 'Compact' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('menuitemradio', { name: 'Comfortable' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    expect(screen.getByRole('menu', { name: 'Template actions' })).toBeInTheDocument();
  });

  it('opens submenus with ArrowRight and closes them with ArrowLeft', async () => {
    const onSelect = vi.fn();
    render(<Example onSelect={onSelect} />);
    const user = userEvent.setup();
    await user.click(trigger());
    const share = screen.getByRole('menuitem', { name: 'Share' });
    share.focus();
    expect(share).toHaveAttribute('aria-haspopup', 'menu');
    await user.keyboard('{ArrowRight}');
    expect(share).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menuitem', { name: 'Email link' })).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.queryByRole('menuitem', { name: 'Email link' })).toBeNull();
    expect(share).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onSelect).toHaveBeenCalledWith('copy');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('Escape closes only the submenu, then the menu', async () => {
    render(<Example />);
    const user = userEvent.setup();
    await user.click(trigger());
    screen.getByRole('menuitem', { name: 'Share' }).focus();
    await user.keyboard('{ArrowRight}');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menuitem', { name: 'Email link' })).toBeNull();
    expect(screen.getByRole('menu', { name: 'Template actions' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Share' })).toHaveFocus());
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
    await waitFor(() => expect(trigger()).toHaveFocus());
  });

  it('closes on outside click and Tab', async () => {
    render(
      <>
        <Example />
        <button type="button">Elsewhere</button>
      </>,
    );
    const user = userEvent.setup();
    await user.click(trigger());
    await new Promise((r) => setTimeout(r, 5));
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }));
    expect(screen.queryByRole('menu')).toBeNull();
    await user.click(trigger());
    await user.keyboard('{Tab}');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('keeps the menu open when onSelect prevents default', async () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Stay</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Stay' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('supports controlled open state', async () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <DropdownMenu open={false} onOpenChange={onOpenChange}>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>One</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole('menu')).toBeNull();
    rerender(
      <DropdownMenu open onOpenChange={onOpenChange}>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>One</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it.each(THEMES)('has no axe violations when open in %s', async (theme) => {
    render(
      <div data-theme={theme}>
        <Example />
      </div>,
    );
    await userEvent.click(trigger());
    await expectNoA11yViolations(document.body);
  });
});

describe('DropdownMenu focus return', () => {
  it('returns focus to the trigger when selection leaves focus on a non-tabbable element', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <div data-testid="wrapper" tabIndex={-1} />
        <DropdownMenu>
          <DropdownMenuTrigger>Theme</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onSelect={() =>
                (document.querySelector('[data-testid="wrapper"]') as HTMLElement).focus()
              }
            >
              Dark
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>,
    );
    const trigger = screen.getByRole('button', { name: 'Theme' });
    trigger.focus();
    await user.keyboard('{Enter}');
    await user.keyboard('{Enter}');
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('does not steal focus from a dialog opened by the item', async () => {
    const user = userEvent.setup();
    function Example() {
      const [open, setOpen] = React.useState(false);
      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => setOpen(true)}>Rename</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {open && (
            <div role="dialog" aria-label="Rename" data-stance-layer="">
              <input aria-label="Name" autoFocus />
            </div>
          )}
        </>
      );
    }
    render(<Example />);
    screen.getByRole('button', { name: 'Actions' }).focus();
    await user.keyboard('{Enter}');
    await user.keyboard('{Enter}');
    await new Promise((r) => setTimeout(r, 10));
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus();
  });
});

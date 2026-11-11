import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { ActionMenu, type ActionMenuItem } from './ActionMenu';

const make = (fn: (v: string) => void): ActionMenuItem[] => [
  { label: 'Edit signature', onSelect: () => fn('edit'), shortcut: '⌘E' },
  { label: 'Assign to users', onSelect: () => fn('assign') },
  {
    label: 'Export',
    items: [
      { label: 'HTML', onSelect: () => fn('html') },
      { label: 'Image', onSelect: () => fn('png') },
    ],
  },
  { type: 'separator' },
  { label: 'Delete', destructive: true, onSelect: () => fn('delete') },
  { label: 'Archive', disabled: true, onSelect: () => fn('archive') },
];

describe('ActionMenu', () => {
  it('renders a labelled icon trigger and opens the menu', async () => {
    render(<ActionMenu items={make(vi.fn())} />);
    const trigger = screen.getByRole('button', { name: 'More actions' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    await userEvent.click(trigger);
    expect(screen.getByRole('menu', { name: 'More actions' })).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem')).toHaveLength(5);
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('calls onSelect for items and nested submenu items', async () => {
    const fn = vi.fn();
    render(<ActionMenu items={make(fn)} label="Actions for Default template" />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Actions for Default template' }));
    await user.click(screen.getByRole('menuitem', { name: /Assign/ }));
    expect(fn).toHaveBeenCalledWith('assign');
    await user.click(screen.getByRole('button'));
    screen.getByRole('menuitem', { name: 'Export' }).focus();
    await user.keyboard('{ArrowRight}{ArrowDown}{Enter}');
    expect(fn).toHaveBeenCalledWith('png');
    await waitFor(() => expect(screen.getByRole('button')).toHaveFocus());
  });

  it('accepts a custom trigger', async () => {
    render(<ActionMenu items={make(vi.fn())} trigger={<button type="button">Manage</button>} />);
    await userEvent.click(screen.getByRole('button', { name: 'Manage' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('has no axe violations when open', async () => {
    render(<ActionMenu items={make(vi.fn())} />);
    await userEvent.click(screen.getByRole('button', { name: 'More actions' }));
    await expectNoA11yViolations(document.body);
  });
});

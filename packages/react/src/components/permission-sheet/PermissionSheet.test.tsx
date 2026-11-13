import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { PermissionSheet, type PermissionSheetPermission } from './PermissionSheet';

const permissions: PermissionSheetPermission[] = [
  {
    id: 'read',
    title: 'Read your calendar',
    description: 'Events from the last 30 days',
    granted: true,
    required: true,
  },
  { id: 'write', title: 'Create events', granted: false, risk: 'medium' },
  {
    id: 'delete',
    title: 'Delete events',
    description: 'Any event you own',
    granted: false,
    risk: 'high',
  },
];

function Stateful(props: Partial<React.ComponentProps<typeof PermissionSheet>>) {
  const [list, setList] = React.useState(permissions);
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Manage</button>
      <PermissionSheet
        open={open}
        onOpenChange={setOpen}
        title="Calendar permissions"
        description="Choose what the assistant may do."
        permissions={list}
        onPermissionsChange={setList}
        {...props}
      />
    </>
  );
}

describe('PermissionSheet', () => {
  it('renders nothing while closed', () => {
    render(<PermissionSheet open={false} title="Calendar" permissions={permissions} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('is a dialog with a labelled group of switches', () => {
    render(
      <PermissionSheet
        open
        title="Calendar permissions"
        description="Choose what the assistant may do."
        permissions={permissions}
      />,
    );
    const dialog = screen.getByRole('dialog', { name: 'Calendar permissions' });
    expect(dialog).toHaveAccessibleDescription('Choose what the assistant may do.');
    const group = within(dialog).getByRole('group', { name: 'Calendar permissions' });
    const switches = within(group).getAllByRole('switch');
    expect(switches).toHaveLength(3);
    expect(switches[1]).toHaveAccessibleName('Create events Medium risk');
    expect(switches[2]).toHaveAccessibleName('Delete events High risk');
    expect(switches[2]).toHaveAccessibleDescription('Any event you own');
    expect(switches[1]).toHaveAttribute('aria-checked', 'false');
  });

  it('keeps required permissions on, disabled and explained', () => {
    render(<PermissionSheet open title="Calendar" permissions={permissions} />);
    const required = screen.getByRole('switch', { name: 'Read your calendar' });
    expect(required).toBeDisabled();
    expect(required).toHaveAttribute('aria-checked', 'true');
    expect(required).toHaveAccessibleDescription(
      'Events from the last 30 days Required. This cannot be turned off.',
    );
  });

  it('reports the next permissions when a switch changes', async () => {
    const onPermissionsChange = vi.fn();
    render(
      <PermissionSheet
        open
        title="Calendar"
        permissions={permissions}
        onPermissionsChange={onPermissionsChange}
      />,
    );
    await userEvent.click(screen.getByRole('switch', { name: /Create events/ }));
    expect(onPermissionsChange).toHaveBeenCalledTimes(1);
    const next = onPermissionsChange.mock.calls[0]![0] as PermissionSheetPermission[];
    expect(next.map((p) => p.granted)).toEqual([true, true, false]);
  });

  it('toggles with the keyboard and saves, then closes and returns focus', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<Stateful onSave={onSave} />);
    const opener = screen.getByRole('button', { name: 'Manage' });
    await user.click(opener);
    const toggle = screen.getByRole('switch', { name: /Delete events/ });
    toggle.focus();
    await user.keyboard(' ');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect((onSave.mock.calls[0]![0] as PermissionSheetPermission[])[2]!.granted).toBe(true);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(opener).toHaveFocus();
  });

  it('closes with Escape and with Cancel without saving', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<Stateful onSave={onSave} />);
    await user.click(screen.getByRole('button', { name: 'Manage' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Manage' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('works uncontrolled and has no footer without onSave', () => {
    render(<PermissionSheet defaultOpen title="Calendar" permissions={permissions} />);
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
  });

  it('uses translated labels and renders children', () => {
    render(
      <PermissionSheet
        open
        title="Kalender"
        permissions={permissions}
        onSave={() => {}}
        labels={{ save: 'Spara', required: 'Krävs.', risk: { high: 'Hög risk' } }}
      >
        <p>Privacy policy</p>
      </PermissionSheet>,
    );
    expect(screen.getByRole('button', { name: 'Spara' })).toBeVisible();
    expect(screen.getByText('Krävs.')).toBeVisible();
    expect(screen.getByText('Hög risk')).toBeVisible();
    expect(screen.getByText('Privacy policy')).toBeVisible();
  });

  it('forwards the ref, className and props', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <PermissionSheet ref={ref} className="mine" id="perm" open title="x" permissions={[]} />,
    );
    expect(ref.current).toHaveClass('st-permission-sheet', 'mine');
    expect(ref.current).toHaveAttribute('id', 'perm');
    expect(ref.current).toHaveAttribute('role', 'dialog');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    render(
      <div data-theme={theme}>
        <PermissionSheet
          open
          title="Calendar permissions"
          description="Choose what the assistant may do."
          permissions={permissions}
          onSave={() => {}}
        />
      </div>,
    );
    await expectNoA11yViolations(document.body);
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { Icon } from '../../icons/Icon';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
  SidebarToggle,
} from './Sidebar';

function Example(props: Partial<React.ComponentProps<typeof Sidebar>>) {
  return (
    <Sidebar aria-label="Dashboard" activeStyle="inverted" {...props}>
      <SidebarHeader>
        <span>eSignify</span>
        <SidebarToggle />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup label="Workspace">
          <SidebarItem href="/dashboard" icon={<Icon name="home" />} active>
            Dashboard
          </SidebarItem>
          <SidebarItem href="/dashboard/templates" icon={<Icon name="file-text" />} badge={4}>
            My Templates
          </SidebarItem>
          <SidebarItem asChild icon={<Icon name="users" />}>
            <a href="/dashboard/signatures">Org Users</a>
          </SidebarItem>
        </SidebarGroup>
        <SidebarGroup label="Admin" collapsible>
          <SidebarItem href="/dashboard/integrations" icon={<Icon name="link" />}>
            Integrations
          </SidebarItem>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarItem icon={<Icon name="log-out" />} onClick={() => {}}>
            Log out
          </SidebarItem>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}

describe('Sidebar', () => {
  it('renders a labelled navigation landmark with grouped lists', () => {
    render(<Example />);
    expect(screen.getByRole('navigation', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Workspace' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Org Users' })).toHaveClass('st-sidebar__item');
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
  });

  it('collapses to icons while keeping accessible names', async () => {
    const onCollapsedChange = vi.fn();
    render(<Example onCollapsedChange={onCollapsedChange} />);
    const toggle = screen.getByRole('button', { name: 'Collapse sidebar' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(toggle);
    expect(onCollapsedChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole('navigation')).toHaveAttribute('data-collapsed');
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('title', 'Dashboard');
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('toggles collapsible groups', async () => {
    render(<Example />);
    const header = screen.getByRole('button', { name: 'Admin' });
    expect(header).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(header);
    expect(header).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: 'Integrations' })).toBeNull();
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <Example />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

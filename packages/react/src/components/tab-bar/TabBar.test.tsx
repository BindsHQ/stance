import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { Icon } from '../../icons/Icon';
import { TabBar, TabBarItem } from './TabBar';

function Example() {
  return (
    <TabBar label="Main">
      <TabBarItem href="/" icon={<Icon name="home" />} active>
        Home
      </TabBarItem>
      <TabBarItem href="/templates" icon={<Icon name="file-text" />}>
        Templates
      </TabBarItem>
      <TabBarItem href="/inbox" icon={<Icon name="bell" />} badge={3} badgeLabel="3 unread">
        Inbox
      </TabBarItem>
      <TabBarItem asChild icon={<Icon name="settings" />}>
        <a href="/settings">Settings</a>
      </TabBarItem>
    </TabBar>
  );
}

describe('TabBar', () => {
  it('renders a navigation landmark of links with aria-current', () => {
    render(<Example />);
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Templates' })).not.toHaveAttribute('aria-current');
    expect(screen.queryByRole('tablist')).toBeNull();
  });

  it('announces badge descriptions and supports asChild', () => {
    render(<Example />);
    expect(screen.getByRole('link', { name: /Inbox.*3 unread/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveClass('st-tab-bar__item');
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

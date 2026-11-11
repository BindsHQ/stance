import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { Notification, NotificationCenter, NotificationList } from './Notification';

describe('Notification', () => {
  it('announces unread state and renders relative time', () => {
    render(
      <NotificationList>
        <Notification
          unread
          title="Ada approved your template"
          time={new Date(Date.now() - 5 * 60_000)}
        />
      </NotificationList>,
    );
    const item = screen.getByRole('listitem');
    expect(item).toHaveTextContent('Unread: Ada approved your template');
    expect(item.querySelector('time')).toHaveTextContent('5 minutes ago');
    expect(screen.getByRole('list', { name: 'Notifications' })).toBeInTheDocument();
  });

  it('marks as read', async () => {
    const onMarkRead = vi.fn();
    render(
      <NotificationList>
        <Notification unread title="Deploy finished" onMarkRead={onMarkRead} />
      </NotificationList>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Mark as read' }));
    expect(onMarkRead).toHaveBeenCalledOnce();
  });

  it('NotificationCenter shows count, mark-all and empty state', async () => {
    const onMarkAllRead = vi.fn();
    const { rerender } = render(
      <NotificationCenter unreadCount={2} onMarkAllRead={onMarkAllRead}>
        <Notification unread title="One" />
        <Notification unread title="Two" />
      </NotificationCenter>,
    );
    expect(screen.getByRole('region', { name: /Notifications/ })).toHaveTextContent('2 unread');
    expect(screen.getByRole('list', { name: /Notifications/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Mark all as read' }));
    expect(onMarkAllRead).toHaveBeenCalledOnce();
    rerender(<NotificationCenter />);
    expect(screen.getByText('You’re all caught up.')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <NotificationCenter unreadCount={1} onMarkAllRead={() => {}}>
        <Notification
          unread
          title="New sign-in"
          href="/security"
          description="Chrome on macOS"
          time="2 hours ago"
          onMarkRead={() => {}}
        />
        <Notification title="Invoice paid" time={new Date()} />
      </NotificationCenter>,
    );
    await expectNoA11yViolations(container);
  });
});

import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { VirtualizedList, type VirtualizedListHandle } from './VirtualizedList';

const users = Array.from({ length: 1000 }, (_, i) => ({ id: `u${i}`, name: `User ${i}` }));

describe('VirtualizedList', () => {
  it('renders only a window of items with set size and position', () => {
    render(
      <VirtualizedList
        aria-label="Organisation users"
        items={users}
        itemHeight={40}
        height={200}
        overscan={2}
        getItemKey={(u) => u.id}
        renderItem={(u) => u.name}
      />,
    );
    const list = screen.getByRole('list', { name: 'Organisation users' });
    const rendered = screen.getAllByRole('listitem');
    expect(rendered.length).toBeLessThan(20);
    expect(rendered[0]).toHaveAttribute('aria-setsize', '1000');
    expect(rendered[0]).toHaveAttribute('aria-posinset', '1');
    expect(list).toHaveAttribute('tabindex', '0');
  });

  it('scrollToIndex moves the window', () => {
    const api = React.createRef<VirtualizedListHandle>();
    render(
      <VirtualizedList
        aria-label="Users"
        items={users}
        itemHeight={40}
        height={200}
        renderItem={(u) => u.name}
        apiRef={api}
      />,
    );
    act(() => api.current!.scrollToIndex(500, 'start'));
    expect(screen.getByText('User 500')).toBeInTheDocument();
    expect(screen.queryByText('User 0')).toBeNull();
  });

  it('works as a keyboard listbox with aria-activedescendant', async () => {
    const onSelectionChange = vi.fn();
    render(
      <VirtualizedList
        role="listbox"
        aria-label="Pick a user"
        items={users}
        itemHeight={40}
        height={200}
        getItemKey={(u) => u.id}
        renderItem={(u) => u.name}
        onSelectionChange={onSelectionChange}
        isItemDisabled={(_u, i) => i === 1}
      />,
    );
    const user = userEvent.setup();
    await user.tab();
    const box = screen.getByRole('listbox');
    expect(box).toHaveFocus();
    expect(box.getAttribute('aria-activedescendant')).toMatch(/item-0$/);
    await user.keyboard('{ArrowDown}');
    // index 1 is disabled → skipped
    expect(box.getAttribute('aria-activedescendant')).toMatch(/item-2$/);
    await user.keyboard('{Enter}');
    expect(onSelectionChange).toHaveBeenCalledWith('u2', users[2]);
    expect(screen.getByRole('option', { name: 'User 2' })).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{End}');
    expect(box.getAttribute('aria-activedescendant')).toMatch(/item-999$/);
    expect(screen.getByText('User 999')).toBeInTheDocument();
    await user.keyboard('{Home}');
    expect(box.getAttribute('aria-activedescendant')).toMatch(/item-0$/);
    await user.keyboard('{PageDown}');
    expect(box.getAttribute('aria-activedescendant')).not.toMatch(/item-0$/);
  });

  it('supports controlled selection and click', async () => {
    function Controlled() {
      const [key, setKey] = React.useState<React.Key | null>('u3');
      return (
        <VirtualizedList
          role="listbox"
          aria-label="Users"
          items={users.slice(0, 10)}
          itemHeight={40}
          height={200}
          getItemKey={(u) => u.id}
          renderItem={(u) => u.name}
          selectedKey={key}
          onSelectionChange={setKey}
        />
      );
    }
    render(<Controlled />);
    expect(screen.getByRole('option', { name: 'User 3' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.click(screen.getByRole('option', { name: 'User 5' }));
    expect(screen.getByRole('option', { name: 'User 5' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: 'User 3' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('renders an empty state', () => {
    render(
      <VirtualizedList
        aria-label="Users"
        items={[]}
        renderItem={() => null}
        emptyState={<p>No users yet</p>}
      />,
    );
    expect(screen.getByText('No users yet')).toBeInTheDocument();
  });

  it('renders measured items with estimates', () => {
    render(
      <VirtualizedList
        aria-label="Variable"
        items={users.slice(0, 50)}
        estimatedItemHeight={30}
        height={150}
        renderItem={(u) => <p>{u.name}</p>}
      />,
    );
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0);
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <VirtualizedList
          aria-label="Users"
          items={users.slice(0, 30)}
          itemHeight={40}
          height={200}
          renderItem={(u) => u.name}
        />
        <VirtualizedList
          role="listbox"
          aria-label="Pick"
          items={users.slice(0, 30)}
          itemHeight={40}
          height={200}
          renderItem={(u) => u.name}
        />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { ConversationList, type ConversationListItem } from './ConversationList';

const now = new Date(2026, 10, 12, 15, 0, 0);
const at = (daysAgo: number) => new Date(2026, 10, 12 - daysAgo, 9, 0, 0);

const items: ConversationListItem[] = [
  { id: 'a', title: 'Contract summary', updatedAt: at(0) },
  { id: 'b', title: 'Quarterly plan', updatedAt: at(1) },
  { id: 'c', title: 'Launch notes', updatedAt: at(4), pinned: true },
  { id: 'd', title: 'Onboarding ideas', updatedAt: at(20) },
  { id: 'e', title: 'Old research', updatedAt: at(90) },
];

const headings = () =>
  Array.from(document.querySelectorAll('.st-conversation-list__heading')).map(
    (node) => node.textContent,
  );

describe('ConversationList', () => {
  it('is a navigation region grouped by date, pinned first', () => {
    render(<ConversationList items={items} now={now} />);
    expect(screen.getByRole('navigation', { name: 'Conversations' })).toBeInTheDocument();
    expect(headings()).toEqual(['Pinned', 'Today', 'Yesterday', 'Previous 30 days', 'Older']);
    const today = screen.getByRole('list', { name: 'Today' });
    expect(within(today).getByRole('button', { name: 'Contract summary' })).toBeInTheDocument();
    expect(
      within(screen.getByRole('list', { name: 'Pinned' })).getByRole('button', {
        name: 'Launch notes',
      }),
    ).toBeInTheDocument();
  });

  it('uses explicit groups and the previous 7 days bucket', () => {
    render(
      <ConversationList
        now={now}
        items={[
          { id: '1', title: 'One', updatedAt: at(3) },
          { id: '2', title: 'Two', updatedAt: at(0), group: 'Projects' },
          { id: '3', title: 'Three', updatedAt: at(50), group: 'Projects' },
        ]}
      />,
    );
    expect(headings()).toEqual(['Previous 7 days', 'Projects']);
    expect(
      within(screen.getByRole('list', { name: 'Projects' })).getAllByRole('listitem'),
    ).toHaveLength(2);
  });

  it('marks the open conversation with aria-current and reports selection', async () => {
    const onSelect = vi.fn();
    render(<ConversationList items={items} now={now} selectedId="b" onSelect={onSelect} />);
    expect(screen.getByRole('button', { name: 'Quarterly plan' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('button', { name: 'Contract summary' })).not.toHaveAttribute(
      'aria-current',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Contract summary' }));
    expect(onSelect).toHaveBeenCalledWith('a');
  });

  it('renders links when items have an href', () => {
    render(
      <ConversationList
        now={now}
        selectedId="a"
        items={[{ id: 'a', title: 'Contract summary', updatedAt: at(0), href: '/c/a' }]}
      />,
    );
    const link = screen.getByRole('link', { name: 'Contract summary' });
    expect(link).toHaveAttribute('href', '/c/a');
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('only shows row actions that have handlers, each naming its conversation', () => {
    const { rerender } = render(<ConversationList items={items.slice(0, 1)} now={now} />);
    expect(screen.getAllByRole('button')).toHaveLength(1);
    rerender(
      <ConversationList
        items={items.slice(0, 1)}
        now={now}
        onRename={() => {}}
        onDelete={() => {}}
        onPin={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: 'Pin Contract summary' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('button', { name: 'Rename Contract summary' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete Contract summary' })).toBeInTheDocument();
  });

  it('renames inline: Enter saves trimmed text and returns focus to the row', async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    function Harness() {
      const [list, setList] = React.useState(items);
      return (
        <ConversationList
          items={list}
          now={now}
          onRename={(id, title) => {
            onRename(id, title);
            setList((prev) => prev.map((i) => (i.id === id ? { ...i, title } : i)));
          }}
        />
      );
    }
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Rename Quarterly plan' }));
    const input = screen.getByRole('textbox', { name: 'Conversation title' }) as HTMLInputElement;
    expect(input).toHaveFocus();
    expect(input.value).toBe('Quarterly plan');
    expect(input.selectionEnd).toBe('Quarterly plan'.length);
    await user.keyboard('  Q4 plan {Enter}');
    expect(onRename).toHaveBeenCalledWith('b', 'Q4 plan');
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.getByRole('button', { name: 'Q4 plan' })).toHaveFocus();
  });

  it('cancels a rename with Escape, ignores empty or unchanged titles, and saves on blur', async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    render(
      <>
        <ConversationList items={items} now={now} onRename={onRename} />
        <button type="button">Elsewhere</button>
      </>,
    );
    const row = screen.getByRole('button', { name: 'Contract summary' });
    row.focus();
    await user.keyboard('{F2}');
    await user.keyboard('Changed{Escape}');
    expect(onRename).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Contract summary' })).toHaveFocus();

    await user.keyboard('{F2}');
    await user.keyboard('{Backspace}{Enter}');
    expect(onRename).not.toHaveBeenCalled();

    await user.keyboard('{F2}');
    await user.keyboard('{Enter}');
    expect(onRename).not.toHaveBeenCalled();

    await user.keyboard('{F2}');
    await user.keyboard('Saved on blur');
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }));
    expect(onRename).toHaveBeenCalledWith('a', 'Saved on blur');
    expect(screen.getByRole('button', { name: 'Elsewhere' })).toHaveFocus();
  });

  it('pins and unpins', async () => {
    const onPin = vi.fn();
    render(<ConversationList items={items} now={now} onPin={onPin} />);
    await userEvent.click(screen.getByRole('button', { name: 'Pin Contract summary' }));
    expect(onPin).toHaveBeenLastCalledWith('a', true);
    const unpin = screen.getByRole('button', { name: 'Unpin Launch notes' });
    expect(unpin).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(unpin);
    expect(onPin).toHaveBeenLastCalledWith('c', false);
  });

  it('deletes and moves focus to the neighbouring conversation', async () => {
    const onDelete = vi.fn();
    function Harness() {
      const [list, setList] = React.useState(items);
      return (
        <ConversationList
          items={list}
          now={now}
          onDelete={(id) => {
            onDelete(id);
            setList((prev) => prev.filter((i) => i.id !== id));
          }}
        />
      );
    }
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete Contract summary' }));
    expect(onDelete).toHaveBeenCalledWith('a');
    expect(screen.queryByRole('button', { name: 'Contract summary' })).toBeNull();
    // Rows are ordered Pinned, Today, Yesterday; the deleted row was second.
    expect(screen.getByRole('button', { name: 'Quarterly plan' })).toHaveFocus();
  });

  it('shows the default empty text or a custom empty state', () => {
    const { rerender } = render(<ConversationList items={[]} />);
    expect(screen.getByRole('navigation')).toHaveTextContent('No conversations yet');
    rerender(<ConversationList items={[]} emptyState={<p>Start your first chat</p>} />);
    expect(screen.getByText('Start your first chat')).toBeInTheDocument();
    expect(screen.queryByText('No conversations yet')).toBeNull();
  });

  it('accepts translated labels, forwards the ref and passes props through', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <ConversationList
        ref={ref}
        items={items.slice(0, 1)}
        now={now}
        onDelete={() => {}}
        className="custom"
        labels={{ list: 'Unterhaltungen', today: 'Heute', delete: (t) => `${t} löschen` }}
      />,
    );
    expect(ref.current).toBe(screen.getByRole('navigation', { name: 'Unterhaltungen' }));
    expect(ref.current).toHaveClass('st-conversation-list', 'custom');
    expect(headings()).toEqual(['Heute']);
    expect(screen.getByRole('button', { name: 'Contract summary löschen' })).toBeInTheDocument();
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <ConversationList
          items={items}
          now={now}
          selectedId="a"
          onRename={() => {}}
          onDelete={() => {}}
          onPin={() => {}}
        />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

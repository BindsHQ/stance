import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { ContextChips, type ContextItem } from './ContextChips';

const items: ContextItem[] = [
  { id: 'a', label: 'pricing.md', kind: 'file' },
  { id: 'b', label: 'Q3 forecast', kind: 'page' },
  { id: 'c', label: 'Selection, 12 lines', kind: 'selection' },
  { id: 'd', label: 'roadmap.pdf', kind: 'file' },
];

describe('ContextChips', () => {
  it('renders a labelled list of chips with their kind', () => {
    render(<ContextChips items={items} />);
    const list = screen.getByRole('list', { name: 'Context' });
    const chips = within(list).getAllByRole('listitem');
    expect(chips).toHaveLength(4);
    expect(chips[1]).toHaveTextContent('Q3 forecast');
    expect(chips[1]).toHaveAttribute('data-kind', 'page');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders nothing with no items and no add button', () => {
    const { container } = render(<ContextChips items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('names each remove button after its item and reports the id', async () => {
    const onRemove = vi.fn();
    render(<ContextChips items={items} onRemove={onRemove} />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove Q3 forecast' }));
    expect(onRemove).toHaveBeenCalledWith('b');
  });

  it('keeps focus in the list after a removal', async () => {
    const user = userEvent.setup();
    function Stateful() {
      const [list, setList] = React.useState(items.slice(0, 2));
      return (
        <ContextChips
          items={list}
          onRemove={(id) => setList((current) => current.filter((item) => item.id !== id))}
          onAdd={() => {}}
        />
      );
    }
    render(<Stateful />);
    screen.getByRole('button', { name: 'Remove Q3 forecast' }).focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Remove pricing.md' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Add context' })).toHaveFocus();
  });

  it('shows an add button that works with an empty list', async () => {
    const onAdd = vi.fn();
    render(<ContextChips items={[]} onAdd={onAdd} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add context' }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('collapses items beyond max behind a toggle that expands and collapses', async () => {
    const user = userEvent.setup();
    render(<ContextChips items={items} max={2} onRemove={() => {}} />);
    expect(screen.getAllByRole('button', { name: /^Remove/ })).toHaveLength(2);
    const more = screen.getByRole('button', { name: '+2 more' });
    expect(more).toHaveAttribute('aria-expanded', 'false');
    await user.click(more);
    expect(screen.getAllByRole('button', { name: /^Remove/ })).toHaveLength(4);
    const less = screen.getByRole('button', { name: 'Show less' });
    expect(less).toHaveAttribute('aria-expanded', 'true');
    expect(less).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getAllByRole('button', { name: /^Remove/ })).toHaveLength(2);
    expect(screen.getByRole('button', { name: '+2 more' })).toHaveFocus();
  });

  it('shows no toggle when everything fits', () => {
    render(<ContextChips items={items} max={4} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('uses custom labels', () => {
    render(
      <ContextChips
        items={items}
        max={1}
        onAdd={() => {}}
        onRemove={() => {}}
        labels={{
          list: 'Kontext',
          add: 'Kontext hinzufügen',
          more: (count) => `${count} weitere`,
          remove: (label) => `${label} entfernen`,
        }}
      />,
    );
    expect(screen.getByRole('list', { name: 'Kontext' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Kontext hinzufügen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3 weitere' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'pricing.md entfernen' })).toBeInTheDocument();
  });

  it('forwards ref, className and rest props', () => {
    const ref = React.createRef<HTMLUListElement>();
    render(<ContextChips ref={ref} items={items} className="mine" data-testid="chips" />);
    expect(ref.current).toBe(screen.getByTestId('chips'));
    expect(ref.current).toHaveClass('st-context-chips', 'mine');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <ContextChips items={items} max={2} onRemove={() => {}} onAdd={() => {}} />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

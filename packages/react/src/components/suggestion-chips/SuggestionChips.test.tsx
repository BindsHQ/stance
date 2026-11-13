import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { Icon } from '../../icons/Icon';
import { SuggestionChips, type SuggestionChipsItem } from './SuggestionChips';

const items: SuggestionChipsItem[] = [
  { id: 'shorter', label: 'Make it shorter' },
  { id: 'table', label: 'Show as a table', icon: <Icon name="list" /> },
  { id: 'next', label: 'What should I do next?' },
];

describe('SuggestionChips', () => {
  it('renders a named group with one button per item', () => {
    render(<SuggestionChips items={items} />);
    const group = screen.getByRole('group', { name: 'Suggestions' });
    expect(within(group).getAllByRole('listitem')).toHaveLength(3);
    expect(within(group).getByRole('button', { name: 'Show as a table' })).toBeEnabled();
  });

  it('calls onSelect with the chosen item, by pointer and keyboard', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<SuggestionChips items={items} onSelect={onSelect} />);
    await user.click(screen.getByRole('button', { name: 'Make it shorter' }));
    expect(onSelect).toHaveBeenLastCalledWith(items[0]);
    await user.tab();
    expect(screen.getByRole('button', { name: 'Show as a table' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenLastCalledWith(items[1]);
    await user.tab();
    await user.keyboard(' ');
    expect(onSelect).toHaveBeenLastCalledWith(items[2]);
    expect(onSelect).toHaveBeenCalledTimes(3);
  });

  it('shows placeholders and a status while loading', () => {
    const { container } = render(
      <SuggestionChips items={items} loading loadingLabel="Hämtar förslag" loadingCount={2} />,
    );
    expect(screen.getByRole('group')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Hämtar förslag');
    expect(screen.queryByRole('button')).toBeNull();
    expect(container.querySelectorAll('.st-suggestion-chips__placeholder')).toHaveLength(2);
  });

  it('renders nothing when there is nothing to offer', () => {
    const { container } = render(<SuggestionChips items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('marks wrap, size and disabled', async () => {
    const onSelect = vi.fn();
    const { rerender } = render(<SuggestionChips items={items} />);
    expect(screen.getByRole('group')).toHaveAttribute('data-wrap');
    expect(screen.getByRole('group')).toHaveAttribute('data-size', 'md');
    rerender(<SuggestionChips items={items} wrap={false} size="sm" disabled onSelect={onSelect} />);
    expect(screen.getByRole('group')).not.toHaveAttribute('data-wrap');
    expect(screen.getByRole('group')).toHaveAttribute('data-size', 'sm');
    await userEvent.click(screen.getByRole('button', { name: 'Make it shorter' }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('forwards the ref, className, label and props', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <SuggestionChips ref={ref} items={items} className="mine" id="next" label="Follow ups" />,
    );
    expect(ref.current).toHaveClass('st-suggestion-chips', 'mine');
    expect(ref.current).toHaveAttribute('id', 'next');
    expect(screen.getByRole('group', { name: 'Follow ups' })).toBe(ref.current);
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <SuggestionChips items={items} />
        <SuggestionChips items={items} loading label="More suggestions" />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

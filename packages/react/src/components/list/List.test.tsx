import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { ListItem } from '../list-item/ListItem';
import { List } from './List';

function Example({ onOpen = () => {} }: { onOpen?: () => void }) {
  return (
    <List aria-label="Signature templates" bordered>
      <ListItem title="Sales 2026" description="Used by 48 people" meta="Updated 2 days ago" />
      <ListItem
        asChild
        title="Executive"
        description="Used by 6 people"
        actions={<button type="button">Duplicate</button>}
      >
        <button type="button" onClick={onOpen} />
      </ListItem>
      <ListItem asChild title="Support" selected>
        <a href="#support" />
      </ListItem>
    </List>
  );
}

describe('List / ListItem', () => {
  it('renders a labelled semantic list', () => {
    render(<Example />);
    const list = screen.getByRole('list', { name: 'Signature templates' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('Updated 2 days ago')).toBeInTheDocument();
  });

  it('renders ordered lists', () => {
    render(
      <List ordered>
        <ListItem title="Upload CSV" />
      </List>,
    );
    expect(screen.getByRole('list').tagName).toBe('OL');
  });

  it('makes the main area a real button or link with asChild, keeping actions separate', async () => {
    const onOpen = vi.fn();
    render(<Example onOpen={onOpen} />);
    const open = screen.getByRole('button', { name: /Executive/ });
    open.focus();
    await userEvent.keyboard('{Enter}');
    expect(onOpen).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Duplicate' })).not.toBe(open);
    expect(screen.getByRole('link', { name: 'Support' }).closest('li')).toHaveAttribute(
      'aria-current',
      'true',
    );
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

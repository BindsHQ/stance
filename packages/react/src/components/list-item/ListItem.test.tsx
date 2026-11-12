import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { ListItem } from './ListItem';

describe('ListItem', () => {
  it('renders structured content inside a list item', () => {
    render(
      <ul>
        <ListItem
          leading={<span data-testid="avatar">AB</span>}
          title="Sales team"
          description="12 members"
          meta="2 days ago"
        />
      </ul>,
    );
    const li = screen.getByRole('listitem');
    expect(li).toHaveClass('st-list-item');
    const main = li.querySelector('.st-list-item__main')!;
    expect(main.tagName).toBe('DIV');
    expect(main).not.toHaveAttribute('data-interactive');
    expect(within(li).getByTestId('avatar').parentElement).toHaveClass('st-list-item__leading');
    expect(li.querySelector('.st-list-item__title')).toHaveTextContent('Sales team');
    expect(li.querySelector('.st-list-item__description')).toHaveTextContent('12 members');
    expect(li.querySelector('.st-list-item__meta')).toHaveTextContent('2 days ago');
  });

  it('renders plain children when no structured props are given', () => {
    render(
      <ul>
        <ListItem>Just text</ListItem>
      </ul>,
    );
    const li = screen.getByRole('listitem');
    expect(li).toHaveTextContent('Just text');
    expect(li.querySelector('.st-list-item__text')).toBeNull();
    expect(li.querySelector('.st-list-item__actions')).toBeNull();
  });

  it('omits the parts that are not provided', () => {
    render(
      <ul>
        <ListItem title="Only a title" />
      </ul>,
    );
    const li = screen.getByRole('listitem');
    expect(li.querySelector('.st-list-item__leading')).toBeNull();
    expect(li.querySelector('.st-list-item__description')).toBeNull();
    expect(li.querySelector('.st-list-item__meta')).toBeNull();
  });

  it('makes the main area interactive with asChild and keeps actions outside it', async () => {
    const onOpen = vi.fn();
    const onDelete = vi.fn();
    render(
      <ul>
        <ListItem
          asChild
          title="Onboarding"
          description="Updated today"
          actions={
            <button type="button" onClick={onDelete}>
              Delete
            </button>
          }
        >
          <a
            href="/templates/onboarding"
            onClick={(e) => {
              e.preventDefault();
              onOpen();
            }}
          />
        </ListItem>
      </ul>,
    );
    const link = screen.getByRole('link', { name: /Onboarding/ });
    expect(link).toHaveClass('st-list-item__main');
    expect(link).toHaveAttribute('data-interactive', '');
    expect(link).toHaveAttribute('href', '/templates/onboarding');
    expect(link).toHaveTextContent('Updated today');
    const remove = screen.getByRole('button', { name: 'Delete' });
    expect(link).not.toContainElement(remove);
    expect(remove.parentElement).toHaveClass('st-list-item__actions');
    const user = userEvent.setup();
    await user.click(link);
    expect(onOpen).toHaveBeenCalledTimes(1);
    await user.click(remove);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('keeps the child content when asChild is used without structured props', () => {
    render(
      <ul>
        <ListItem asChild>
          <button type="button">Open settings</button>
        </ListItem>
      </ul>,
    );
    const button = screen.getByRole('button', { name: 'Open settings' });
    expect(button).toHaveClass('st-list-item__main');
  });

  it('marks selected and disabled state', () => {
    const { rerender } = render(
      <ul>
        <ListItem title="Row" />
      </ul>,
    );
    const li = () => screen.getByRole('listitem');
    expect(li()).not.toHaveAttribute('aria-current');
    expect(li()).not.toHaveAttribute('data-selected');
    expect(li()).not.toHaveAttribute('data-disabled');
    rerender(
      <ul>
        <ListItem title="Row" selected disabled />
      </ul>,
    );
    expect(li()).toHaveAttribute('aria-current', 'true');
    expect(li()).toHaveAttribute('data-selected', '');
    expect(li()).toHaveAttribute('data-disabled', '');
  });

  it('forwards ref, className and native props', () => {
    const ref = React.createRef<HTMLLIElement>();
    render(
      <ul>
        <ListItem ref={ref} className="custom" id="row-1" title="Row" />
      </ul>,
    );
    expect(ref.current).toBe(screen.getByRole('listitem'));
    expect(ref.current).toHaveClass('st-list-item', 'custom');
    expect(ref.current).toHaveAttribute('id', 'row-1');
  });

  it.each(THEMES)('has no axe violations in the %s theme', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <ul>
          <ListItem title="Sales team" description="12 members" meta="Today" selected />
          <ListItem
            asChild
            title="Support"
            actions={<button type="button">More actions for Support</button>}
          >
            <a href="/support" />
          </ListItem>
          <ListItem>Plain row</ListItem>
        </ul>
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

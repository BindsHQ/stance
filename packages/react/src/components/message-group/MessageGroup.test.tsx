import { render, screen, within } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { Message } from '../message/Message';
import { MessageGroup } from './MessageGroup';

describe('MessageGroup', () => {
  it('is a group named by its author, shown once', () => {
    render(
      <MessageGroup author="Stance">
        <Message>One</Message>
        <Message>Two</Message>
        <Message>Three</Message>
      </MessageGroup>,
    );
    const group = screen.getByRole('group', { name: 'Stance' });
    expect(group).toHaveAttribute('data-role', 'assistant');
    expect(within(group).getAllByRole('article')).toHaveLength(3);
    const visible = within(group)
      .getAllByText('Stance')
      .filter((node) => !node.classList.contains('st-sr-only'));
    expect(visible).toHaveLength(1);
  });

  it('shows one avatar for the whole group', () => {
    render(
      <MessageGroup author="Priya Nair" role="user" avatar={<span data-testid="group-avatar" />}>
        <Message avatar={<span data-testid="own-avatar" />}>One</Message>
        <Message avatar={<span data-testid="own-avatar" />}>Two</Message>
      </MessageGroup>,
    );
    expect(screen.getAllByTestId('group-avatar')).toHaveLength(1);
    expect(screen.queryByTestId('own-avatar')).toBeNull();
    expect(screen.getByRole('group')).toHaveAttribute('data-role', 'user');
  });

  it('lets a message override the group role and author', () => {
    render(
      <MessageGroup author="Stance">
        <Message role="system" author="Notice">
          Model changed
        </Message>
      </MessageGroup>,
    );
    const article = screen.getByRole('article', { name: 'Notice' });
    expect(article).toHaveAttribute('data-role', 'system');
  });

  it('forwards the ref, className and other props', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<MessageGroup ref={ref} author="Stance" className="custom" data-testid="g" />);
    expect(ref.current).toBe(screen.getByTestId('g'));
    expect(ref.current).toHaveClass('st-message-group', 'custom');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <MessageGroup author="Stance" avatar={<span aria-hidden="true">S</span>}>
          <Message timestamp="10:42">One</Message>
          <Message status="streaming">Two</Message>
        </MessageGroup>
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

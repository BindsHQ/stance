import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { MessageGroup } from '../message-group/MessageGroup';
import { Message } from './Message';

const announcer = (article: HTMLElement) =>
  article.querySelector('[data-st-announcer]') as HTMLElement;

describe('Message', () => {
  it('is an article named by author and time', () => {
    render(
      <Message role="user" author="Priya Nair" timestamp="10:42" dateTime="2026-11-12T10:42:00Z">
        Summarise the contract.
      </Message>,
    );
    const article = screen.getByRole('article', { name: 'Priya Nair 10:42' });
    expect(article).toHaveAttribute('data-role', 'user');
    expect(article).toHaveAttribute('data-status', 'complete');
    expect(article).toHaveAttribute('data-variant', 'bubble');
    expect(article).not.toHaveAttribute('aria-busy');
    expect(article).toHaveTextContent('Summarise the contract.');
    expect(screen.getByText('10:42').tagName).toBe('TIME');
    expect(screen.getByText('10:42')).toHaveAttribute('datetime', '2026-11-12T10:42:00Z');
  });

  it('falls back to a default name for assistive technology only', () => {
    const { rerender } = render(<Message>Hello</Message>);
    expect(screen.getByRole('article', { name: 'Assistant' })).toBeInTheDocument();
    expect(screen.getByText('Assistant')).toHaveClass('st-sr-only');
    rerender(<Message role="user">Hello</Message>);
    expect(screen.getByRole('article', { name: 'You' })).toBeInTheDocument();
    rerender(
      <Message role="system" labels={{ system: 'Sistema' }}>
        Hello
      </Message>,
    );
    expect(screen.getByRole('article', { name: 'Sistema' })).toHaveAttribute('data-role', 'system');
  });

  it('is busy while submitted or streaming', () => {
    const { rerender } = render(<Message status="submitted" author="Stance" />);
    const article = screen.getByRole('article');
    expect(article).toHaveAttribute('aria-busy', 'true');
    expect(article.querySelector('.st-message__content')).toBeNull();
    rerender(
      <Message status="streaming" author="Stance">
        Partial
      </Message>,
    );
    expect(article).toHaveAttribute('aria-busy', 'true');
    expect(article).toHaveAttribute('data-status', 'streaming');
    rerender(
      <Message status="complete" author="Stance">
        Partial and the rest
      </Message>,
    );
    expect(article).not.toHaveAttribute('aria-busy');
  });

  it('announces each status change once and never the streamed text', () => {
    const { rerender } = render(<Message status="idle" author="Stance" />);
    const article = screen.getByRole('article');
    expect(announcer(article)).toBeEmptyDOMElement();
    rerender(<Message status="submitted" author="Stance" />);
    expect(announcer(article)).toHaveTextContent('Responding');
    const first = announcer(article).textContent;
    rerender(
      <Message status="streaming" author="Stance">
        One
      </Message>,
    );
    rerender(
      <Message status="streaming" author="Stance">
        One two three
      </Message>,
    );
    // Submitted to streaming and new tokens are not new announcements.
    expect(announcer(article).textContent).toBe(first);
    expect(announcer(article)).not.toHaveTextContent('One');
    rerender(
      <Message status="complete" author="Stance">
        One two three
      </Message>,
    );
    expect(announcer(article)).toHaveTextContent('Response complete');
  });

  it('does not announce for user messages or on first render', () => {
    const { rerender } = render(<Message role="user" status="streaming" />);
    const article = screen.getByRole('article');
    rerender(<Message role="user" status="complete" />);
    expect(announcer(article)).toBeEmptyDOMElement();
    rerender(<Message status="complete" />);
    expect(announcer(article)).toBeEmptyDOMElement();
  });

  it('shows stopped and error as text in a status that is already mounted', () => {
    const { rerender } = render(
      <Message status="streaming" author="Stance">
        Partial
      </Message>,
    );
    const article = screen.getByRole('article');
    const state = article.querySelector('.st-message__state') as HTMLElement;
    expect(state).toHaveAttribute('role', 'status');
    expect(state).toBeEmptyDOMElement();
    rerender(
      <Message status="stopped" author="Stance">
        Partial
      </Message>,
    );
    expect(article.querySelector('.st-message__state')).toBe(state);
    expect(state).toHaveTextContent('Response stopped');
    expect(state).toHaveAttribute('data-state', 'stopped');
    rerender(
      <Message status="error" author="Stance" labels={{ error: 'Could not finish' }}>
        Partial
      </Message>,
    );
    expect(state).toHaveTextContent('Could not finish');
    expect(article).toHaveAttribute('data-status', 'error');
    // The visible line is the announcement, so the hidden announcer stays silent.
    expect(announcer(article)).toBeEmptyDOMElement();
  });

  it('renders the avatar, actions and footer slots, the variant, and passes props through', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Message
        ref={ref}
        author="Stance"
        variant="plain"
        avatar={<span data-testid="avatar" />}
        actions={<button type="button">Copy</button>}
        footer={<span>3 sources</span>}
        className="custom"
        id="m1"
      >
        Body
      </Message>,
    );
    const article = screen.getByRole('article', { name: 'Stance' });
    expect(ref.current).toBe(article);
    expect(article).toHaveClass('st-message', 'custom');
    expect(article).toHaveAttribute('id', 'm1');
    expect(article).toHaveAttribute('data-variant', 'plain');
    expect(screen.getByTestId('avatar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
    expect(screen.getByText('3 sources')).toBeInTheDocument();
  });

  it('takes role and author from a MessageGroup and drops its own avatar and visible name', () => {
    render(
      <MessageGroup role="user" author="Priya Nair">
        <Message avatar={<span data-testid="avatar" />} timestamp="10:42">
          First
        </Message>
        <Message>Second</Message>
      </MessageGroup>,
    );
    const [first, second] = screen.getAllByRole('article');
    expect(first).toHaveAccessibleName('Priya Nair 10:42');
    expect(second).toHaveAccessibleName('Priya Nair');
    expect(first).toHaveAttribute('data-role', 'user');
    expect(first).toHaveAttribute('data-grouped');
    expect(screen.queryByTestId('avatar')).toBeNull();
    expect(first!.querySelector('.st-message__author')).toHaveClass('st-sr-only');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <Message role="user" author="Priya Nair" timestamp="10:42">
          Question
        </Message>
        <Message author="Stance" status="streaming">
          Partial answer
        </Message>
        <Message status="error">Half an answer</Message>
        <Message role="system">Conversation started</Message>
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

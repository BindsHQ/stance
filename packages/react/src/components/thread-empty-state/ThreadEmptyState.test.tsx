import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { ThreadEmptyState, type ThreadStarter } from './ThreadEmptyState';

const starters: ThreadStarter[] = [
  { id: 'summary', label: 'Summarise a contract', description: 'Key terms and dates' },
  { id: 'draft', label: 'Draft a reply', icon: <svg data-testid="starter-icon" /> },
];

describe('ThreadEmptyState', () => {
  it('renders the greeting as a heading with a description and a decorative sparkle', () => {
    const { container } = render(
      <ThreadEmptyState title="How can I help?" description="Ask about any document." />,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'How can I help?' })).toBeVisible();
    expect(screen.getByText('Ask about any document.')).toBeInTheDocument();
    const icon = container.querySelector('.st-thread-empty-state__icon');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon?.querySelector('[data-icon="sparkle"]')).not.toBeNull();
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('accepts a custom icon, no icon, and a heading level', () => {
    const { container, rerender } = render(
      <ThreadEmptyState title="Hello" icon={<svg data-testid="custom" />} level={1} />,
    );
    expect(screen.getByTestId('custom')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hello');
    rerender(<ThreadEmptyState title="Hello" icon={null} />);
    expect(container.querySelector('.st-thread-empty-state__icon')).toBeNull();
  });

  it('lists starters as buttons and reports the one that was chosen', async () => {
    const onStarterSelect = vi.fn();
    render(
      <ThreadEmptyState title="Hello" starters={starters} onStarterSelect={onStarterSelect} />,
    );
    const list = screen.getByRole('list', { name: 'Suggested prompts' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    const first = within(list).getByRole('button', { name: /Summarise a contract/ });
    expect(first).toHaveTextContent('Key terms and dates');
    expect(screen.getByTestId('starter-icon').parentElement).toHaveAttribute('aria-hidden', 'true');
    await userEvent.click(first);
    expect(onStarterSelect).toHaveBeenCalledWith(starters[0]);
  });

  it('starters work from the keyboard', async () => {
    const onStarterSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <ThreadEmptyState
        title="Hello"
        starters={starters}
        onStarterSelect={onStarterSelect}
        startersLabel="Ideas"
      />,
    );
    expect(screen.getByRole('list', { name: 'Ideas' })).toBeInTheDocument();
    await user.tab();
    await user.tab();
    await user.keyboard('{Enter}');
    expect(onStarterSelect).toHaveBeenCalledWith(starters[1]);
  });

  it('renders children, forwards the ref and passes props through', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <ThreadEmptyState ref={ref} title="Hello" className="custom" data-testid="e">
        <p>Extra</p>
      </ThreadEmptyState>,
    );
    expect(ref.current).toBe(screen.getByTestId('e'));
    expect(ref.current).toHaveClass('st-thread-empty-state', 'custom');
    expect(screen.getByText('Extra')).toBeInTheDocument();
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <ThreadEmptyState title="Hello" description="Ask anything." starters={starters} />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

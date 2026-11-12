import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { ConfidenceBadge, type ConfidenceLevel } from './ConfidenceBadge';

const levels: [ConfidenceLevel, string, string][] = [
  ['high', 'High confidence', 'check-circle'],
  ['medium', 'Medium confidence', 'circle'],
  ['low', 'Low confidence', 'alert-triangle'],
  ['unknown', 'Confidence unknown', 'help-circle'],
];

describe('ConfidenceBadge', () => {
  it.each(levels)('states %s in words with its own icon shape', (level, text, icon) => {
    const { container } = render(<ConfidenceBadge level={level} />);
    expect(screen.getByText(text)).toBeInTheDocument();
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveAttribute('data-icon', icon);
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(container.firstElementChild).toHaveAttribute('data-level', level);
  });

  it('uses a different icon for every level', () => {
    expect(new Set(levels.map((l) => l[2])).size).toBe(levels.length);
  });

  it('accepts a label override, translated labels and can hide the icon', () => {
    const { container, rerender } = render(
      <ConfidenceBadge level="high" label="Checked against 3 sources" showIcon={false} />,
    );
    expect(screen.getByText('Checked against 3 sources')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeNull();
    rerender(<ConfidenceBadge level="low" labels={{ low: 'Nizka zanesljivost' }} />);
    expect(screen.getByText('Nizka zanesljivost')).toBeInTheDocument();
  });

  it('is not focusable without a description', async () => {
    render(<ConfidenceBadge level="medium" />);
    await userEvent.tab();
    expect(document.body).toHaveFocus();
  });

  it('reveals the description on keyboard focus and links it to the badge', async () => {
    const user = userEvent.setup();
    render(<ConfidenceBadge level="low" description="Only one source mentions this figure." />);
    await user.tab();
    const badge = screen.getByText('Low confidence').parentElement!;
    expect(badge).toHaveFocus();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Only one source mentions this figure.');
    expect(badge).toHaveAccessibleDescription('Only one source mentions this figure.');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('passes size, className, rest props and the ref', () => {
    const ref = React.createRef<HTMLSpanElement>();
    render(
      <ConfidenceBadge ref={ref} level="high" size="sm" className="custom" data-testid="badge" />,
    );
    const badge = screen.getByTestId('badge');
    expect(ref.current).toBe(badge);
    expect(badge).toHaveClass('st-confidence-badge', 'custom');
    expect(badge).toHaveAttribute('data-size', 'sm');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        {levels.map(([level]) => (
          <ConfidenceBadge key={level} level={level} />
        ))}
        <ConfidenceBadge level="low" size="sm" description="Only one source mentions this." />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

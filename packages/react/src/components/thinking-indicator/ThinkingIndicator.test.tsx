import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { ThinkingIndicator } from './ThinkingIndicator';

describe('ThinkingIndicator', () => {
  it('is a status with the default label', () => {
    render(<ThinkingIndicator />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Thinking');
    expect(status).toHaveAttribute('data-variant', 'dots');
    expect(status.querySelectorAll('.st-thinking-indicator__dot')).toHaveLength(3);
    expect(status.querySelector('.st-thinking-indicator__mark')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('takes a custom label', () => {
    render(<ThinkingIndicator label="Searching the web" />);
    expect(screen.getByRole('status')).toHaveTextContent('Searching the web');
  });

  it('shows elapsed time without exposing it to assistive technology', () => {
    const { rerender } = render(<ThinkingIndicator elapsed={8} />);
    const elapsed = screen.getByText('8s');
    expect(elapsed).toHaveAttribute('aria-hidden', 'true');
    rerender(<ThinkingIndicator elapsed={65} />);
    expect(screen.getByText('1m 05s')).toBeInTheDocument();
    rerender(<ThinkingIndicator elapsed={65} formatElapsed={(s) => `${s} sekunder`} />);
    expect(screen.getByText('65 sekunder')).toBeInTheDocument();
  });

  it('omits elapsed time when it is not given', () => {
    const { container } = render(<ThinkingIndicator />);
    expect(container.querySelector('.st-thinking-indicator__elapsed')).toBeNull();
  });

  it('uses a sparkle for the pulse variant and a light sweep for shimmer', () => {
    const { rerender, container } = render(<ThinkingIndicator variant="pulse" />);
    expect(container.querySelector('[data-icon="sparkle"]')).not.toBeNull();
    expect(container.querySelector('.st-thinking-indicator__dot')).toBeNull();
    rerender(<ThinkingIndicator variant="shimmer" label="Drafting" />);
    expect(screen.getByText('Drafting')).toHaveClass('st-shimmer-text');
    expect(screen.getByText('Drafting')).toHaveAttribute('data-active', '');
  });

  it('keeps a visually hidden label for assistive technology', () => {
    render(<ThinkingIndicator hideLabel variant="shimmer" />);
    expect(screen.getByText('Thinking')).toHaveClass('st-sr-only');
    expect(screen.getByRole('status')).toHaveTextContent('Thinking');
  });

  it('forwards the ref, className, size and other props', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<ThinkingIndicator ref={ref} className="mine" size="sm" id="busy" />);
    expect(ref.current).toHaveClass('st-thinking-indicator', 'mine');
    expect(ref.current).toHaveAttribute('data-size', 'sm');
    expect(ref.current).toHaveAttribute('id', 'busy');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <ThinkingIndicator />
        <ThinkingIndicator variant="pulse" elapsed={12} />
        <ThinkingIndicator variant="shimmer" label="Searching" />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

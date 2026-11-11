import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Inline } from './Inline';

describe('Inline', () => {
  it('wraps by default and centres items', () => {
    render(
      <Inline data-testid="i" gap={3}>
        <span>a</span>
      </Inline>,
    );
    const el = screen.getByTestId('i');
    expect(el).toHaveAttribute('data-wrap');
    expect(el).toHaveAttribute('data-align', 'center');
    expect(el.style.getPropertyValue('--st-stack-gap')).toBe('var(--st-space-3)');
  });
  it('can disable wrapping', () => {
    render(<Inline data-testid="i" wrap={false} />);
    expect(screen.getByTestId('i')).not.toHaveAttribute('data-wrap');
  });
});

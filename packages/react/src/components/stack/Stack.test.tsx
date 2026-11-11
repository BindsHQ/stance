import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Stack } from './Stack';

describe('Stack', () => {
  it('maps gap to a space token and exposes layout attributes', () => {
    render(
      <Stack
        data-testid="s"
        gap={1.5}
        align="center"
        justify="between"
        direction="row"
        wrap
        rowFrom="md"
      >
        <span>a</span>
      </Stack>,
    );
    const s = screen.getByTestId('s');
    expect(s.style.getPropertyValue('--st-stack-gap')).toBe('var(--st-space-1-5)');
    expect(s).toHaveAttribute('data-direction', 'row');
    expect(s).toHaveAttribute('data-justify', 'between');
    expect(s).toHaveAttribute('data-row-from', 'md');
  });
  it('renders semantic elements via as', () => {
    render(
      <Stack as="ul">
        <li>Template</li>
      </Stack>,
    );
    expect(screen.getByRole('list')).toHaveClass('st-stack');
  });
});

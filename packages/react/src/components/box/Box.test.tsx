import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Box } from './Box';

describe('Box', () => {
  it('renders a div by default with token-driven attributes', () => {
    render(
      <Box
        data-testid="b"
        padding={4}
        paddingX={6}
        background="surface"
        border
        radius="lg"
        shadow="sm"
      />,
    );
    const box = screen.getByTestId('b');
    expect(box.tagName).toBe('DIV');
    expect(box).toHaveAttribute('data-background', 'surface');
    expect(box).toHaveAttribute('data-border', 'default');
    expect(box.style.paddingLeft).toBe('var(--st-space-6)');
    expect(box.style.paddingTop).toBe('var(--st-space-4)');
  });
  it('supports the as prop and refs', () => {
    const ref = { current: null as HTMLElement | null };
    render(<Box as="section" ref={ref} aria-label="Usage" />);
    expect(screen.getByRole('region', { name: 'Usage' })).toBe(ref.current);
  });
});

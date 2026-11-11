import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Container } from './Container';

describe('Container', () => {
  it('renders with a size and semantic element', () => {
    render(
      <Container as="main" size="md" flush>
        content
      </Container>,
    );
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('data-size', 'md');
    expect(main).toHaveAttribute('data-flush');
  });
  it('defaults to lg', () => {
    render(<Container data-testid="c" />);
    expect(screen.getByTestId('c')).toHaveAttribute('data-size', 'lg');
  });
});

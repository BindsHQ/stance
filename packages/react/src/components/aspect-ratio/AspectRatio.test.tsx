import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AspectRatio } from './AspectRatio';

describe('AspectRatio', () => {
  it('applies the ratio', () => {
    render(<AspectRatio data-testid="a" ratio={4 / 3} />);
    expect(screen.getByTestId('a').style.aspectRatio).toMatch(/^1\.333/);
  });
  it('defaults to 16/9', () => {
    render(<AspectRatio data-testid="a" />);
    expect(screen.getByTestId('a').style.aspectRatio).toMatch(/^1\.777/);
  });
});

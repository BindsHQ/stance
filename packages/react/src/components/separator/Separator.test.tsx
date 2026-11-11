import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Separator } from './Separator';

describe('Separator', () => {
  it('is decorative by default', () => {
    render(<Separator data-testid="s" />);
    expect(screen.getByTestId('s')).toHaveAttribute('role', 'none');
    expect(screen.queryByRole('separator')).toBeNull();
  });
  it('exposes role and orientation when semantic', () => {
    render(<Separator decorative={false} orientation="vertical" />);
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical');
  });
});

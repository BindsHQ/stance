import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Grid } from './Grid';

describe('Grid', () => {
  it('sets fixed columns', () => {
    render(<Grid data-testid="g" columns={3} gap={6} />);
    const g = screen.getByTestId('g');
    expect(g).toHaveAttribute('data-columns', '3');
    expect(g.style.getPropertyValue('--st-grid-columns')).toBe('3');
    expect(g.style.getPropertyValue('--st-grid-gap')).toBe('var(--st-space-6)');
  });
  it('prefers fluid tracks when minChildWidth is set', () => {
    render(<Grid data-testid="g" columns={3} minChildWidth="12rem" />);
    const g = screen.getByTestId('g');
    expect(g).toHaveAttribute('data-fluid');
    expect(g).not.toHaveAttribute('data-columns');
    expect(g.style.getPropertyValue('--st-grid-min')).toBe('12rem');
  });
});

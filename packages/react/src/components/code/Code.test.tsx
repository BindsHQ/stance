import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Code } from './Code';

describe('Code', () => {
  it('renders inline code with variant', () => {
    render(<Code variant="plain">template_id</Code>);
    const el = screen.getByText('template_id');
    expect(el.tagName).toBe('CODE');
    expect(el).toHaveAttribute('data-variant', 'plain');
  });
});

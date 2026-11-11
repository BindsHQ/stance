import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Caption } from './Caption';

describe('Caption', () => {
  it('renders muted by default and supports figcaption', () => {
    render(
      <figure>
        <Caption as="figcaption">Signature preview</Caption>
      </figure>,
    );
    const cap = screen.getByText('Signature preview');
    expect(cap.tagName).toBe('FIGCAPTION');
    expect(cap).toHaveAttribute('data-tone', 'muted');
  });
});

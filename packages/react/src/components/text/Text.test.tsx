import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Text } from './Text';

describe('Text', () => {
  it('renders a paragraph with tone and size', () => {
    render(
      <Text size="sm" tone="muted" weight="medium">
        Last edited 2 hours ago
      </Text>,
    );
    const p = screen.getByText('Last edited 2 hours ago');
    expect(p.tagName).toBe('P');
    expect(p).toHaveAttribute('data-tone', 'muted');
    expect(p).toHaveAttribute('data-size', 'sm');
  });
  it('truncates or clamps', () => {
    render(
      <>
        <Text truncate>one</Text>
        <Text truncate={2}>two</Text>
      </>,
    );
    expect(screen.getByText('one')).toHaveAttribute('data-truncate');
    expect(screen.getByText('two').style.getPropertyValue('--st-text-clamp')).toBe('2');
  });
  it('renders inline with as="span"', () => {
    render(
      <Text as="span" eyebrow>
        New
      </Text>,
    );
    expect(screen.getByText('New').tagName).toBe('SPAN');
  });
});

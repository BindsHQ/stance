import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { ShimmerText } from './ShimmerText';

describe('ShimmerText', () => {
  it('renders plain text that assistive technology can read', () => {
    render(<ShimmerText>Searching the web</ShimmerText>);
    const el = screen.getByText('Searching the web');
    expect(el.tagName).toBe('SPAN');
    expect(el).not.toHaveAttribute('aria-hidden');
    expect(el).not.toHaveAttribute('role');
  });

  it('is active by default and can be switched off', () => {
    const { rerender } = render(<ShimmerText>Reading 3 files</ShimmerText>);
    expect(screen.getByText('Reading 3 files')).toHaveAttribute('data-active', '');
    rerender(<ShimmerText active={false}>Reading 3 files</ShimmerText>);
    expect(screen.getByText('Reading 3 files')).not.toHaveAttribute('data-active');
  });

  it('renders the chosen element, forwards the ref and passes props through', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <ShimmerText ref={ref} as="p" className="mine" id="label">
        Drafting
      </ShimmerText>,
    );
    expect(ref.current?.tagName).toBe('P');
    expect(ref.current).toHaveClass('st-shimmer-text', 'mine');
    expect(ref.current).toHaveAttribute('id', 'label');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <ShimmerText>Searching the web</ShimmerText>
        <ShimmerText active={false}>Searched the web</ShimmerText>
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

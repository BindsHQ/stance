import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Spacer } from './Spacer';

describe('Spacer', () => {
  it('is hidden from assistive technology', () => {
    const { container } = render(<Spacer />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
    expect(container.firstChild).toHaveAttribute('data-flexible');
  });
  it('renders a fixed vertical or horizontal size', () => {
    const { container } = render(
      <>
        <Spacer size={8} />
        <Spacer size={2} axis="horizontal" />
      </>,
    );
    const [v, h] = Array.from(container.children) as HTMLElement[];
    expect(v!.style.height).toBe('var(--st-space-8)');
    expect(h!.style.width).toBe('var(--st-space-2)');
  });
});

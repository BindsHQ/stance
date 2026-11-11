import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('is hidden from assistive technology', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
    expect(container.firstChild).toHaveAttribute('data-variant', 'text');
  });

  it('renders multiple lines with a shorter last line', () => {
    const { container } = render(<Skeleton lines={3} />);
    const lines = container.querySelectorAll('.st-skeleton');
    expect(lines).toHaveLength(3);
    expect((lines[2] as HTMLElement).style.width).toBe('62%');
  });

  it('sizes circles and rects', () => {
    const { container } = render(
      <>
        <Skeleton variant="circle" width={48} />
        <Skeleton variant="rect" width="50%" height={120} static />
      </>,
    );
    const [circle, rect] = Array.from(container.querySelectorAll<HTMLElement>('.st-skeleton'));
    expect(circle!.style.width).toBe('48px');
    expect(circle!.style.height).toBe('48px');
    expect(rect!.style.height).toBe('120px');
    expect(rect).toHaveAttribute('data-static');
  });

  it('has no axe violations inside a busy region', async () => {
    const { container } = render(
      <section aria-busy="true" aria-label="Templates">
        <span className="st-sr-only" role="status">
          Loading templates…
        </span>
        <Skeleton variant="circle" />
        <Skeleton lines={2} />
      </section>,
    );
    await expectNoA11yViolations(container);
  });
});

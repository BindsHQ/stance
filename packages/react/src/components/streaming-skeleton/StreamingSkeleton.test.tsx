import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { StreamingSkeleton } from './StreamingSkeleton';

const bars = (root: HTMLElement) => root.querySelectorAll('.st-skeleton');

describe('StreamingSkeleton', () => {
  it('is a status that reads its label and shows three lines by default', () => {
    render(<StreamingSkeleton />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Loading response');
    expect(status).toHaveAttribute('data-variant', 'text');
    expect(bars(status)).toHaveLength(3);
  });

  it('renders the requested number of lines, never fewer than one', () => {
    const { rerender } = render(<StreamingSkeleton lines={5} />);
    expect(bars(screen.getByRole('status'))).toHaveLength(5);
    rerender(<StreamingSkeleton lines={1} />);
    expect(bars(screen.getByRole('status'))).toHaveLength(1);
    rerender(<StreamingSkeleton lines={0} />);
    expect(bars(screen.getByRole('status'))).toHaveLength(1);
  });

  it('hides every placeholder shape from assistive technology', () => {
    render(<StreamingSkeleton variant="card" lines={2} />);
    const status = screen.getByRole('status');
    for (const bar of bars(status)) expect(bar.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('adds an avatar and title row for cards', () => {
    render(<StreamingSkeleton variant="card" lines={2} />);
    const status = screen.getByRole('status');
    expect(status.querySelector('[data-variant="circle"]')).not.toBeNull();
    expect(bars(status)).toHaveLength(4);
  });

  it('shows a single media block for images', () => {
    render(<StreamingSkeleton variant="image" label="Creating image" />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Creating image');
    expect(bars(status)).toHaveLength(1);
    expect(status.querySelector('[data-variant="rect"]')).not.toBeNull();
  });

  it('can be static, and forwards ref, className and props', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<StreamingSkeleton ref={ref} static className="mine" id="pending" />);
    expect(ref.current).toHaveClass('st-streaming-skeleton', 'mine');
    expect(ref.current).toHaveAttribute('id', 'pending');
    for (const bar of bars(ref.current!)) expect(bar).toHaveAttribute('data-static', '');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <StreamingSkeleton />
        <StreamingSkeleton variant="card" />
        <StreamingSkeleton variant="image" />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

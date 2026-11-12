import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('is a status region labelled "Loading" by default', () => {
    render(<Spinner />);
    const spinner = screen.getByRole('status', { name: 'Loading' });
    expect(spinner).toHaveClass('st-spinner');
    expect(spinner).toHaveAttribute('data-size', 'md');
    expect(spinner).not.toHaveAttribute('aria-hidden');
  });

  it('accepts a custom label and size', () => {
    render(<Spinner label="Saving template" size="lg" />);
    expect(screen.getByRole('status', { name: 'Saving template' })).toHaveAttribute(
      'data-size',
      'lg',
    );
  });

  it('is hidden from assistive technology when the label is null', () => {
    const { container } = render(<Spinner label={null} />);
    expect(screen.queryByRole('status')).toBeNull();
    const spinner = container.querySelector('.st-spinner')!;
    expect(spinner).toHaveAttribute('aria-hidden', 'true');
    expect(spinner).not.toHaveAttribute('aria-label');
  });

  it('keeps the graphic decorative', () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
  });

  it('forwards ref, className and other props', () => {
    const ref = React.createRef<HTMLSpanElement>();
    render(<Spinner ref={ref} className="custom" data-testid="spin" id="s1" />);
    const spinner = screen.getByTestId('spin');
    expect(ref.current).toBe(spinner);
    expect(spinner).toHaveClass('st-spinner', 'custom');
    expect(spinner).toHaveAttribute('id', 's1');
  });

  it.each(THEMES)('has no axe violations in the %s theme', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <Spinner />
        <Spinner label="Saving" size="xs" />
        <Spinner label={null} />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

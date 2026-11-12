import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { TokenBudgetMeter } from './TokenBudgetMeter';

describe('TokenBudgetMeter', () => {
  it('is a labelled meter with value text', () => {
    render(<TokenBudgetMeter used={1200} limit={8000} />);
    const meter = screen.getByRole('meter', { name: 'Context used' });
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '8000');
    expect(meter).toHaveAttribute('aria-valuenow', '1200');
    expect(meter).toHaveAttribute('aria-valuetext', '1,200 of 8,000 tokens');
    expect(meter.parentElement).toHaveAttribute('data-state', 'ok');
    expect(meter.parentElement).toHaveAttribute('data-variant', 'ring');
  });

  it('draws the ring in proportion to usage', () => {
    const { container, rerender } = render(<TokenBudgetMeter used={0} limit={100} />);
    const fill = () => container.querySelector('.st-token-budget-meter__fill')!;
    const full = Number(fill().getAttribute('stroke-dasharray'));
    expect(Number(fill().getAttribute('stroke-dashoffset'))).toBeCloseTo(full);
    rerender(<TokenBudgetMeter used={50} limit={100} />);
    expect(Number(fill().getAttribute('stroke-dashoffset'))).toBeCloseTo(full / 2);
    rerender(<TokenBudgetMeter used={250} limit={100} />);
    expect(Number(fill().getAttribute('stroke-dashoffset'))).toBeCloseTo(0);
  });

  it('states the warning in words at the threshold, not by colour alone', () => {
    render(<TokenBudgetMeter used={6400} limit={8000} variant="bar" />);
    const meter = screen.getByRole('meter');
    expect(meter.parentElement).toHaveAttribute('data-state', 'warning');
    expect(meter).toHaveAttribute('aria-valuetext', '6,400 of 8,000 tokens. Close to the limit');
    expect(screen.getByText('Close to the limit')).toBeInTheDocument();
    expect(meter.querySelector('[data-icon="alert-triangle"]')).not.toBeNull();
  });

  it('shows a warning icon beside the ring', () => {
    render(<TokenBudgetMeter used={7900} limit={8000} />);
    const meter = screen.getByRole('meter');
    expect(meter.querySelector('[data-icon="alert-triangle"]')).not.toBeNull();
    expect(meter.querySelector('.st-token-budget-meter__note')).toHaveAttribute(
      'title',
      'Close to the limit',
    );
  });

  it('reports the over state and clamps the meter value to the limit', () => {
    render(<TokenBudgetMeter used={9000} limit={8000} variant="text" />);
    const meter = screen.getByRole('meter');
    expect(meter.parentElement).toHaveAttribute('data-state', 'over');
    expect(meter).toHaveAttribute('aria-valuenow', '8000');
    expect(meter).toHaveAttribute('aria-valuetext', '9,000 of 8,000 tokens. Over the limit');
    expect(screen.getByText('9,000 of 8,000 tokens')).toBeInTheDocument();
    expect(screen.getByText('Over the limit')).toBeInTheDocument();
  });

  it('honours warnAt and a custom format', () => {
    render(
      <TokenBudgetMeter
        used={50}
        limit={100}
        warnAt={0.5}
        variant="text"
        format={(used, limit) => `${Math.round((used / limit) * 100)}% used`}
      />,
    );
    expect(screen.getByRole('meter')).toHaveAttribute(
      'aria-valuetext',
      '50% used. Close to the limit',
    );
    expect(screen.getByText('50% used')).toBeInTheDocument();
  });

  it('announces crossing the threshold once, and again only after dropping below', () => {
    const { rerender } = render(<TokenBudgetMeter used={1000} limit={8000} />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('');
    rerender(<TokenBudgetMeter used={6500} limit={8000} />);
    expect(status).toHaveTextContent('Close to the limit. 6,500 of 8,000 tokens');
    const first = status.textContent;
    rerender(<TokenBudgetMeter used={6900} limit={8000} />);
    rerender(<TokenBudgetMeter used={7400} limit={8000} />);
    expect(status.textContent).toBe(first);
    rerender(<TokenBudgetMeter used={8200} limit={8000} />);
    expect(status).toHaveTextContent('Over the limit. 8,200 of 8,000 tokens');
    const over = status.textContent;
    rerender(<TokenBudgetMeter used={7000} limit={8000} />);
    expect(status.textContent).toBe(over);
    rerender(<TokenBudgetMeter used={100} limit={8000} />);
    rerender(<TokenBudgetMeter used={6600} limit={8000} />);
    expect(status).toHaveTextContent('Close to the limit. 6,600 of 8,000 tokens');
    expect(status.textContent).not.toBe(first);
  });

  it('does not announce when it first renders already in the warning', () => {
    render(<TokenBudgetMeter used={7900} limit={8000} />);
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('shows the value beside the ring on request and always in bar and text variants', () => {
    const { rerender } = render(<TokenBudgetMeter used={10} limit={100} />);
    expect(screen.queryByText('10 of 100 tokens')).toBeNull();
    rerender(<TokenBudgetMeter used={10} limit={100} showValue />);
    expect(screen.getByText('10 of 100 tokens')).toBeInTheDocument();
    rerender(<TokenBudgetMeter used={10} limit={100} variant="bar" />);
    expect(screen.getByText('10 of 100 tokens')).toBeInTheDocument();
  });

  it('survives a zero limit and bad numbers', () => {
    render(<TokenBudgetMeter used={Number.NaN} limit={0} />);
    const meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('aria-valuenow', '0');
    expect(meter.parentElement).toHaveAttribute('data-state', 'ok');
  });

  it('uses custom labels and passes ref, className and rest props to the root', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <TokenBudgetMeter
        ref={ref}
        used={95}
        limit={100}
        variant="bar"
        label="Message length"
        labels={{ warning: 'Fast voll' }}
        className="mine"
        data-testid="meter"
      />,
    );
    expect(ref.current).toBe(screen.getByTestId('meter'));
    expect(ref.current).toHaveClass('st-token-budget-meter', 'mine');
    expect(screen.getByRole('meter', { name: 'Message length' })).toBeInTheDocument();
    expect(screen.getByText('Fast voll')).toBeInTheDocument();
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <TokenBudgetMeter used={1200} limit={8000} />
        <TokenBudgetMeter used={7000} limit={8000} variant="bar" label="Message length" />
        <TokenBudgetMeter used={9000} limit={8000} variant="text" label="Reply length" />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

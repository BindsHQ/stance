import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { InterruptedState } from './InterruptedState';

describe('InterruptedState', () => {
  it('is a polite status for a stopped response', () => {
    render(<InterruptedState />);
    expect(screen.getByRole('status')).toHaveTextContent('Response stopped');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it.each([
    ['error', 'alert', 'Something went wrong'],
    ['network', 'alert', 'Connection lost'],
    ['limit', 'status', 'Response limit reached'],
    ['stopped', 'status', 'Response stopped'],
  ] as const)('uses the right role and title for %s', (reason, role, title) => {
    const { container } = render(<InterruptedState reason={reason} />);
    expect(screen.getByRole(role)).toHaveTextContent(title);
    expect(container.firstElementChild).toHaveAttribute('data-reason', reason);
  });

  it('shows a custom title and description inside the live message', () => {
    render(
      <InterruptedState
        reason="error"
        title="The answer could not be finished"
        description="Nothing was lost. Try again in a moment."
      />,
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('The answer could not be finished');
    expect(alert).toHaveTextContent('Nothing was lost. Try again in a moment.');
  });

  it('keeps the buttons outside the live message', () => {
    render(<InterruptedState reason="error" onRetry={() => {}} />);
    expect(screen.getByRole('alert')).not.toContainElement(
      screen.getByRole('button', { name: 'Try again' }),
    );
  });

  it('offers retry and continue from mouse and keyboard', async () => {
    const onRetry = vi.fn();
    const onContinue = vi.fn();
    const user = userEvent.setup();
    render(<InterruptedState onRetry={onRetry} onContinue={onContinue} />);
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Continue' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('uses translated labels and renders extra actions', () => {
    render(
      <InterruptedState
        reason="limit"
        onRetry={() => {}}
        onContinue={() => {}}
        labels={{ limit: 'Gränsen nådd', retry: 'Försök igen', continue: 'Fortsätt' }}
      >
        <a href="#plans">See plans</a>
      </InterruptedState>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Gränsen nådd');
    expect(screen.getByRole('button', { name: 'Försök igen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fortsätt' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See plans' })).toBeInTheDocument();
  });

  it('forwards the ref, className and props', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<InterruptedState ref={ref} className="mine" id="halt" />);
    expect(ref.current).toHaveClass('st-interrupted-state', 'mine');
    expect(ref.current).toHaveAttribute('id', 'halt');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <InterruptedState onRetry={() => {}} onContinue={() => {}} />
        <InterruptedState reason="error" description="Try again." onRetry={() => {}} />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { StopButton } from './StopButton';

describe('StopButton', () => {
  it('renders a button with a visible Stop label by default', () => {
    render(<StopButton />);
    const button = screen.getByRole('button', { name: 'Stop' });
    expect(button).toHaveTextContent('Stop');
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveAttribute('data-variant', 'secondary');
    expect(button).toHaveAttribute('data-size', 'sm');
    expect(button).toHaveClass('st-stop-button');
  });

  it('calls onStop on click, Enter and Space', async () => {
    const onStop = vi.fn();
    const user = userEvent.setup();
    render(<StopButton onStop={onStop} />);
    await user.click(screen.getByRole('button', { name: 'Stop' }));
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onStop).toHaveBeenCalledTimes(3);
  });

  it('keeps the label as the accessible name when icon only', () => {
    render(<StopButton iconOnly label="Stop generating" pill />);
    const button = screen.getByRole('button', { name: 'Stop generating' });
    expect(button).not.toHaveTextContent('Stop generating');
    expect(button).toHaveAttribute('data-shape', 'circle');
    expect(button.querySelector('[data-icon="stop"]')).not.toBeNull();
  });

  it('passes size, variant, className and rest props through', () => {
    render(<StopButton size="lg" variant="outline" className="mine" data-testid="stop" pill />);
    const button = screen.getByTestId('stop');
    expect(button).toHaveAttribute('data-size', 'lg');
    expect(button).toHaveAttribute('data-variant', 'outline');
    expect(button).toHaveAttribute('data-shape', 'pill');
    expect(button).toHaveClass('mine');
  });

  it('runs onClick first and skips onStop when it prevents default', async () => {
    const onStop = vi.fn();
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault());
    render(<StopButton onStop={onStop} onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onStop).not.toHaveBeenCalled();
  });

  it('does not fire when disabled', async () => {
    const onStop = vi.fn();
    render(<StopButton onStop={onStop} disabled />);
    await userEvent.click(screen.getByRole('button'));
    expect(onStop).not.toHaveBeenCalled();
  });

  it('forwards its ref to the button', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<StopButton ref={ref} iconOnly />);
    expect(ref.current).toBe(screen.getByRole('button'));
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <StopButton />
        <StopButton iconOnly label="Stop response" />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

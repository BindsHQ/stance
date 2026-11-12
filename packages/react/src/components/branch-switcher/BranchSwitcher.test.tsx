import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { BranchSwitcher } from './BranchSwitcher';

describe('BranchSwitcher', () => {
  it('shows the position in a polite live text between labelled buttons', () => {
    render(<BranchSwitcher count={3} index={1} />);
    expect(screen.getByRole('group', { name: 'Message versions' })).toBeInTheDocument();
    const position = screen.getByText('2 of 3');
    expect(position).toHaveAttribute('aria-live', 'polite');
    expect(position).toHaveAttribute('aria-atomic', 'true');
    expect(screen.getByRole('button', { name: 'Previous version' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Next version' })).toBeEnabled();
  });

  it('starts on the last version when uncontrolled and steps both ways', async () => {
    const onIndexChange = vi.fn();
    render(<BranchSwitcher count={3} onIndexChange={onIndexChange} />);
    expect(screen.getByText('3 of 3')).toBeInTheDocument();
    const previous = screen.getByRole('button', { name: 'Previous version' });
    const next = screen.getByRole('button', { name: 'Next version' });
    expect(next).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(next);
    expect(onIndexChange).not.toHaveBeenCalled();
    await userEvent.click(previous);
    expect(onIndexChange).toHaveBeenLastCalledWith(1);
    expect(screen.getByText('2 of 3')).toBeInTheDocument();
    await userEvent.click(previous);
    expect(screen.getByText('1 of 3')).toBeInTheDocument();
    expect(previous).toHaveAttribute('aria-disabled', 'true');
    // Focus stays on the button that reached the end.
    expect(previous).toHaveFocus();
    await userEvent.click(previous);
    expect(onIndexChange).toHaveBeenCalledTimes(2);
    await userEvent.keyboard('{Tab}{Enter}');
    expect(onIndexChange).toHaveBeenLastCalledWith(1);
  });

  it('is controlled by index', async () => {
    const onIndexChange = vi.fn();
    const { rerender } = render(
      <BranchSwitcher count={4} index={0} onIndexChange={onIndexChange} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Next version' }));
    expect(onIndexChange).toHaveBeenCalledWith(1);
    expect(screen.getByText('1 of 4')).toBeInTheDocument();
    rerender(<BranchSwitcher count={4} index={1} onIndexChange={onIndexChange} />);
    expect(screen.getByText('2 of 4')).toBeInTheDocument();
    // An index past the end is clamped rather than shown as 9 of 4.
    rerender(<BranchSwitcher count={4} index={8} onIndexChange={onIndexChange} />);
    expect(screen.getByText('4 of 4')).toBeInTheDocument();
  });

  it('respects defaultIndex, disabled and translated labels', async () => {
    const onIndexChange = vi.fn();
    render(
      <BranchSwitcher
        count={5}
        defaultIndex={2}
        disabled
        onIndexChange={onIndexChange}
        labels={{
          group: 'Versionen',
          previous: 'Vorherige',
          next: 'Nächste',
          position: (index, count) => `${index + 1} von ${count}`,
        }}
      />,
    );
    expect(screen.getByRole('group', { name: 'Versionen' })).toHaveAttribute('data-disabled');
    expect(screen.getByText('3 von 5')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Vorherige' }));
    await userEvent.click(screen.getByRole('button', { name: 'Nächste' }));
    expect(onIndexChange).not.toHaveBeenCalled();
  });

  it('renders nothing when there is only one version', () => {
    const { container } = render(<BranchSwitcher count={1} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('forwards the ref, className and other props', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<BranchSwitcher ref={ref} count={2} className="custom" data-testid="b" />);
    expect(ref.current).toBe(screen.getByTestId('b'));
    expect(ref.current).toHaveClass('st-branch-switcher', 'custom');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <BranchSwitcher count={3} index={0} />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

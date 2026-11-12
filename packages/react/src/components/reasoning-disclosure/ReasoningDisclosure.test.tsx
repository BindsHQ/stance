import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { ReasoningDisclosure } from './ReasoningDisclosure';

const announcer = (container: HTMLElement) => container.querySelector('[data-st-announcer]')!;

describe('ReasoningDisclosure', () => {
  it('is open while thinking, with a disclosure button', () => {
    render(<ReasoningDisclosure status="thinking">Comparing both clauses.</ReasoningDisclosure>);
    const trigger = screen.getByRole('button', { name: 'Thinking' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Comparing both clauses.')).toBeVisible();
    expect(document.getElementById(trigger.getAttribute('aria-controls')!)).toContainElement(
      screen.getByText('Comparing both clauses.'),
    );
  });

  it('is collapsed when done and summarises the duration', async () => {
    render(
      <ReasoningDisclosure status="done" duration={12}>
        Comparing both clauses.
      </ReasoningDisclosure>,
    );
    const trigger = screen.getByRole('button', { name: 'Thought for 12 seconds' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Comparing both clauses.')).toBeNull();
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Comparing both clauses.')).toBeVisible();
  });

  it('words the summary for one second, minutes and an unknown duration', () => {
    const { rerender } = render(<ReasoningDisclosure duration={1} />);
    expect(screen.getByRole('button')).toHaveTextContent('Thought for 1 second');
    rerender(<ReasoningDisclosure duration={135} />);
    expect(screen.getByRole('button')).toHaveTextContent('Thought for 2 minutes 15 seconds');
    rerender(<ReasoningDisclosure duration={60} />);
    expect(screen.getByRole('button')).toHaveTextContent('Thought for 1 minute');
    rerender(<ReasoningDisclosure />);
    expect(screen.getByRole('button')).toHaveTextContent('Reasoning');
  });

  it('collapses and announces the summary once when reasoning ends', () => {
    const onOpenChange = vi.fn();
    const { rerender, container } = render(
      <ReasoningDisclosure status="thinking" onOpenChange={onOpenChange}>
        Steps
      </ReasoningDisclosure>,
    );
    expect(announcer(container)).toBeEmptyDOMElement();
    rerender(
      <ReasoningDisclosure status="done" duration={7} onOpenChange={onOpenChange}>
        Steps
      </ReasoningDisclosure>,
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(announcer(container)).toHaveTextContent('Thought for 7 seconds');
  });

  it('keeps the choice of a reader who toggled it while thinking', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ReasoningDisclosure status="thinking">Steps</ReasoningDisclosure>);
    await user.click(screen.getByRole('button'));
    await user.click(screen.getByRole('button'));
    rerender(
      <ReasoningDisclosure status="done" duration={3}>
        Steps
      </ReasoningDisclosure>,
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  });

  it('toggles with the keyboard', async () => {
    const user = userEvent.setup();
    render(<ReasoningDisclosure duration={4}>Steps</ReasoningDisclosure>);
    await user.tab();
    expect(screen.getByRole('button')).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByText('Steps')).toBeVisible();
    await user.keyboard(' ');
    expect(screen.queryByText('Steps')).toBeNull();
  });

  it('supports controlled open state', async () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <ReasoningDisclosure open={false} onOpenChange={onOpenChange} status="thinking">
        Steps
      </ReasoningDisclosure>,
    );
    expect(screen.queryByText('Steps')).toBeNull();
    await userEvent.click(screen.getByRole('button'));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByText('Steps')).toBeNull();
    rerender(
      <ReasoningDisclosure open onOpenChange={onOpenChange} status="thinking">
        Steps
      </ReasoningDisclosure>,
    );
    expect(screen.getByText('Steps')).toBeVisible();
  });

  it('honours defaultOpen and translated labels', () => {
    render(
      <ReasoningDisclosure
        defaultOpen
        duration={9}
        labels={{ thought: (s) => `Tänkte i ${s} sekunder` }}
      >
        Steps
      </ReasoningDisclosure>,
    );
    expect(screen.getByRole('button', { name: 'Tänkte i 9 sekunder' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('forwards the ref, className and props', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<ReasoningDisclosure ref={ref} className="mine" id="why" status="thinking" />);
    expect(ref.current).toHaveClass('st-reasoning-disclosure', 'mine');
    expect(ref.current).toHaveAttribute('id', 'why');
    expect(ref.current).toHaveAttribute('data-status', 'thinking');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <ReasoningDisclosure status="thinking">Working through it.</ReasoningDisclosure>
        <ReasoningDisclosure duration={12}>Worked through it.</ReasoningDisclosure>
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { AgentStatusPill, type AgentStatus } from './AgentStatusPill';

const polite = (c: HTMLElement) => c.querySelector('[data-st-announcer][aria-live="polite"]')!;
const assertive = (c: HTMLElement) =>
  c.querySelector('[data-st-announcer][aria-live="assertive"]')!;
const pill = (c: HTMLElement) => c.querySelector('.st-agent-status-pill')!;

describe('AgentStatusPill', () => {
  it.each<[AgentStatus, string]>([
    ['idle', 'Idle'],
    ['working', 'Working'],
    ['waiting', 'Waiting for you'],
    ['done', 'Done'],
    ['error', 'Failed'],
    ['paused', 'Paused'],
  ])('says %s in words', (status, words) => {
    const { container } = render(<AgentStatusPill status={status} />);
    expect(pill(container)).toHaveTextContent(words);
    expect(pill(container)).toHaveAttribute('data-status', status);
    expect(pill(container)).toHaveAttribute('role', 'status');
  });

  it('shows a custom label and detail', () => {
    const { container } = render(
      <AgentStatusPill status="working" label="Researching" detail="Step 3 of 5" size="sm" />,
    );
    expect(pill(container)).toHaveTextContent('ResearchingStep 3 of 5');
    expect(pill(container)).toHaveAttribute('data-size', 'sm');
  });

  it('is a button when pressable', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(<AgentStatusPill status="waiting" onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Waiting for you' });
    await user.click(button);
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onPress).toHaveBeenCalledTimes(3);
  });

  it('announces nothing on mount, changes politely, and waiting assertively', () => {
    const { container, rerender } = render(<AgentStatusPill status="waiting" />);
    expect(polite(container)).toBeEmptyDOMElement();
    expect(assertive(container)).toBeEmptyDOMElement();
    rerender(<AgentStatusPill status="working" detail="Step 2 of 4" />);
    expect(polite(container)).toHaveTextContent('Working, Step 2 of 4');
    expect(assertive(container)).toBeEmptyDOMElement();
    rerender(<AgentStatusPill status="waiting" />);
    expect(assertive(container)).toHaveTextContent('Waiting for you');
    rerender(<AgentStatusPill status="done" />);
    expect(polite(container)).toHaveTextContent('Done');
  });

  it('does not announce again when only the detail changes', () => {
    const { container, rerender } = render(<AgentStatusPill status="working" detail="Step 1" />);
    rerender(<AgentStatusPill status="working" detail="Step 2" />);
    expect(polite(container)).toBeEmptyDOMElement();
  });

  it('uses translated labels', () => {
    const { container } = render(<AgentStatusPill status="done" labels={{ done: 'Klar' }} />);
    expect(pill(container)).toHaveTextContent('Klar');
  });

  it('forwards the ref, className and props', () => {
    const ref = React.createRef<HTMLElement>();
    const { rerender } = render(
      <AgentStatusPill ref={ref} className="mine" id="agent" status="idle" />,
    );
    expect(ref.current).toHaveClass('st-agent-status-pill', 'mine');
    expect(ref.current).toHaveAttribute('id', 'agent');
    expect(ref.current!.tagName).toBe('SPAN');
    rerender(<AgentStatusPill ref={ref} status="idle" onPress={() => {}} />);
    expect(ref.current!.tagName).toBe('BUTTON');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <AgentStatusPill status="working" detail="Step 3 of 5" />
        <AgentStatusPill status="waiting" onPress={() => {}} />
        <AgentStatusPill status="paused" size="sm" />
        <AgentStatusPill status="error" />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

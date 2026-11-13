import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { ToolCallCard } from './ToolCallCard';

const announcer = (container: HTMLElement) => container.querySelector('[data-st-announcer]')!;

describe('ToolCallCard', () => {
  it('is a closed disclosure named by title and status', () => {
    render(
      <ToolCallCard name="web_search" title="Search the web" input='{"q":"stance"}' output="ok" />,
    );
    const trigger = screen.getByRole('button', { name: /^Search the web.*Complete/ });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('web_search')).toBeVisible();
    expect(screen.getByText('Complete')).toBeVisible();
    expect(screen.queryByText('Input')).toBeNull();
  });

  it('opens to show input, output and error', async () => {
    render(
      <ToolCallCard
        name="read_file"
        status="error"
        input='{"path":"a.txt"}'
        output={<p>Partial</p>}
        error="File not found"
        duration={0.42}
      />,
    );
    const trigger = screen.getByRole('button', { name: /^read_file.*Failed/ });
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Input')).toBeVisible();
    expect(screen.getByText('Output')).toBeVisible();
    expect(screen.getByText('Partial')).toBeVisible();
    expect(screen.getByText('File not found')).toBeVisible();
    expect(screen.getByText('0.4 s')).toBeVisible();
    expect(screen.getByRole('region', { name: 'read_file: Input' })).toHaveTextContent('a.txt');
  });

  it('toggles with the keyboard', async () => {
    const user = userEvent.setup();
    render(<ToolCallCard name="run" output={<p>Done</p>} />);
    await user.tab();
    expect(screen.getByRole('button')).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByText('Done')).toBeVisible();
    await user.keyboard(' ');
    expect(screen.queryByText('Done')).toBeNull();
  });

  it('supports controlled and default open state', async () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <ToolCallCard name="run" output={<p>Done</p>} open={false} onOpenChange={onOpenChange} />,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByText('Done')).toBeNull();
    rerender(<ToolCallCard name="run" output={<p>Done</p>} open onOpenChange={onOpenChange} />);
    expect(screen.getByText('Done')).toBeVisible();
    rerender(<ToolCallCard key="2" name="run" output={<p>Other</p>} defaultOpen />);
    expect(screen.getByText('Other')).toBeVisible();
  });

  it('is a plain group without a button when there is nothing to show', () => {
    render(<ToolCallCard name="ping" status="running" />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('group', { name: 'ping, running' })).toBeVisible();
  });

  it('announces a status change once and nothing on mount', () => {
    const { container, rerender } = render(
      <ToolCallCard name="run" title="Run tests" status="running" />,
    );
    expect(announcer(container)).toBeEmptyDOMElement();
    rerender(<ToolCallCard name="run" title="Run tests" status="complete" />);
    expect(announcer(container)).toHaveTextContent('Run tests, complete');
  });

  it('keeps actions outside the disclosure button', async () => {
    const onRetry = vi.fn();
    render(
      <ToolCallCard name="run" output="x" actions={<button onClick={onRetry}>Retry</button>} />,
    );
    const retry = screen.getByRole('button', { name: 'Retry' });
    expect(screen.getByRole('button', { name: /^run.*Complete/ })).not.toContainElement(retry);
    await userEvent.click(retry);
    expect(onRetry).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /^run.*Complete/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('uses translated labels', async () => {
    render(
      <ToolCallCard
        name="run"
        title="Kör"
        status="waiting"
        input={<p>x</p>}
        defaultOpen
        labels={{
          status: { waiting: 'Väntar' },
          input: 'Indata',
          name: (t, s) => `${t}: ${s}`,
        }}
      />,
    );
    expect(screen.getByRole('button', { name: /^Kör.*Väntar/ })).toBeVisible();
    expect(screen.getByText('Indata')).toBeVisible();
  });

  it('forwards the ref, className and props', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<ToolCallCard ref={ref} className="mine" id="call" name="run" status="pending" />);
    expect(ref.current).toHaveClass('st-tool-call-card', 'mine');
    expect(ref.current).toHaveAttribute('id', 'call');
    expect(ref.current).toHaveAttribute('data-status', 'pending');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <ToolCallCard name="web_search" title="Search the web" input='{"q":"a"}' defaultOpen />
        <ToolCallCard name="run" status="running" />
        <ToolCallCard name="read" status="error" error="Missing" duration={3} />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

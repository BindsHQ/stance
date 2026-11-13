import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { ApprovalPrompt } from './ApprovalPrompt';

afterEach(() => vi.useRealTimers());

describe('ApprovalPrompt', () => {
  it('is an alertdialog named by the title and described by the effect', () => {
    render(
      <ApprovalPrompt
        title="Send the email"
        description="240 customers will receive it."
        risk="medium"
        details={<code>send --all</code>}
      />,
    );
    const dialog = screen.getByRole('alertdialog', { name: 'Send the email' });
    expect(dialog).toHaveAccessibleDescription('240 customers will receive it.');
    expect(dialog).toHaveAttribute('data-risk', 'medium');
    expect(screen.getByText('Medium risk')).toBeVisible();
    expect(screen.getByText('send --all')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Always allow' })).toBeNull();
  });

  it('puts deny first and calls the handlers', async () => {
    const onAllow = vi.fn();
    const onAllowAlways = vi.fn();
    const onDeny = vi.fn();
    render(
      <ApprovalPrompt
        title="Run tests"
        onAllow={onAllow}
        onAllowAlways={onAllowAlways}
        onDeny={onDeny}
      />,
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((b) => b.textContent)).toEqual(['Deny', 'Always allow', 'Allow']);
    await userEvent.click(buttons[2]!);
    await userEvent.click(buttons[1]!);
    await userEvent.click(buttons[0]!);
    expect(onAllow).toHaveBeenCalledTimes(1);
    expect(onAllowAlways).toHaveBeenCalledTimes(1);
    expect(onDeny).toHaveBeenCalledWith('deny');
  });

  it('does not take focus unless asked, then focuses deny', () => {
    const { unmount } = render(<ApprovalPrompt title="Run tests" />);
    expect(document.body).toHaveFocus();
    unmount();
    render(<ApprovalPrompt title="Run tests" autoFocus />);
    expect(screen.getByRole('button', { name: 'Deny' })).toHaveFocus();
  });

  it('denies with Escape', async () => {
    const user = userEvent.setup();
    const onDeny = vi.fn();
    const onAllow = vi.fn();
    render(<ApprovalPrompt title="Run tests" autoFocus onDeny={onDeny} onAllow={onAllow} />);
    await user.keyboard('{Escape}');
    expect(onDeny).toHaveBeenCalledWith('escape');
    expect(onAllow).not.toHaveBeenCalled();
  });

  it('allows with Enter for low risk but never for high risk', async () => {
    const user = userEvent.setup();
    const onAllow = vi.fn();
    const onAllowAlways = vi.fn();
    const { rerender } = render(<ApprovalPrompt title="Run tests" onAllow={onAllow} />);
    screen.getByRole('button', { name: 'Allow' }).focus();
    await user.keyboard('{Enter}');
    expect(onAllow).toHaveBeenCalledTimes(1);

    rerender(
      <ApprovalPrompt
        title="Delete the database"
        risk="high"
        onAllow={onAllow}
        onAllowAlways={onAllowAlways}
      />,
    );
    const allow = screen.getByRole('button', { name: 'Allow' });
    expect(allow).toHaveAccessibleDescription(/Enter does not allow/);
    allow.focus();
    await user.keyboard('{Enter}');
    expect(onAllow).toHaveBeenCalledTimes(1);
    screen.getByRole('button', { name: 'Always allow' }).focus();
    await user.keyboard('{Enter}');
    expect(onAllowAlways).not.toHaveBeenCalled();
    allow.focus();
    await user.keyboard(' ');
    expect(onAllow).toHaveBeenCalledTimes(2);
    await user.click(allow);
    expect(onAllow).toHaveBeenCalledTimes(3);
  });

  it('disables the decisions while busy and ignores Escape', async () => {
    const onDeny = vi.fn();
    render(<ApprovalPrompt title="Run tests" busy onDeny={onDeny} />);
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: 'Deny' })).toBeDisabled();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onDeny).not.toHaveBeenCalled();
  });

  it('counts down and only ever denies', () => {
    vi.useFakeTimers();
    const onDeny = vi.fn();
    const onAllow = vi.fn();
    render(<ApprovalPrompt title="Run tests" countdown={3} onDeny={onDeny} onAllow={onAllow} />);
    expect(screen.getByText('Denies automatically in 3 seconds')).toBeVisible();
    expect(screen.getByRole('alertdialog')).toHaveAccessibleDescription(
      'Denies automatically in 3 seconds',
    );
    act(() => void vi.advanceTimersByTime(2000));
    expect(screen.getByText('Denies automatically in 1 second')).toBeVisible();
    expect(onDeny).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(1000));
    expect(onDeny).toHaveBeenCalledTimes(1);
    expect(onDeny).toHaveBeenCalledWith('timeout');
    act(() => void vi.advanceTimersByTime(5000));
    expect(onDeny).toHaveBeenCalledTimes(1);
    expect(onAllow).not.toHaveBeenCalled();
  });

  it('stops the countdown with Keep waiting and while busy', () => {
    vi.useFakeTimers();
    const onDeny = vi.fn();
    const { rerender } = render(
      <ApprovalPrompt title="Run tests" countdown={5} busy onDeny={onDeny} />,
    );
    act(() => void vi.advanceTimersByTime(10000));
    expect(screen.getByText('Denies automatically in 5 seconds')).toBeVisible();
    rerender(<ApprovalPrompt title="Run tests" countdown={5} onDeny={onDeny} />);
    act(() => void vi.advanceTimersByTime(1000));
    fireEvent.click(screen.getByRole('button', { name: 'Keep waiting' }));
    expect(screen.queryByText(/Denies automatically/)).toBeNull();
    act(() => void vi.advanceTimersByTime(10000));
    expect(onDeny).not.toHaveBeenCalled();
  });

  it('announces once when ten seconds remain', () => {
    vi.useFakeTimers();
    const { container } = render(<ApprovalPrompt title="Run tests" countdown={12} />);
    const region = container.querySelector('[data-st-announcer]')!;
    expect(region).toBeEmptyDOMElement();
    act(() => void vi.advanceTimersByTime(2000));
    expect(region).toHaveTextContent('Denies automatically in 10 seconds');
  });

  it('uses translated labels', () => {
    render(
      <ApprovalPrompt
        title="Kör"
        risk="high"
        onAllowAlways={() => {}}
        labels={{ allow: 'Tillåt', deny: 'Neka', risk: { high: 'Hög risk' } }}
      />,
    );
    expect(screen.getByRole('button', { name: 'Tillåt' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Neka' })).toBeVisible();
    expect(screen.getByText('Hög risk')).toBeVisible();
  });

  it('forwards the ref, className and props', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<ApprovalPrompt ref={ref} className="mine" id="ask" title="Run" />);
    expect(ref.current).toHaveClass('st-approval-prompt', 'mine');
    expect(ref.current).toHaveAttribute('id', 'ask');
    expect(ref.current).toHaveAttribute('data-risk', 'low');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <ApprovalPrompt title="Run tests" description="Runs npm test." onAllowAlways={() => {}} />
        <ApprovalPrompt title="Delete rows" risk="high" countdown={30} details={<p>12 rows</p>} />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

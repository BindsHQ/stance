import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { CopyButton } from './CopyButton';

describe('CopyButton', () => {
  it('copies the value, announces success and resets', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onCopy = vi.fn();
    render(<CopyButton value="npm install @bindshq/stance-react" onCopy={onCopy} />);
    await user.click(screen.getByRole('button', { name: 'Copy' }));
    expect(await navigator.clipboard.readText()).toBe('npm install @bindshq/stance-react');
    expect(onCopy).toHaveBeenCalledWith(true);
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Copied');
    act(() => vi.advanceTimersByTime(2100));
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
    vi.useRealTimers();
  });
  it('resolves function values at click time and shows labels', async () => {
    const user = userEvent.setup();
    render(<CopyButton value={() => 'ORG-42'} showLabel label="Copy ID" />);
    await user.click(screen.getByRole('button', { name: 'Copy ID' }));
    expect(await navigator.clipboard.readText()).toBe('ORG-42');
  });
  it('activates with the keyboard', async () => {
    const user = userEvent.setup();
    render(<CopyButton value="x" />);
    await user.tab();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
  });
  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <CopyButton value="a" />
        <CopyButton value="b" showLabel />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { CopyableCode } from './CopyableCode';

describe('CopyableCode', () => {
  it('shows the value and copies it without the prompt', async () => {
    const user = userEvent.setup();
    render(<CopyableCode value="npm install @bindshq/stance-tokens" prompt="$" />);
    expect(screen.getByText(/npm install @bindshq\/stance-tokens/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Copy to clipboard' }));
    expect(await navigator.clipboard.readText()).toBe('npm install @bindshq/stance-tokens');
  });
  it('has no axe violations', async () => {
    const { container } = render(<CopyableCode value="sk_live_xxx" />);
    await expectNoA11yViolations(container);
  });
});

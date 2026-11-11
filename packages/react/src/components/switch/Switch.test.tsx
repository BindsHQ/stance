import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { FormField } from '../form-field/FormField';
import { Switch } from './Switch';

describe('Switch', () => {
  it('toggles with click, Space and Enter', async () => {
    const onChange = vi.fn();
    render(<Switch label="Deploy automatically" onCheckedChange={onChange} />);
    const sw = screen.getByRole('switch', { name: 'Deploy automatically' });
    expect(sw).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'true');
    await userEvent.keyboard(' ');
    await userEvent.keyboard('{Enter}');
    expect(onChange.mock.calls.map((c) => c[0])).toEqual([true, false, true]);
  });

  it('toggles when the label is clicked', async () => {
    render(<Switch label="Dark sidebar" />);
    await userEvent.click(screen.getByText('Dark sidebar'));
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('is controlled and respects readOnly/disabled', async () => {
    const { rerender } = render(<Switch aria-label="X" checked onCheckedChange={() => {}} />);
    await userEvent.click(screen.getByRole('switch'));
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    rerender(<Switch aria-label="X" defaultChecked readOnly />);
    await userEvent.click(screen.getByRole('switch'));
    expect(screen.getByRole('switch')).toHaveAttribute('aria-readonly', 'true');
    rerender(<Switch aria-label="Y" disabled />);
    expect(screen.getByRole('switch', { name: 'Y' })).toBeDisabled();
  });

  it('submits through a hidden input when named', async () => {
    const { container } = render(<Switch aria-label="Enabled" name="enabled" />);
    const hidden = container.querySelector('input[type="hidden"]') as HTMLInputElement;
    expect(hidden).toBeDisabled();
    await userEvent.click(screen.getByRole('switch'));
    expect(hidden).not.toBeDisabled();
    expect(hidden.value).toBe('on');
  });

  it('integrates with FormField', () => {
    render(
      <FormField label="Two-factor authentication" description="Required for admins">
        <Switch />
      </FormField>,
    );
    const sw = screen.getByRole('switch', { name: 'Two-factor authentication' });
    expect(sw).toHaveAccessibleDescription('Required for admins');
  });

  it.each(THEMES)('axe clean in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <Switch label="On" defaultChecked description="Detail" />
        <Switch label="Off" size="sm" disabled />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

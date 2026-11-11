import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { Radio, RadioGroup } from './RadioGroup';

function Example(props: Partial<React.ComponentProps<typeof RadioGroup>>) {
  return (
    <RadioGroup label="Signing order" {...props}>
      <Radio value="any" label="Any order" description="Signers can sign in parallel" />
      <Radio value="sequential" label="Sequential" />
      <Radio value="manual" label="Manual" disabled />
    </RadioGroup>
  );
}

describe('RadioGroup', () => {
  it('exposes a labelled radiogroup and selects on click', async () => {
    const onChange = vi.fn();
    render(<Example defaultValue="any" onValueChange={onChange} />);
    expect(screen.getByRole('radiogroup', { name: 'Signing order' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Any order' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Any order' })).toHaveAccessibleDescription(
      'Signers can sign in parallel',
    );
    await userEvent.click(screen.getByText('Sequential'));
    expect(onChange).toHaveBeenCalledWith('sequential');
    expect(screen.getByRole('radio', { name: 'Sequential' })).toBeChecked();
  });

  it('moves with arrow keys (native radio behaviour) and skips disabled', async () => {
    const user = userEvent.setup();
    render(<Example defaultValue="any" />);
    await user.tab();
    expect(screen.getByRole('radio', { name: 'Any order' })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: 'Sequential' })).toBeChecked();
  });

  it('shares one generated name', () => {
    render(<Example />);
    const names = screen.getAllByRole('radio').map((r) => r.getAttribute('name'));
    expect(new Set(names).size).toBe(1);
  });

  it('is controlled', async () => {
    render(<Example value="any" onValueChange={() => {}} />);
    await userEvent.click(screen.getByText('Sequential'));
    expect(screen.getByRole('radio', { name: 'Any order' })).toBeChecked();
  });

  it.each(THEMES)('axe clean in %s (default and card)', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <Example defaultValue="any" error="Pick one" required />
        <Example variant="card" name="card" />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

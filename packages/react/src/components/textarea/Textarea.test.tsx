import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { FormField } from '../form-field/FormField';
import { Textarea } from './Textarea';

describe('Textarea', () => {
  it('integrates with FormField and accepts input', async () => {
    const onChange = vi.fn();
    render(
      <FormField label="Message" description="Shown to every signer" error="Too long">
        <Textarea onChange={onChange} />
      </FormField>,
    );
    const ta = screen.getByRole('textbox', { name: 'Message' });
    expect(ta).toHaveAttribute('aria-invalid', 'true');
    expect(ta).toHaveAccessibleDescription('Shown to every signer Too long');
    await userEvent.type(ta, 'Hi');
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('shows a character count linked by aria-describedby', async () => {
    render(<Textarea aria-label="Bio" showCount maxLength={100} defaultValue="abc" />);
    const ta = screen.getByRole('textbox', { name: 'Bio' });
    expect(screen.getByText(/3 \/ 100/)).toBeInTheDocument();
    await userEvent.type(ta, 'de');
    expect(screen.getByText(/5 \/ 100/)).toBeInTheDocument();
    expect(ta).toHaveAccessibleDescription(/5 \/ 100/);
  });

  it('tracks controlled values', () => {
    const { rerender } = render(
      <Textarea aria-label="Notes" showCount value="one" onChange={() => {}} />,
    );
    rerender(<Textarea aria-label="Notes" showCount value="three" onChange={() => {}} />);
    expect(screen.getByText(/^5/)).toBeInTheDocument();
  });

  it.each(THEMES)('axe clean in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <FormField label="Notes">
          <Textarea autoResize showCount maxLength={200} />
        </FormField>
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

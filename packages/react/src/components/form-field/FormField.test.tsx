import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { FormField, useFormField, useFormFieldControl } from './FormField';

/** A minimal control that opts in to FormField wiring, as Stance inputs do. */
function Control(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...useFormFieldControl(props)} />;
}

describe('FormField', () => {
  it('labels the control and focuses it when the label is clicked', async () => {
    render(
      <FormField label="Template name">
        <Control />
      </FormField>,
    );
    const input = screen.getByRole('textbox', { name: 'Template name' });
    const label = screen.getByText('Template name');
    expect(label).toHaveAttribute('for', input.id);
    expect(label).toHaveAttribute('id', `${input.id}-label`);
    expect(input).not.toHaveAttribute('aria-describedby');
    expect(input).not.toHaveAttribute('aria-invalid');
    await userEvent.click(label);
    expect(input).toHaveFocus();
  });

  it('uses an explicit id for the control and derived ids', () => {
    render(
      <FormField id="owner" label="Owner" description="Who maintains this" error="Required">
        <Control />
      </FormField>,
    );
    const input = screen.getByRole('textbox', { name: 'Owner' });
    expect(input).toHaveAttribute('id', 'owner');
    expect(screen.getByText('Who maintains this')).toHaveAttribute('id', 'owner-description');
    expect(screen.getByRole('alert')).toHaveAttribute('id', 'owner-error');
  });

  it('describes the control with the description', () => {
    render(
      <FormField label="Slug" description="Lowercase letters only">
        <Control />
      </FormField>,
    );
    const input = screen.getByRole('textbox', { name: 'Slug' });
    expect(input).toHaveAccessibleDescription('Lowercase letters only');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('marks the control invalid and announces the error', () => {
    const { container } = render(
      <FormField label="Email" description="Work address" error="Enter a valid email">
        <Control />
      </FormField>,
    );
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Work address Enter a valid email');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email');
    expect(container.querySelector('.st-form-field')).toHaveAttribute('data-invalid', '');
    expect(container.querySelector('.st-form-field__error svg')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('treats empty, false and null errors as no error', () => {
    const { container, rerender } = render(
      <FormField label="Email" error="">
        <Control />
      </FormField>,
    );
    const field = () => container.querySelector('.st-form-field')!;
    expect(screen.queryByRole('alert')).toBeNull();
    expect(field()).not.toHaveAttribute('data-invalid');
    rerender(
      <FormField label="Email" error={false}>
        <Control />
      </FormField>,
    );
    expect(screen.queryByRole('alert')).toBeNull();
    rerender(
      <FormField label="Email" error={null}>
        <Control />
      </FormField>,
    );
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
  });

  it('passes required, disabled and readOnly to the control', () => {
    const { container, rerender } = render(
      <FormField label="Name" required>
        <Control />
      </FormField>,
    );
    expect(screen.getByRole('textbox')).toBeRequired();
    expect(container.querySelector('.st-label__required')).not.toBeNull();
    rerender(
      <FormField label="Name" disabled>
        <Control />
      </FormField>,
    );
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(container.querySelector('.st-form-field')).toHaveAttribute('data-disabled', '');
    expect(container.querySelector('.st-label')).toHaveAttribute('data-disabled', '');
    rerender(
      <FormField label="Name" readOnly>
        <Control />
      </FormField>,
    );
    expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
  });

  it('shows optional text instead of a required indicator', () => {
    const { container } = render(
      <FormField label="Notes" optionalText="Optional">
        <Control />
      </FormField>,
    );
    expect(container.querySelector('.st-label__optional')).toHaveTextContent('Optional');
    expect(screen.getByRole('textbox')).not.toBeRequired();
  });

  it('lets explicit control props win and merges aria-describedby', () => {
    render(
      <>
        <span id="extra">Extra hint</span>
        <FormField label="Name" description="Field hint" required disabled>
          <Control id="custom" aria-describedby="extra" required={false} disabled={false} />
        </FormField>
      </>,
    );
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('id', 'custom');
    expect(input).not.toBeRequired();
    expect(input).toBeEnabled();
    expect(input).toHaveAccessibleDescription('Extra hint Field hint');
  });

  it('hides the label visually but keeps the accessible name', () => {
    render(
      <FormField label="Search templates" hideLabel>
        <Control />
      </FormField>,
    );
    expect(screen.getByText('Search templates')).toHaveClass('st-sr-only');
    expect(screen.getByRole('textbox', { name: 'Search templates' })).toBeInTheDocument();
  });

  it('renders without a label and reflects orientation', () => {
    const { container, rerender } = render(
      <FormField>
        <Control aria-label="Unlabelled" />
      </FormField>,
    );
    expect(container.querySelector('label')).toBeNull();
    expect(container.querySelector('.st-form-field')).toHaveAttribute(
      'data-orientation',
      'vertical',
    );
    rerender(
      <FormField orientation="horizontal">
        <Control aria-label="Unlabelled" />
      </FormField>,
    );
    expect(container.querySelector('.st-form-field')).toHaveAttribute(
      'data-orientation',
      'horizontal',
    );
  });

  it('forwards ref, className and native props to the wrapper', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <FormField ref={ref} className="custom" data-testid="field" label="Name">
        <Control />
      </FormField>,
    );
    expect(ref.current).toBe(screen.getByTestId('field'));
    expect(ref.current).toHaveClass('st-form-field', 'custom');
  });

  it('exposes its state through useFormField and returns null outside a field', () => {
    let seen: ReturnType<typeof useFormField> | undefined;
    function Probe() {
      seen = useFormField();
      return null;
    }
    render(<Probe />);
    expect(seen).toBeNull();
    render(
      <FormField id="f" label="Name" description="Hint" error="Bad" required>
        <Probe />
      </FormField>,
    );
    expect(seen).toMatchObject({
      id: 'f',
      labelId: 'f-label',
      descriptionId: 'f-description',
      errorId: 'f-error',
      invalid: true,
      required: true,
      disabled: false,
      readOnly: false,
      hasDescription: true,
      hasError: true,
    });
  });

  it('leaves control props untouched outside a field', () => {
    render(<Control aria-label="Standalone" id="solo" />);
    const input = screen.getByRole('textbox', { name: 'Standalone' });
    expect(input).toHaveAttribute('id', 'solo');
    expect(input).not.toHaveAttribute('aria-describedby');
  });

  it.each(THEMES)('has no axe violations in the %s theme', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <FormField label="Name" description="Shown to your team" required>
          <Control />
        </FormField>
        <FormField label="Email" error="Enter a valid email">
          <Control />
        </FormField>
        <FormField label="Search" hideLabel orientation="horizontal">
          <Control />
        </FormField>
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

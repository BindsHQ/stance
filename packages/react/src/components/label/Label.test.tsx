import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { Label } from './Label';

describe('Label', () => {
  it('renders a label that names and focuses its control', async () => {
    render(
      <>
        <Label htmlFor="name">Template name</Label>
        <input id="name" />
      </>,
    );
    const label = screen.getByText('Template name');
    expect(label.tagName).toBe('LABEL');
    expect(label).toHaveClass('st-label');
    expect(label).toHaveAttribute('data-size', 'md');
    const input = screen.getByRole('textbox', { name: 'Template name' });
    await userEvent.click(label);
    expect(input).toHaveFocus();
  });

  it('adds a required indicator that is announced as text', () => {
    const { container } = render(
      <>
        <Label htmlFor="email" required>
          Email
        </Label>
        <input id="email" />
      </>,
    );
    const marker = container.querySelector('.st-label__required')!;
    expect(marker.querySelector('[aria-hidden="true"]')).toHaveTextContent('*');
    expect(marker.querySelector('.st-sr-only')).toHaveTextContent(', required');
    expect(screen.getByRole('textbox', { name: /^Email\*?, required$/ })).toBeInTheDocument();
  });

  it('shows optional text only when the field is not required', () => {
    const { container, rerender } = render(<Label optionalText="Optional">Notes</Label>);
    expect(container.querySelector('.st-label__optional')).toHaveTextContent('Optional');
    expect(container.querySelector('.st-label__required')).toBeNull();
    rerender(
      <Label optionalText="Optional" required>
        Notes
      </Label>,
    );
    expect(container.querySelector('.st-label__optional')).toBeNull();
    expect(container.querySelector('.st-label__required')).not.toBeNull();
  });

  it('reflects size and disabled as data attributes', () => {
    const { rerender } = render(<Label>Plain</Label>);
    expect(screen.getByText('Plain')).not.toHaveAttribute('data-disabled');
    rerender(
      <Label size="sm" disabled>
        Plain
      </Label>,
    );
    expect(screen.getByText('Plain')).toHaveAttribute('data-size', 'sm');
    expect(screen.getByText('Plain')).toHaveAttribute('data-disabled', '');
  });

  it('forwards ref, className and native props', () => {
    const ref = React.createRef<HTMLLabelElement>();
    render(
      <Label ref={ref} className="custom" id="lbl" htmlFor="x">
        Owner
      </Label>,
    );
    expect(ref.current).toBe(screen.getByText('Owner'));
    expect(ref.current).toHaveClass('st-label', 'custom');
    expect(ref.current).toHaveAttribute('id', 'lbl');
    expect(ref.current).toHaveAttribute('for', 'x');
  });

  it.each(THEMES)('has no axe violations in the %s theme', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <Label htmlFor="a" required>
          Name
        </Label>
        <input id="a" />
        <Label htmlFor="b" optionalText="Optional" size="sm">
          Notes
        </Label>
        <input id="b" />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

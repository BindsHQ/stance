import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { Divider } from './Divider';

describe('Divider', () => {
  it('renders a thematic break when unlabelled', () => {
    render(<Divider />);
    expect(screen.getByRole('separator').tagName).toBe('HR');
  });
  it('renders labelled text', () => {
    render(<Divider label="or" labelPosition="start" />);
    const sep = screen.getByRole('separator');
    expect(sep).toHaveTextContent('or');
    expect(sep).toHaveAttribute('data-label-position', 'start');
  });
  it('has no axe violations', async () => {
    const { container } = render(
      <div>
        <Divider />
        <Divider label="or continue with" />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

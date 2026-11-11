import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { Step, Stepper } from './Stepper';

function Example(props: Partial<React.ComponentProps<typeof Stepper>>) {
  return (
    <Stepper activeStep={2} {...props}>
      <Step title="Choose template" />
      <Step title="Add details" description="Name, role, phone" />
      <Step title="Assign users" />
      <Step title="Deploy" />
    </Stepper>
  );
}

describe('Stepper', () => {
  it('derives statuses and marks the current step', () => {
    const { container } = render(<Example />);
    const items = container.querySelectorAll('li');
    expect([...items].map((li) => li.getAttribute('data-status'))).toEqual([
      'complete',
      'complete',
      'current',
      'upcoming',
    ]);
    expect(items[2]).toHaveAttribute('aria-current', 'step');
    expect(screen.getByRole('list', { name: 'Progress' })).toBeInTheDocument();
    expect(items[0]).toHaveTextContent('Step 1 of 4, Completed');
  });

  it('allows clicking completed steps only', async () => {
    const onStepClick = vi.fn();
    render(<Example onStepClick={onStepClick} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    await userEvent.click(buttons[0]!);
    expect(onStepClick).toHaveBeenCalledWith(0);
  });

  it('allows future steps when enabled and shows errors', () => {
    render(
      <Stepper activeStep={0} onStepClick={() => {}} allowFutureSteps>
        <Step title="One" />
        <Step title="Two" status="error" />
      </Stepper>,
    );
    expect(screen.getByRole('button', { name: /Two/ })).toHaveTextContent('Has errors');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <Example onStepClick={() => {}} orientation="vertical" />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

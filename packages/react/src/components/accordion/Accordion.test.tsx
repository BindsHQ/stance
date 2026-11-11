import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  type AccordionProps,
} from './Accordion';

function Example(props: Partial<AccordionProps>) {
  return (
    <Accordion {...(props as AccordionProps)}>
      <AccordionItem value="deploy">
        <AccordionTrigger>How do deployments work?</AccordionTrigger>
        <AccordionContent>Signatures are pushed through the Exchange relay.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="billing">
        <AccordionTrigger>Who can change billing?</AccordionTrigger>
        <AccordionContent>Only organisation owners.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="sso" disabled>
        <AccordionTrigger>Single sign-on</AccordionTrigger>
        <AccordionContent>Coming soon.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

describe('Accordion', () => {
  it('renders headings with buttons wired to regions', async () => {
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'How do deployments work?' });
    expect(trigger.parentElement?.tagName).toBe('H3');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    const region = screen.getByRole('region', { name: 'How do deployments work?' });
    expect(trigger).toHaveAttribute('aria-controls', region.id);
  });

  it('single mode keeps one item open and is collapsible', async () => {
    render(<Example defaultValue="deploy" />);
    await userEvent.click(screen.getByRole('button', { name: 'Who can change billing?' }));
    expect(screen.queryByText(/Exchange relay/)).toBeNull();
    expect(screen.getByText('Only organisation owners.')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Who can change billing?' }));
    expect(screen.queryByText('Only organisation owners.')).toBeNull();
  });

  it('single mode with collapsible=false keeps the item open', async () => {
    render(<Example defaultValue="deploy" collapsible={false} />);
    await userEvent.click(screen.getByRole('button', { name: 'How do deployments work?' }));
    expect(screen.getByText(/Exchange relay/)).toBeVisible();
  });

  it('multiple mode opens several items and is controllable', async () => {
    const onValueChange = vi.fn();
    render(<Example type="multiple" defaultValue={['deploy']} onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Who can change billing?' }));
    expect(onValueChange).toHaveBeenLastCalledWith(['deploy', 'billing']);
    expect(screen.getByText(/Exchange relay/)).toBeVisible();
    expect(screen.getByText('Only organisation owners.')).toBeVisible();
  });

  it('moves focus between headers with arrow keys, Home and End, skipping disabled', async () => {
    render(<Example />);
    const user = userEvent.setup();
    await user.tab();
    expect(screen.getByRole('button', { name: 'How do deployments work?' })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'Who can change billing?' })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'How do deployments work?' })).toHaveFocus();
    await user.keyboard('{End}');
    expect(screen.getByRole('button', { name: 'Who can change billing?' })).toHaveFocus();
    await user.keyboard('{Home}{Enter}');
    expect(screen.getByText(/Exchange relay/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Single sign-on' })).toBeDisabled();
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <Example defaultValue="deploy" />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

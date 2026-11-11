import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './Collapsible';

describe('Collapsible', () => {
  it('toggles uncontrolled with aria wiring', async () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Advanced settings</CollapsibleTrigger>
        <CollapsibleContent>Relay host</CollapsibleContent>
      </Collapsible>,
    );
    const trigger = screen.getByRole('button', { name: 'Advanced settings' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Relay host')).toBeNull();
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Relay host').id).toBe(trigger.getAttribute('aria-controls'));
  });

  it('supports keyboard and controlled use', async () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Collapsible open={false} onOpenChange={onOpenChange}>
        <CollapsibleTrigger>More</CollapsibleTrigger>
        <CollapsibleContent>Body</CollapsibleContent>
      </Collapsible>,
    );
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByText('Body')).toBeNull();
    rerender(
      <Collapsible open onOpenChange={onOpenChange}>
        <CollapsibleTrigger>More</CollapsibleTrigger>
        <CollapsibleContent>Body</CollapsibleContent>
      </Collapsible>,
    );
    expect(screen.getByText('Body')).toBeVisible();
  });

  it('keeps content mounted with forceMount and respects disabled', async () => {
    render(
      <Collapsible disabled>
        <CollapsibleTrigger>Locked</CollapsibleTrigger>
        <CollapsibleContent forceMount>Hidden body</CollapsibleContent>
      </Collapsible>,
    );
    expect(screen.getByText('Hidden body')).not.toBeVisible();
    expect(screen.getByRole('button', { name: 'Locked' })).toBeDisabled();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <Collapsible defaultOpen>
        <CollapsibleTrigger>More</CollapsibleTrigger>
        <CollapsibleContent>Body</CollapsibleContent>
      </Collapsible>,
    );
    await expectNoA11yViolations(container);
  });
});

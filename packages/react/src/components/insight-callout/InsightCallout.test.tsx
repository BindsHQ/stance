import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { InsightCallout } from './InsightCallout';

describe('InsightCallout', () => {
  it('is a group named by its tone and title', () => {
    render(
      <InsightCallout title="Renewals are up 18% this quarter">
        Most come from two teams.
      </InsightCallout>,
    );
    const group = screen.getByRole('group', {
      name: /^Insight:\s*Renewals are up 18% this quarter$/,
    });
    expect(group).toHaveAttribute('data-tone', 'neutral');
    expect(within(group).getByRole('heading', { level: 3 })).toHaveTextContent(
      'Renewals are up 18% this quarter',
    );
    expect(within(group).getByText('Most come from two teams.')).toBeVisible();
  });

  it('states each tone in words and with its own icon', () => {
    const { rerender, container } = render(<InsightCallout title="A" tone="positive" />);
    expect(screen.getByText('Good news')).toBeVisible();
    expect(container.querySelector('[data-icon="check-circle"]')).not.toBeNull();
    rerender(<InsightCallout title="A" tone="attention" />);
    expect(screen.getByText('Needs attention')).toBeVisible();
    expect(container.querySelector('[data-icon="alert-triangle"]')).not.toBeNull();
    rerender(<InsightCallout title="A" tone="neutral" icon={<svg data-testid="own" />} />);
    expect(screen.getByTestId('own')).toBeInTheDocument();
  });

  it('keeps the evidence behind a disclosure', async () => {
    const user = userEvent.setup();
    const onEvidenceOpenChange = vi.fn();
    render(
      <InsightCallout
        title="A"
        evidence={<p>14 of 22 contracts renewed early.</p>}
        onEvidenceOpenChange={onEvidenceOpenChange}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Show evidence' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('14 of 22 contracts renewed early.')).toBeNull();
    await user.click(trigger);
    expect(onEvidenceOpenChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole('button', { name: 'Hide evidence' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByText('14 of 22 contracts renewed early.')).toBeVisible();
    await user.keyboard('{Enter}');
    expect(screen.queryByText('14 of 22 contracts renewed early.')).toBeNull();
  });

  it('supports controlled and default open evidence', async () => {
    const onEvidenceOpenChange = vi.fn();
    const { rerender } = render(
      <InsightCallout
        title="A"
        evidence="Figures"
        evidenceOpen={false}
        onEvidenceOpenChange={onEvidenceOpenChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Show evidence' }));
    expect(onEvidenceOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByText('Figures')).toBeNull();
    rerender(<InsightCallout title="A" evidence="Figures" evidenceOpen />);
    expect(screen.getByText('Figures')).toBeVisible();
    rerender(<InsightCallout key="other" title="A" evidence="Figures" defaultEvidenceOpen />);
    expect(screen.getByText('Figures')).toBeVisible();
  });

  it('shows confidence, the action and a dismiss button', async () => {
    const onDismiss = vi.fn();
    const onAct = vi.fn();
    render(
      <InsightCallout
        title="A"
        confidence="high"
        action={<button onClick={onAct}>Review contracts</button>}
        onDismiss={onDismiss}
      />,
    );
    expect(screen.getByText('High confidence')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Review contracts' }));
    expect(onAct).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('has no dismiss button without onDismiss, and honours labels and heading level', () => {
    render(
      <InsightCallout
        title="Förnyelser ökar"
        headingLevel={2}
        evidence="x"
        labels={{ tone: { neutral: 'Insikt' }, showEvidence: 'Visa underlag' }}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull();
    expect(screen.getByRole('group', { name: /^Insikt:\s*Förnyelser ökar$/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Visa underlag' })).toBeInTheDocument();
  });

  it('forwards the ref, className and props', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<InsightCallout ref={ref} title="A" className="mine" id="insight" />);
    expect(ref.current).toHaveClass('st-insight-callout', 'mine');
    expect(ref.current).toHaveAttribute('id', 'insight');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <InsightCallout
          title="Renewals are up"
          tone="positive"
          confidence="medium"
          evidence="Figures"
          defaultEvidenceOpen
          action={<button>Review</button>}
          onDismiss={() => {}}
        >
          Most come from two teams.
        </InsightCallout>
        <InsightCallout title="Three invoices are overdue" tone="attention" />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

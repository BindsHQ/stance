import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { Banner } from './Banner';

describe('Banner', () => {
  it('renders a labelled region with an action', () => {
    render(<Banner action={<a href="/billing">Upgrade</a>}>You have used 48 of 50 seats.</Banner>);
    expect(screen.getByRole('region', { name: 'Announcement' })).toHaveTextContent(
      'You have used 48 of 50 seats.',
    );
    expect(screen.getByRole('link', { name: 'Upgrade' })).toBeInTheDocument();
  });

  it('dismisses itself and reports the change', async () => {
    const onOpenChange = vi.fn();
    render(
      <Banner dismissible tone="warning" onOpenChange={onOpenChange}>
        Scheduled maintenance tonight.
      </Banner>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss announcement' }));
    expect(screen.queryByRole('region')).toBeNull();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('supports controlled visibility', () => {
    render(<Banner open={false}>Hidden</Banner>);
    expect(screen.queryByText('Hidden')).toBeNull();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <>
        <Banner dismissible label="Release notice">
          New: Outlook add-in.
        </Banner>
        <Banner tone="danger" label="Outage notice">
          Deploys are paused.
        </Banner>
      </>,
    );
    await expectNoA11yViolations(container);
  });
});

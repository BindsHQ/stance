import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { Alert } from './Alert';

describe('Alert', () => {
  it('uses role status for info/success and alert for warning/danger', () => {
    render(
      <>
        <Alert tone="info" title="Heads up" />
        <Alert tone="success" title="Saved" />
        <Alert tone="warning" title="Seats nearly full" />
        <Alert tone="danger" title="Sync failed" />
      </>,
    );
    expect(screen.getAllByRole('status')).toHaveLength(2);
    expect(screen.getAllByRole('alert')).toHaveLength(2);
  });

  it('renders title, description, actions and dismiss', async () => {
    const onDismiss = vi.fn();
    render(
      <Alert
        tone="warning"
        title="Azure connection expires soon"
        actions={<button type="button">Reconnect</button>}
        onDismiss={onDismiss}
      >
        Signatures stop deploying on 14 November.
      </Alert>,
    );
    expect(screen.getByText('Signatures stop deploying on 14 November.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reconnect' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('can hide the icon', () => {
    const { container } = render(<Alert icon={false} title="Plain" />);
    expect(container.querySelector('.st-alert__icon')).toBeNull();
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        {(['info', 'success', 'warning', 'danger'] as const).map((t) => (
          <Alert key={t} tone={t} title={t} onDismiss={() => {}}>
            Message
          </Alert>
        ))}
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders text with tone, variant and size attributes', () => {
    render(
      <Badge tone="success" variant="solid" size="sm" dot>
        Deployed
      </Badge>,
    );
    const badge = screen.getByText('Deployed');
    expect(badge).toHaveAttribute('data-tone', 'success');
    expect(badge).toHaveAttribute('data-variant', 'solid');
    expect(badge).toHaveAttribute('data-size', 'sm');
    expect(badge.querySelector('.st-badge__dot')).toHaveAttribute('aria-hidden', 'true');
  });

  it('caps counts at max', () => {
    render(
      <>
        <Badge count={7} aria-label="7 unread" />
        <Badge count={120} />
        <Badge count={12} max={9} />
      </>,
    );
    expect(screen.getByLabelText('7 unread')).toHaveTextContent('7');
    expect(screen.getByText('99+')).toBeInTheDocument();
    expect(screen.getByText('9+')).toBeInTheDocument();
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        {(['neutral', 'info', 'success', 'warning', 'danger', 'inverse'] as const).map((t) =>
          (['soft', 'solid', 'outline'] as const).map((v) => (
            <Badge key={t + v} tone={t} variant={v}>
              {t}
            </Badge>
          )),
        )}
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

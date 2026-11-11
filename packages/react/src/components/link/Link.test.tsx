import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { Link } from './Link';

describe('Link', () => {
  it('renders an anchor with the inline variant', () => {
    render(<Link href="/terms">Terms</Link>);
    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute('data-variant', 'inline');
  });
  it('marks external links safely and announces new tab', () => {
    render(
      <Link href="https://binds.si" external>
        Binds
      </Link>,
    );
    const link = screen.getByRole('link', { name: 'Binds, opens in a new tab' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });
  it('is reachable by keyboard', async () => {
    render(<Link href="/privacy">Privacy</Link>);
    await userEvent.tab();
    expect(screen.getByRole('link')).toHaveFocus();
  });
  it('supports asChild', () => {
    render(
      <Link asChild variant="standalone">
        <a href="/x">Router</a>
      </Link>,
    );
    expect(screen.getByRole('link')).toHaveClass('st-link');
  });
  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <p data-theme={theme}>
        Read our <Link href="/terms">terms</Link> or visit{' '}
        <Link href="https://binds.si" external>
          Binds
        </Link>
        .
      </p>,
    );
    await expectNoA11yViolations(container);
  });
});

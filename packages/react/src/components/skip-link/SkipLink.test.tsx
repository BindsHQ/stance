import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { SkipLink } from './SkipLink';

describe('SkipLink', () => {
  it('is the first tab stop and moves focus to main', async () => {
    const user = userEvent.setup();
    render(
      <>
        <SkipLink />
        <nav>
          <a href="/a">Nav</a>
        </nav>
        <main id="main">Content</main>
      </>,
    );
    await user.tab();
    const link = screen.getByRole('link', { name: 'Skip to main content' });
    expect(link).toHaveFocus();
    expect(link).toHaveAttribute('href', '#main');
    await user.keyboard('{Enter}');
    expect(screen.getByRole('main')).toHaveFocus();
  });
  it('accepts a custom target and label', () => {
    render(<SkipLink target="#content">Skip to templates</SkipLink>);
    expect(screen.getByRole('link', { name: 'Skip to templates' })).toHaveAttribute(
      'href',
      '#content',
    );
  });
  it('has no axe violations', async () => {
    const { container } = render(
      <div>
        <SkipLink />
        <main id="main" />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { RichText } from './RichText';

describe('RichText', () => {
  it('wraps children without altering them', () => {
    render(
      <RichText as="article" size="lg">
        <h2>Data processing</h2>
        <p>We process signature data on behalf of your organisation.</p>
      </RichText>,
    );
    const article = screen.getByRole('article');
    expect(article).toHaveAttribute('data-size', 'lg');
    expect(article).toHaveAttribute('data-measure');
    expect(screen.getByRole('heading', { name: 'Data processing' })).toBeInTheDocument();
  });
  it('has no axe violations', async () => {
    const { container } = render(
      <RichText>
        <h2>T</h2>
        <ul>
          <li>One</li>
        </ul>
        <a href="/x">Link</a>
      </RichText>,
    );
    await expectNoA11yViolations(container);
  });
});

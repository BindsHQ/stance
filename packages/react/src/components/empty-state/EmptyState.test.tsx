import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders a heading, description and actions', () => {
    render(
      <EmptyState
        icon={<svg />}
        title="No templates yet"
        description="Create a template to give your organisation a consistent signature."
        action={<button type="button">Create template</button>}
        secondaryAction={<a href="#gallery">Browse gallery</a>}
        headingLevel={2}
      />,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'No templates yet' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create template' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse gallery' })).toBeInTheDocument();
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <EmptyState title="No results" description="Try another search." bordered size="sm" />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardLink,
  CardMedia,
  CardTitle,
} from './Card';

describe('Card', () => {
  it('renders composed parts with a heading', () => {
    render(
      <Card variant="elevated">
        <CardHeader actions={<button type="button">Edit</button>}>
          <CardTitle>Sales 2026</CardTitle>
          <CardDescription>Default signature for the sales team</CardDescription>
        </CardHeader>
        <CardContent>Assigned to 48 people</CardContent>
        <CardFooter>
          <button type="button">Deploy</button>
        </CardFooter>
      </Card>,
    );
    expect(screen.getByRole('heading', { level: 3, name: 'Sales 2026' })).toBeInTheDocument();
    expect(screen.getByText('Assigned to 48 people').closest('.st-card')).toHaveAttribute(
      'data-variant',
      'elevated',
    );
  });

  it('supports asChild for semantic containers', () => {
    render(
      <Card asChild>
        <article aria-label="Template">x</article>
      </Card>,
    );
    expect(screen.getByRole('article', { name: 'Template' })).toHaveClass('st-card');
  });

  it('interactive cards expose a single real link', () => {
    render(
      <Card interactive>
        <CardMedia ratio="3 / 1" aria-hidden="true" />
        <CardTitle>
          <CardLink href="#tpl">Executive</CardLink>
        </CardTitle>
        <CardDescription>Used by 6 people</CardDescription>
      </Card>,
    );
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Executive' })).toHaveAttribute('data-card-link');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <Card interactive>
          <CardHeader>
            <CardTitle level={2}>
              <CardLink href="#a">Contracts</CardLink>
            </CardTitle>
          </CardHeader>
          <CardContent>12 active</CardContent>
        </Card>
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { BreadcrumbItem, Breadcrumbs } from './Breadcrumbs';

function Trail({ maxItems }: { maxItems?: number }) {
  return (
    <Breadcrumbs maxItems={maxItems}>
      <BreadcrumbItem href="/">Dashboard</BreadcrumbItem>
      <BreadcrumbItem href="/templates">Templates</BreadcrumbItem>
      <BreadcrumbItem href="/templates/global">Global</BreadcrumbItem>
      <BreadcrumbItem href="/templates/global/sales">Sales team</BreadcrumbItem>
      <BreadcrumbItem current>Edit signature</BreadcrumbItem>
    </Breadcrumbs>
  );
}

describe('Breadcrumbs', () => {
  it('renders a labelled nav landmark with an ordered list and current page', () => {
    render(<Trail />);
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(nav.querySelector('ol')).toBeInTheDocument();
    expect(screen.getByText('Edit signature')).toHaveAttribute('aria-current', 'page');
    expect(screen.getAllByRole('link')).toHaveLength(4);
  });

  it('hides separators from assistive technology', () => {
    const { container } = render(<Trail />);
    container
      .querySelectorAll('.st-breadcrumbs__separator')
      .forEach((s) => expect(s).toHaveAttribute('aria-hidden', 'true'));
  });

  it('collapses middle items and expands them on demand', async () => {
    render(<Trail maxItems={3} />);
    expect(screen.queryByRole('link', { name: 'Templates' })).toBeNull();
    const more = screen.getByRole('button', { name: /Show all breadcrumbs \(2 hidden\)/ });
    await userEvent.click(more);
    expect(screen.getByRole('link', { name: 'Templates' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('link', { name: 'Templates' })).toHaveFocus());
  });

  it('supports asChild links', () => {
    render(
      <Breadcrumbs>
        <BreadcrumbItem asChild>
          <a href="/settings">Settings</a>
        </BreadcrumbItem>
        <BreadcrumbItem current>Billing</BreadcrumbItem>
      </Breadcrumbs>,
    );
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveClass('st-breadcrumbs__link');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <Trail maxItems={3} />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

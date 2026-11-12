import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { getSourceDomain, SourcePreview, type Source } from './SourcePreview';

const source: Source = {
  title: 'Retention policy for signed documents',
  url: 'https://www.example.com/policies/retention',
  favicon: 'https://www.example.com/favicon.ico',
  snippet: 'Signed documents are kept for seven years.',
};

describe('SourcePreview', () => {
  it('shows the title as a link that opens in a new tab, the site and the snippet', () => {
    render(<SourcePreview source={source} />);
    const link = screen.getByRole('link', { name: /Retention policy for signed documents/ });
    expect(link).toHaveAttribute('href', source.url);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveAccessibleName(/opens in a new tab/);
    expect(screen.getByText('example.com')).toBeInTheDocument();
    expect(screen.getByText('Signed documents are kept for seven years.')).toBeInTheDocument();
  });

  it('derives the domain from the url and prefers an explicit domain', () => {
    expect(getSourceDomain({ title: 'A', url: 'https://www.binds.si/x' })).toBe('binds.si');
    expect(getSourceDomain({ title: 'A', url: 'https://a.example', domain: 'Example' })).toBe(
      'Example',
    );
    expect(getSourceDomain({ title: 'A', url: 'not a url' })).toBeUndefined();
    expect(getSourceDomain({ title: 'A' })).toBeUndefined();
  });

  it('calls onOpen from the link, and keeps the same tab when asked', async () => {
    const onOpen = vi.fn();
    render(<SourcePreview source={source} onOpen={onOpen} target="_self" />);
    const link = screen.getByRole('link');
    expect(link).not.toHaveAttribute('rel');
    expect(link).not.toHaveAccessibleName(/new tab/);
    link.addEventListener('click', (e) => e.preventDefault());
    await userEvent.click(link);
    expect(onOpen).toHaveBeenCalledWith(source);
  });

  it('renders a button without a url when onOpen is given, and plain text otherwise', async () => {
    const onOpen = vi.fn();
    const local = { title: 'Uploaded contract.pdf' };
    const { rerender } = render(<SourcePreview source={local} onOpen={onOpen} />);
    await userEvent.click(screen.getByRole('button', { name: 'Uploaded contract.pdf' }));
    expect(onOpen).toHaveBeenCalledWith(local);
    rerender(<SourcePreview source={local} />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('Uploaded contract.pdf')).toBeInTheDocument();
  });

  it('falls back to the globe icon when the favicon is missing or fails', () => {
    const { container, rerender } = render(<SourcePreview source={source} />);
    const img = container.querySelector('img')!;
    expect(img).toHaveAttribute('alt', '');
    fireEvent.error(img);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('[data-icon="globe"]')).toBeInTheDocument();
    rerender(<SourcePreview source={{ title: 'No icon' }} />);
    expect(container.querySelector('[data-icon="globe"]')).toBeInTheDocument();
  });

  it('shows a citation index, size, className, rest props and forwards the ref', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <SourcePreview
        ref={ref}
        source={source}
        index={2}
        size="sm"
        className="custom"
        data-testid="card"
      />,
    );
    const card = screen.getByTestId('card');
    expect(ref.current).toBe(card);
    expect(card).toHaveClass('st-source-preview', 'custom');
    expect(card).toHaveAttribute('data-size', 'sm');
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <SourcePreview source={source} index={1} />
        <SourcePreview source={{ title: 'Local file' }} onOpen={() => {}} size="sm" />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

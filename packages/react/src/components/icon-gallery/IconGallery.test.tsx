import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { iconNames } from '../../icons/paths';
import { IconGallery } from './IconGallery';

describe('IconGallery', () => {
  it('lists every icon by default', () => {
    render(<IconGallery />);
    expect(screen.getAllByRole('listitem')).toHaveLength(iconNames.length);
  });
  it('filters by search query', async () => {
    const user = userEvent.setup();
    render(<IconGallery />);
    await user.type(screen.getByRole('searchbox', { name: 'Search icons' }), 'chevron');
    const items = screen.getAllByRole('listitem');
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((i) => i.textContent?.includes('chevron'))).toBe(true);
    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), 'zzzz');
    expect(screen.getByText(/No icons match/)).toBeInTheDocument();
  });
  it('copies an icon name and announces it', async () => {
    const user = userEvent.setup();
    render(<IconGallery icons={['check', 'x']} />);
    await user.click(screen.getByRole('button', { name: 'Copy icon name check' }));
    expect(await navigator.clipboard.readText()).toBe('check');
    expect(screen.getByRole('status')).toHaveTextContent('Copied check');
  });
  it('calls onSelect instead of copying when provided', async () => {
    const onSelect = vi.fn();
    render(<IconGallery icons={['mail']} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: 'mail' }));
    expect(onSelect).toHaveBeenCalledWith('mail');
  });
  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <IconGallery icons={['check', 'copy', 'mail']} />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

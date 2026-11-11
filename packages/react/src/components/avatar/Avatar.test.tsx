import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { Avatar, getAvatarTint, getInitials } from './Avatar';

describe('Avatar', () => {
  it('derives initials and a stable tint', () => {
    expect(getInitials('Ada Lovelace')).toBe('AL');
    expect(getInitials('  binds ')).toBe('B');
    expect(getInitials('Grace Brewster Murray Hopper')).toBe('GH');
    expect(getAvatarTint('Ada Lovelace')).toBe(getAvatarTint('Ada Lovelace'));
  });

  it('exposes the name and status as an image', () => {
    render(<Avatar name="Ada Lovelace" status="online" />);
    expect(screen.getByRole('img', { name: 'Ada Lovelace (online)' })).toBeInTheDocument();
    expect(screen.getByText('AL')).toBeInTheDocument();
  });

  it('falls back to initials when the image fails', () => {
    const { container } = render(<Avatar name="Grace Hopper" src="/missing.png" />);
    const img = container.querySelector('img')!;
    expect(img).toHaveAttribute('alt', '');
    fireEvent.error(img);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('GH')).toBeInTheDocument();
  });

  it('hides initials once the image loads', () => {
    const { container } = render(<Avatar name="Grace Hopper" src="/g.png" />);
    fireEvent.load(container.querySelector('img')!);
    expect(screen.queryByText('GH')).toBeNull();
  });

  it('can be decorative', () => {
    render(<Avatar name="Ada" decorative />);
    expect(screen.queryByRole('img')).toBeNull();
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <Avatar name="Ada Lovelace" status="busy" statusLabel="In a meeting" size="lg" />
        <Avatar name="Binds" shape="square" />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

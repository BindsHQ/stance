import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { Icon } from '../../icons/Icon';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('uses label as accessible name and title', () => {
    render(<IconButton label="Delete template" icon={<Icon name="trash" />} />);
    const b = screen.getByRole('button', { name: 'Delete template' });
    expect(b).toHaveAttribute('title', 'Delete template');
    expect(b).toHaveAttribute('data-variant', 'ghost');
  });
  it('clicks, and blocks while loading', async () => {
    const fn = vi.fn();
    const { rerender } = render(
      <IconButton label="Copy" icon={<Icon name="copy" />} onClick={fn} />,
    );
    await userEvent.click(screen.getByRole('button'));
    rerender(<IconButton label="Copy" icon={<Icon name="copy" />} onClick={fn} loading />);
    await userEvent.click(screen.getByRole('button'));
    expect(fn).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });
  it('hides title when requested and supports circle shape', () => {
    render(<IconButton label="Menu" icon={<Icon name="menu" />} hideTitle shape="circle" />);
    expect(screen.getByRole('button')).not.toHaveAttribute('title');
    expect(screen.getByRole('button')).toHaveAttribute('data-shape', 'circle');
  });
  it.each(THEMES)('axe clean in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        {(['primary', 'secondary', 'outline', 'ghost', 'danger'] as const).map((v) => (
          <IconButton key={v} variant={v} label={v} icon={<Icon name="plus" />} />
        ))}
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

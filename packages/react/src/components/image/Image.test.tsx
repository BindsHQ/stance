import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { Image } from './Image';

describe('Image', () => {
  it('renders a lazy image with alt text', () => {
    render(<Image src="/logo.png" alt="Binds logo" ratio={2} />);
    const img = screen.getByRole('img', { name: 'Binds logo' });
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img.style.aspectRatio).toMatch(/^2/);
  });
  it('shows an accessible fallback when loading fails', () => {
    render(<Image src="/missing.png" alt="Team photo" />);
    fireEvent.error(screen.getByRole('img'));
    const fallback = screen.getByRole('img', { name: 'Team photo' });
    expect(fallback.tagName).toBe('SPAN');
  });
  it('hides decorative fallbacks', () => {
    const { container } = render(<Image alt="" />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });
  it('has no axe violations', async () => {
    const { container } = render(<Image src="/a.png" alt="Signature preview" />);
    await expectNoA11yViolations(container);
  });
});

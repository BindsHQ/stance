import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Kbd } from './Kbd';

describe('Kbd', () => {
  it('renders a single key', () => {
    render(<Kbd>Esc</Kbd>);
    expect(screen.getByText('Esc').tagName).toBe('KBD');
  });
  it('renders a combination with spoken labels', () => {
    const { container } = render(<Kbd keys={['mod', 'shift', 'k']} />);
    expect(container.querySelectorAll('kbd.st-kbd')).toHaveLength(3);
    expect(container.textContent).toContain('Command');
    expect(container.textContent).toContain('Shift');
    expect(container.textContent).toContain('K');
  });
});

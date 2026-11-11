import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { ToggleButton, ToggleButtonGroup } from './ToggleButton';

describe('ToggleButton', () => {
  it('toggles aria-pressed uncontrolled', async () => {
    const onChange = vi.fn();
    render(<ToggleButton onPressedChange={onChange}>Bold</ToggleButton>);
    const b = screen.getByRole('button', { name: 'Bold' });
    expect(b).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(b);
    expect(b).toHaveAttribute('aria-pressed', 'true');
    expect(onChange).toHaveBeenCalledWith(true);
  });
  it('is controllable', () => {
    render(<ToggleButton pressed>Bold</ToggleButton>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('ToggleButtonGroup', () => {
  it('single selection with deselect, and required prevents deselect', async () => {
    const onChange = vi.fn();
    render(
      <ToggleButtonGroup label="Alignment" defaultValue="left" onValueChange={onChange}>
        <ToggleButton value="left">Left</ToggleButton>
        <ToggleButton value="center">Center</ToggleButton>
      </ToggleButtonGroup>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Center' }));
    expect(screen.getByRole('button', { name: 'Center' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Left' })).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(screen.getByRole('button', { name: 'Center' }));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
  it('required keeps one selected', async () => {
    render(
      <ToggleButtonGroup label="View" defaultValue="grid" required>
        <ToggleButton value="grid">Grid</ToggleButton>
        <ToggleButton value="list">List</ToggleButton>
      </ToggleButtonGroup>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Grid' }));
    expect(screen.getByRole('button', { name: 'Grid' })).toHaveAttribute('aria-pressed', 'true');
  });
  it('multiple selection', async () => {
    const onChange = vi.fn();
    render(
      <ToggleButtonGroup type="multiple" label="Format" onValueChange={onChange}>
        <ToggleButton value="b">Bold</ToggleButton>
        <ToggleButton value="i">Italic</ToggleButton>
      </ToggleButtonGroup>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Bold' }));
    await userEvent.click(screen.getByRole('button', { name: 'Italic' }));
    expect(onChange).toHaveBeenLastCalledWith(['b', 'i']);
  });
  it('roving focus with arrows, single tab stop', async () => {
    render(
      <ToggleButtonGroup label="Alignment" defaultValue="center">
        <ToggleButton value="left">Left</ToggleButton>
        <ToggleButton value="center">Center</ToggleButton>
        <ToggleButton value="right">Right</ToggleButton>
      </ToggleButtonGroup>,
    );
    const user = userEvent.setup();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Center' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Right' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('button', { name: 'Left' })).toHaveFocus();
    expect(screen.getAllByRole('button').filter((b) => b.tabIndex === 0)).toHaveLength(1);
  });
  it.each(THEMES)('axe clean in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <ToggleButtonGroup label="Alignment" defaultValue="left">
          <ToggleButton value="left">Left</ToggleButton>
          <ToggleButton value="right" disabled>
            Right
          </ToggleButton>
        </ToggleButtonGroup>
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

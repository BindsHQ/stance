import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { Toolbar, ToolbarGroup, ToolbarSeparator } from './Toolbar';

function Example({ orientation }: { orientation?: 'horizontal' | 'vertical' }) {
  return (
    <>
      <button type="button">Before</button>
      <Toolbar aria-label="Template formatting" orientation={orientation}>
        <ToolbarGroup aria-label="Text style">
          <button type="button" aria-pressed="false">
            Bold
          </button>
          <button type="button" aria-pressed="false">
            Italic
          </button>
        </ToolbarGroup>
        <ToolbarSeparator />
        <button type="button" disabled>
          Undo
        </button>
        <input aria-label="Font size" defaultValue="14" />
        <button type="button">Insert link</button>
      </Toolbar>
      <button type="button">After</button>
    </>
  );
}

describe('Toolbar', () => {
  it('exposes role, orientation and groups', () => {
    render(<Example />);
    const toolbar = screen.getByRole('toolbar', { name: 'Template formatting' });
    expect(toolbar).toHaveAttribute('aria-orientation', 'horizontal');
    expect(screen.getByRole('group', { name: 'Text style' })).toBeInTheDocument();
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('is a single tab stop with arrow-key navigation, skipping disabled controls', async () => {
    render(<Example />);
    const user = userEvent.setup();
    await user.click(screen.getByText('Before'));
    await user.tab();
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Italic' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('textbox', { name: 'Font size' })).toHaveFocus();
    // Text fields keep Left/Right for the caret.
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('textbox', { name: 'Font size' })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    await user.tab();
    expect(screen.getByText('After')).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('toolbar').contains(document.activeElement)).toBe(true);
  });

  it('wraps and supports Home/End', async () => {
    render(<Example />);
    const user = userEvent.setup();
    await user.click(screen.getByText('Before'));
    await user.tab();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('button', { name: 'Insert link' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveFocus();
    await user.keyboard('{End}');
    expect(screen.getByRole('button', { name: 'Insert link' })).toHaveFocus();
  });

  it('uses Up/Down when vertical', async () => {
    render(<Example orientation="vertical" />);
    const user = userEvent.setup();
    await user.click(screen.getByText('Before'));
    await user.tab();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'Italic' })).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveFocus();
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <Example />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

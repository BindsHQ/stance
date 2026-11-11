import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { InlineEdit } from './InlineEdit';

describe('InlineEdit', () => {
  it('shows the value as a button named after what it edits', () => {
    render(<InlineEdit label="template name" defaultValue="Sales team" />);
    expect(
      screen.getByRole('button', { name: /^Edit template name:\s*Sales team$/ }),
    ).toHaveTextContent('Sales team');
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('enters edit mode on click, Enter and Space with the text selected', async () => {
    render(<InlineEdit label="template name" defaultValue="Sales team" />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button'));
    const input = screen.getByRole('textbox', { name: 'template name' }) as HTMLInputElement;
    expect(input).toHaveFocus();
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe('Sales team'.length);
    await user.keyboard('{Escape}');
    await user.keyboard('{Enter}');
    expect(screen.getByRole('textbox')).toHaveFocus();
    await user.keyboard('{Escape}');
    await user.keyboard(' ');
    expect(screen.getByRole('textbox')).toHaveFocus();
  });

  it('commits with Enter, trims, and returns focus to the read view', async () => {
    const onCommit = vi.fn();
    render(<InlineEdit label="template name" defaultValue="Sales team" onCommit={onCommit} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button'));
    await user.keyboard('  Legal team {Enter}');
    expect(onCommit).toHaveBeenCalledWith('Legal team');
    const read = screen.getByRole('button', { name: /^Edit template name:\s*Legal team$/ });
    expect(read).toHaveFocus();
  });

  it('commits on blur', async () => {
    const onCommit = vi.fn();
    render(
      <>
        <InlineEdit label="template name" defaultValue="Sales team" onCommit={onCommit} />
        <button type="button">Elsewhere</button>
      </>,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Edit/ }));
    await user.keyboard('Finance');
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }));
    expect(onCommit).toHaveBeenCalledWith('Finance');
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('cancels with Escape, restoring the value and focus', async () => {
    const onCommit = vi.fn();
    const onCancel = vi.fn();
    render(
      <InlineEdit
        label="template name"
        defaultValue="Sales team"
        onCommit={onCommit}
        onCancel={onCancel}
      />,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole('button'));
    await user.keyboard('Other{Escape}');
    expect(onCommit).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole('button', { name: /^Edit template name:\s*Sales team$/ }),
    ).toHaveFocus();
  });

  it('does not call onCommit when the value is unchanged', async () => {
    const onCommit = vi.fn();
    render(<InlineEdit label="template name" defaultValue="Sales team" onCommit={onCommit} />);
    await userEvent.click(screen.getByRole('button'));
    await userEvent.keyboard('{Enter}');
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('keeps editing and shows the error when validation fails', async () => {
    const onCommit = vi.fn();
    render(
      <InlineEdit
        label="template name"
        defaultValue="Sales team"
        onCommit={onCommit}
        validate={(v) => (v ? undefined : 'Enter a name')}
      />,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole('button'));
    await user.keyboard('{Backspace}{Enter}');
    const input = screen.getByRole('textbox');
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Enter a name');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a name');
    expect(onCommit).not.toHaveBeenCalled();
    await user.keyboard('Legal{Enter}');
    expect(onCommit).toHaveBeenCalledWith('Legal');
  });

  it('offers confirm and cancel buttons, and then blur does not commit', async () => {
    const onCommit = vi.fn();
    render(
      <>
        <InlineEdit
          label="template name"
          defaultValue="Sales team"
          onCommit={onCommit}
          showActions
        />
        <button type="button">Elsewhere</button>
      </>,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Edit/ }));
    await user.keyboard('Finance');
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }));
    expect(onCommit).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onCommit).toHaveBeenCalledWith('Finance');
    await user.click(screen.getByRole('button', { name: /Edit/ }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('button', { name: /^Edit template name:\s*Finance$/ })).toHaveFocus();
  });

  it('uses a textarea when multiline: Enter adds a line, Ctrl+Enter commits', async () => {
    const onCommit = vi.fn();
    render(<InlineEdit label="note" defaultValue="" multiline onCommit={onCommit} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /^Edit note:/ }));
    expect(screen.getByRole('textbox').tagName).toBe('TEXTAREA');
    await user.keyboard('Line one{Enter}Line two');
    expect(onCommit).not.toHaveBeenCalled();
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(onCommit).toHaveBeenCalledWith('Line one\nLine two');
  });

  it('shows a placeholder when empty, and respects disabled, readOnly and controlled value', async () => {
    const { rerender } = render(<InlineEdit label="job title" placeholder="Add a job title" />);
    expect(screen.getByRole('button', { name: /^Edit job title:/ })).toHaveTextContent(
      'Add a job title',
    );
    rerender(<InlineEdit label="job title" defaultValue="Counsel" disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
    rerender(<InlineEdit label="job title" value="Counsel" readOnly />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('Counsel')).toBeInTheDocument();

    function Controlled() {
      const [v, setV] = React.useState('A');
      return <InlineEdit label="name" value={v} onCommit={setV} />;
    }
    rerender(<Controlled />);
    await userEvent.click(screen.getByRole('button'));
    await userEvent.keyboard('B{Enter}');
    expect(screen.getByRole('button', { name: /^Edit name:\s*B$/ })).toBeInTheDocument();
  });

  it.each(THEMES)('has no axe violations in %s (read and edit views)', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <InlineEdit label="template name" defaultValue="Sales team" />
        <InlineEdit label="owner" defaultValue="Priya Nair" defaultEditing showActions />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

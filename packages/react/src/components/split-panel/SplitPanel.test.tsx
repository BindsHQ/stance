import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { ResizablePanel } from '../resizable-panel/ResizablePanel';
import { resizePair } from './context';
import { ResizeHandle, SplitPanel } from './SplitPanel';

function Example(props: {
  onLayout?: (s: number[]) => void;
  autoSaveId?: string;
  orientation?: 'horizontal' | 'vertical';
}) {
  return (
    <SplitPanel {...props} style={{ height: 300 }}>
      <ResizablePanel id="templates" defaultSize={30} minSize={20} maxSize={60} collapsible>
        Templates
      </ResizablePanel>
      <ResizeHandle aria-label="Resize templates" />
      <ResizablePanel id="preview">Preview</ResizablePanel>
    </SplitPanel>
  );
}

describe('resizePair', () => {
  const c = [
    { id: 'a', minSize: 20, maxSize: 60, collapsible: true, collapsedSize: 0 },
    { id: 'b', minSize: 10, maxSize: 100, collapsible: false, collapsedSize: 0 },
  ];
  it('clamps to both panels’ constraints and preserves the total', () => {
    expect(resizePair([30, 70], c, 0, 40)).toEqual([40, 60]);
    expect(resizePair([30, 70], c, 0, 90)).toEqual([60, 40]);
    expect(resizePair([30, 70], c, 0, 15)).toEqual([20, 80]);
    expect(resizePair([30, 70], c, 0, 0)).toEqual([0, 100]);
  });
});

describe('SplitPanel', () => {
  beforeEach(() => localStorage.clear());

  it('renders a separator with value semantics', () => {
    render(<Example />);
    const handle = screen.getByRole('separator', { name: 'Resize templates' });
    expect(handle).toHaveAttribute('aria-orientation', 'vertical');
    expect(handle).toHaveAttribute('aria-valuenow', '30');
    expect(handle).toHaveAttribute('aria-valuemin', '0');
    expect(handle).toHaveAttribute('aria-valuemax', '60');
    expect(handle).toHaveAttribute('aria-controls', 'templates');
    expect(screen.getByText('Templates')).toHaveAttribute('data-size', '30');
    expect(screen.getByText('Preview')).toHaveAttribute('data-size', '70');
  });

  it('resizes with arrow keys, Home/End and collapses with Enter', async () => {
    const onLayout = vi.fn();
    render(<Example onLayout={onLayout} />);
    const user = userEvent.setup();
    const handle = screen.getByRole('separator');
    handle.focus();
    await user.keyboard('{ArrowRight}');
    expect(handle).toHaveAttribute('aria-valuenow', '35');
    expect(onLayout).toHaveBeenLastCalledWith([35, 65]);
    await user.keyboard('{Shift>}{ArrowLeft}{/Shift}');
    expect(handle).toHaveAttribute('aria-valuenow', '25');
    await user.keyboard('{End}');
    expect(handle).toHaveAttribute('aria-valuenow', '60');
    await user.keyboard('{Enter}');
    expect(handle).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getByText('Templates', { selector: '[data-collapsed]' })).toBeTruthy();
    await user.keyboard('{Enter}');
    expect(handle).toHaveAttribute('aria-valuenow', '60');
  });

  it('uses Up/Down for vertical groups', async () => {
    render(<Example orientation="vertical" />);
    const handle = screen.getByRole('separator');
    expect(handle).toHaveAttribute('aria-orientation', 'horizontal');
    handle.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(handle).toHaveAttribute('aria-valuenow', '35');
  });

  it('resizes by pointer drag', () => {
    render(<Example />);
    const group = screen.getByText('Templates').parentElement!;
    group.getBoundingClientRect = () => ({
      width: 1000,
      height: 300,
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 1000,
      bottom: 300,
      toJSON() {},
    });
    const handle = screen.getByRole('separator');
    fireEvent.pointerDown(handle, { clientX: 300, button: 0, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 400, pointerId: 1 });
    fireEvent.pointerUp(handle, { clientX: 400, pointerId: 1 });
    expect(handle).toHaveAttribute('aria-valuenow', '40');
  });

  it('persists and restores with autoSaveId', async () => {
    const { unmount } = render(<Example autoSaveId="signature-editor" />);
    screen.getByRole('separator').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(JSON.parse(localStorage.getItem('stance-split-panel:signature-editor')!)).toEqual([
      35, 65,
    ]);
    unmount();
    render(<Example autoSaveId="signature-editor" />);
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '35');
  });

  it('throws outside SplitPanel', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<ResizablePanel>Lonely</ResizablePanel>)).toThrow(/SplitPanel/);
    spy.mockRestore();
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

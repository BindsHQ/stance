import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { CanvasSplitView, useCanvasSplitView } from './CanvasSplitView';

const conversation = <p>Messages</p>;
const canvas = <p>Document</p>;

function CloseCanvas() {
  const { setCanvasOpen, narrow } = useCanvasSplitView();
  return (
    <button type="button" data-narrow={narrow} onClick={() => setCanvasOpen(false)}>
      Close canvas
    </button>
  );
}

describe('CanvasSplitView', () => {
  it('renders two labelled regions with a separator on a wide view', () => {
    render(<CanvasSplitView conversation={conversation} canvas={canvas} />);
    expect(screen.getByRole('region', { name: 'Conversation' })).toHaveTextContent('Messages');
    expect(screen.getByRole('region', { name: 'Canvas' })).toHaveTextContent('Document');
    const divider = screen.getByRole('separator', { name: 'Resize conversation and canvas' });
    expect(divider).toHaveAttribute('aria-valuenow', '40');
    expect(divider).toHaveAttribute('aria-valuemin', '25');
    expect(divider).toHaveAttribute('aria-valuemax', '70');
    expect(screen.queryByRole('tablist')).toBeNull();
  });

  it('resizes with the arrow keys within the minimums', async () => {
    const user = userEvent.setup();
    render(
      <CanvasSplitView
        conversation={conversation}
        canvas={canvas}
        defaultRatio={0.5}
        minConversation={40}
        minCanvas={40}
      />,
    );
    const divider = screen.getByRole('separator');
    expect(divider).toHaveAttribute('aria-valuenow', '50');
    divider.focus();
    await user.keyboard('{ArrowRight}');
    expect(divider).toHaveAttribute('aria-valuenow', '55');
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(divider).toHaveAttribute('aria-valuenow', '60');
    await user.keyboard('{Home}');
    expect(divider).toHaveAttribute('aria-valuenow', '40');
  });

  it('mirrors the arrow keys in right to left', async () => {
    const user = userEvent.setup();
    render(
      <div dir="rtl">
        <CanvasSplitView conversation={conversation} canvas={canvas} />
      </div>,
    );
    const divider = screen.getByRole('separator');
    divider.focus();
    await user.keyboard('{ArrowLeft}');
    expect(divider).toHaveAttribute('aria-valuenow', '45');
  });

  it('shows only the conversation when the canvas is closed or missing', () => {
    const { rerender } = render(
      <CanvasSplitView conversation={conversation} canvas={canvas} canvasOpen={false} />,
    );
    expect(screen.getByRole('region', { name: 'Conversation' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Canvas' })).toBeNull();
    expect(screen.queryByRole('separator')).toBeNull();
    expect(screen.queryByText('Document')).toBeNull();
    rerender(<CanvasSplitView conversation={conversation} />);
    expect(screen.queryByRole('separator')).toBeNull();
  });

  it('replaces the divider with a tab switch on a narrow view', async () => {
    const user = userEvent.setup();
    const onNarrowViewChange = vi.fn();
    render(
      <CanvasSplitView
        narrow
        conversation={conversation}
        canvas={canvas}
        onNarrowViewChange={onNarrowViewChange}
      />,
    );
    expect(screen.queryByRole('separator')).toBeNull();
    const list = screen.getByRole('tablist', { name: 'View' });
    expect(within(list).getByRole('tab', { name: 'Conversation' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tabpanel', { name: 'Conversation' })).toHaveTextContent('Messages');
    // The hidden side stays mounted so drafts and scroll positions survive the switch.
    expect(screen.getByText('Document')).not.toBeVisible();
    await user.click(within(list).getByRole('tab', { name: 'Canvas' }));
    expect(onNarrowViewChange).toHaveBeenCalledWith('canvas');
    expect(screen.getByRole('tabpanel', { name: 'Canvas' })).toHaveTextContent('Document');
    expect(screen.getByText('Messages')).not.toBeVisible();
    await user.keyboard('{ArrowLeft}');
    expect(within(list).getByRole('tab', { name: 'Conversation' })).toHaveFocus();
    expect(onNarrowViewChange).toHaveBeenLastCalledWith('conversation');
  });

  it('respects a controlled narrow view and defaultNarrowView', async () => {
    const onNarrowViewChange = vi.fn();
    const { rerender } = render(
      <CanvasSplitView
        narrow
        narrowView="canvas"
        onNarrowViewChange={onNarrowViewChange}
        conversation={conversation}
        canvas={canvas}
      />,
    );
    await userEvent.click(screen.getByRole('tab', { name: 'Conversation' }));
    expect(onNarrowViewChange).toHaveBeenCalledWith('conversation');
    expect(screen.getByRole('tab', { name: 'Canvas' })).toHaveAttribute('aria-selected', 'true');
    rerender(
      <CanvasSplitView
        key="2"
        narrow
        defaultNarrowView="canvas"
        conversation={conversation}
        canvas={canvas}
      />,
    );
    expect(screen.getByRole('tab', { name: 'Canvas' })).toHaveAttribute('aria-selected', 'true');
  });

  it('brings a canvas that opens on a narrow view to the front', () => {
    const { rerender } = render(
      <CanvasSplitView narrow conversation={conversation} canvas={canvas} canvasOpen={false} />,
    );
    expect(screen.queryByRole('tablist')).toBeNull();
    rerender(<CanvasSplitView narrow conversation={conversation} canvas={canvas} canvasOpen />);
    expect(screen.getByRole('tab', { name: 'Canvas' })).toHaveAttribute('aria-selected', 'true');
  });

  it('lets content close the canvas through the hook, uncontrolled', async () => {
    const onCanvasOpenChange = vi.fn();
    render(
      <CanvasSplitView
        conversation={conversation}
        canvas={<CloseCanvas />}
        onCanvasOpenChange={onCanvasOpenChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Close canvas' }));
    expect(onCanvasOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByRole('region', { name: 'Canvas' })).toBeNull();
  });

  it('keeps a controlled canvas open until the prop changes', async () => {
    const onCanvasOpenChange = vi.fn();
    render(
      <CanvasSplitView
        canvasOpen
        conversation={conversation}
        canvas={<CloseCanvas />}
        onCanvasOpenChange={onCanvasOpenChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Close canvas' }));
    expect(onCanvasOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole('region', { name: 'Canvas' })).toBeInTheDocument();
  });

  it('switches to the narrow layout when the view is measured below the breakpoint', () => {
    const width = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(500);
    const { container, rerender } = render(
      <CanvasSplitView conversation={conversation} canvas={canvas} />,
    );
    expect(container.firstElementChild).toHaveAttribute('data-layout', 'narrow');
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    rerender(<CanvasSplitView conversation={conversation} canvas={canvas} breakpoint={400} />);
    expect(container.firstElementChild).toHaveAttribute('data-layout', 'wide');
    width.mockRestore();
  });

  it('keeps the conversation mounted when the canvas opens and closes', async () => {
    const user = userEvent.setup();
    const draft = <input aria-label="Draft" />;
    for (const narrow of [false, true]) {
      const { rerender, unmount } = render(
        <CanvasSplitView narrow={narrow} conversation={draft} canvas={canvas} canvasOpen={false} />,
      );
      expect(screen.getByRole('region', { name: 'Conversation' })).toBeInTheDocument();
      await user.type(screen.getByRole('textbox', { name: 'Draft' }), 'Hello');
      rerender(<CanvasSplitView narrow={narrow} conversation={draft} canvas={canvas} canvasOpen />);
      expect(screen.getByRole('textbox', { name: 'Draft', hidden: true })).toHaveValue('Hello');
      if (!narrow) {
        expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '40');
        expect(screen.getByRole('region', { name: 'Canvas' })).toHaveAttribute('data-size', '60');
      }
      rerender(
        <CanvasSplitView narrow={narrow} conversation={draft} canvas={canvas} canvasOpen={false} />,
      );
      expect(screen.getByRole('textbox', { name: 'Draft' })).toHaveValue('Hello');
      unmount();
    }
  });

  it('throws when the hook is used outside the view', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<CloseCanvas />)).toThrow(/within <CanvasSplitView>/);
    spy.mockRestore();
  });

  it('uses translated labels', () => {
    render(
      <CanvasSplitView
        conversation={conversation}
        canvas={canvas}
        labels={{ conversation: 'Samtal', canvas: 'Arbetsyta', resize: 'Ändra storlek' }}
      />,
    );
    expect(screen.getByRole('region', { name: 'Samtal' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Arbetsyta' })).toBeInTheDocument();
    expect(screen.getByRole('separator', { name: 'Ändra storlek' })).toBeInTheDocument();
  });

  it('forwards the ref, className and props', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <CanvasSplitView
        ref={ref}
        conversation={conversation}
        canvas={canvas}
        className="mine"
        id="split"
      />,
    );
    expect(ref.current).toHaveClass('st-canvas-split-view', 'mine');
    expect(ref.current).toHaveAttribute('id', 'split');
    expect(ref.current).toHaveAttribute('data-layout', 'wide');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <CanvasSplitView conversation={conversation} canvas={canvas} />
        <CanvasSplitView
          narrow
          conversation={conversation}
          canvas={canvas}
          labels={{ views: 'Narrow view' }}
        />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

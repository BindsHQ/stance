import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { FilePreviewCard } from './FilePreviewCard';

describe('FilePreviewCard', () => {
  it('renders a named group with the kind and a formatted size', () => {
    render(<FilePreviewCard name="report.pdf" kind="pdf" size={2_400_000} meta="12 pages" />);
    const card = screen.getByRole('group', { name: 'report.pdf' });
    expect(card).toHaveAttribute('data-status', 'ready');
    expect(card).toHaveAttribute('data-kind', 'pdf');
    expect(card).toHaveTextContent('PDF');
    expect(card).toHaveTextContent('2.4 MB');
    expect(card).toHaveTextContent('12 pages');
    expect(card).not.toHaveAttribute('aria-busy');
  });

  it('formats sizes across units and accepts text', () => {
    const { rerender } = render(<FilePreviewCard name="a" size={820} />);
    expect(screen.getByRole('group')).toHaveTextContent('820 B');
    rerender(<FilePreviewCard name="a" size={15_300} />);
    expect(screen.getByRole('group')).toHaveTextContent('15.3 kB');
    rerender(<FilePreviewCard name="a" size={3_000_000_000} />);
    expect(screen.getByRole('group')).toHaveTextContent('3 GB');
    rerender(<FilePreviewCard name="a" size="about 2 MB" kindLabel="Spreadsheet" />);
    expect(screen.getByRole('group')).toHaveTextContent('Spreadsheet');
    expect(screen.getByRole('group')).toHaveTextContent('about 2 MB');
  });

  it('shows open and download actions that name the file', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const onDownload = vi.fn();
    render(<FilePreviewCard name="plan.md" onOpen={onOpen} onDownload={onDownload} />);
    await user.click(screen.getByRole('button', { name: 'Open plan.md' }));
    await user.click(screen.getByRole('button', { name: 'Download plan.md' }));
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it('reaches the actions with the keyboard', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(
      <FilePreviewCard
        name="plan.md"
        onOpen={onOpen}
        onDownload={() => {}}
        actions={<button type="button">Share</button>}
      />,
    );
    await user.tab();
    expect(screen.getByRole('button', { name: 'Open plan.md' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onOpen).toHaveBeenCalledTimes(1);
    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Share' })).toHaveFocus();
  });

  it('has no actions region without handlers', () => {
    render(<FilePreviewCard name="plan.md" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows progress while generating and disables the actions', () => {
    const { rerender } = render(
      <FilePreviewCard name="deck.pptx" status="generating" progress={40} onOpen={() => {}} />,
    );
    const card = screen.getByRole('group', { name: 'deck.pptx' });
    expect(card).toHaveAttribute('aria-busy', 'true');
    const bar = screen.getByRole('progressbar', { name: 'Generating' });
    expect(bar).toHaveAttribute('aria-valuenow', '40');
    expect(bar).toHaveAttribute('aria-valuetext', '40%');
    expect(screen.getByRole('button', { name: 'Open deck.pptx' })).toBeDisabled();
    rerender(<FilePreviewCard name="deck.pptx" status="generating" />);
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
    expect(screen.getByRole('progressbar')).toHaveAttribute('data-indeterminate', '');
    rerender(<FilePreviewCard name="deck.pptx" status="generating" progress={140} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('shows an error', () => {
    render(<FilePreviewCard name="deck.pptx" status="error" onDownload={() => {}} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not create this file');
    expect(screen.getByRole('button', { name: 'Download deck.pptx' })).toBeDisabled();
  });

  it('renders an image or a node as the thumbnail', () => {
    const { container, rerender } = render(
      <FilePreviewCard name="chart.png" kind="image" thumbnail="/chart.png" layout="tile" />,
    );
    expect(container.querySelector('img')).toHaveAttribute('src', '/chart.png');
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
    expect(screen.getByRole('group')).toHaveAttribute('data-layout', 'tile');
    rerender(<FilePreviewCard name="chart.png" thumbnail={<span data-testid="thumb" />} />);
    expect(screen.getByTestId('thumb')).toBeInTheDocument();
  });

  it('uses translated labels', () => {
    render(
      <FilePreviewCard
        name="rapport.pdf"
        kind="pdf"
        onOpen={() => {}}
        labels={{ open: (name) => `Öppna ${name}`, kind: { pdf: 'PDF-fil' } }}
      />,
    );
    expect(screen.getByRole('button', { name: 'Öppna rapport.pdf' })).toBeInTheDocument();
    expect(screen.getByRole('group')).toHaveTextContent('PDF-fil');
  });

  it('forwards the ref, className and props', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<FilePreviewCard ref={ref} name="a.txt" className="mine" id="file" />);
    expect(ref.current).toHaveClass('st-file-preview-card', 'mine');
    expect(ref.current).toHaveAttribute('id', 'file');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <FilePreviewCard name="report.pdf" kind="pdf" size={2400000} onOpen={() => {}} />
        <FilePreviewCard name="deck.pptx" status="generating" progress={30} />
        <FilePreviewCard name="data.csv" kind="data" status="error" onDownload={() => {}} />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

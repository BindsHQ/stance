import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { CitationChip } from './CitationChip';

const source = {
  title: 'Signature policy',
  url: 'https://example.com/policy',
  snippet: 'Every outgoing message carries the approved signature.',
};

describe('CitationChip', () => {
  afterEach(() => vi.useRealTimers());

  it('is a link named after the source that opens in a new tab', () => {
    render(<CitationChip index={2} source={source} />);
    const link = screen.getByRole('link', { name: 'Source 2: Signature policy' });
    expect(link).toHaveTextContent('2');
    expect(link).toHaveAttribute('href', source.url);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('prefers href over the source url, and is a button when there is neither', async () => {
    const onOpen = vi.fn();
    const { rerender } = render(<CitationChip index={1} source={source} href="/sources/1" />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/sources/1');
    const local = { title: 'Uploaded brief.pdf' };
    rerender(<CitationChip index={1} source={local} onOpen={onOpen} />);
    expect(screen.queryByRole('link')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Source 1: Uploaded brief.pdf' }));
    expect(onOpen).toHaveBeenCalledWith(local);
  });

  it('shows the preview on keyboard focus, describes the marker with it, and closes on Escape', async () => {
    const user = userEvent.setup();
    render(<CitationChip index={2} source={source} openDelay={0} />);
    await user.tab();
    const chip = screen.getByRole('link', { name: 'Source 2: Signature policy' });
    expect(chip).toHaveFocus();
    expect(screen.getByText(source.snippet)).toBeInTheDocument();
    expect(chip).toHaveAttribute('data-state', 'open');
    expect(chip).toHaveAccessibleDescription(/Every outgoing message/);
    await user.keyboard('{Escape}');
    expect(screen.queryByText(source.snippet)).toBeNull();
    expect(chip).toHaveFocus();
  });

  it('shows the preview on hover after the delay', () => {
    vi.useFakeTimers();
    render(<CitationChip index={2} source={source} openDelay={200} />);
    const chip = screen.getByRole('link');
    fireEvent.pointerEnter(chip, { pointerType: 'mouse' });
    expect(screen.queryByText(source.snippet)).toBeNull();
    act(() => vi.advanceTimersByTime(200));
    expect(screen.getByText(source.snippet)).toBeInTheDocument();
    fireEvent.pointerLeave(chip, { pointerType: 'mouse' });
    act(() => vi.advanceTimersByTime(200));
    expect(screen.queryByText(source.snippet)).toBeNull();
  });

  it('toggles the preview on a touch tap instead of following the link', () => {
    const onOpen = vi.fn();
    render(<CitationChip index={2} source={source} onOpen={onOpen} />);
    const chip = screen.getByRole('link', { name: 'Source 2: Signature policy' });
    fireEvent.pointerDown(chip, { pointerType: 'touch' });
    const first = fireEvent.click(chip);
    expect(first).toBe(false);
    expect(onOpen).not.toHaveBeenCalled();
    expect(screen.getByText(source.snippet)).toBeInTheDocument();
    // The preview holds the real link.
    const inner = screen.getByRole('link', { name: /^Signature policy/ });
    inner.addEventListener('click', (e) => e.preventDefault());
    fireEvent.click(inner);
    expect(onOpen).toHaveBeenCalledWith(source);
    fireEvent.pointerDown(chip, { pointerType: 'touch' });
    fireEvent.click(chip);
    expect(screen.queryByText(source.snippet)).toBeNull();
  });

  it('calls onOpen on a mouse or keyboard activation', async () => {
    const onOpen = vi.fn();
    render(<CitationChip index={3} source={source} onOpen={onOpen} />);
    const chip = screen.getByRole('link');
    const stop = (e: Event) => e.preventDefault();
    document.addEventListener('click', stop);
    await userEvent.click(chip);
    expect(onOpen).toHaveBeenCalledTimes(1);
    chip.focus();
    await userEvent.keyboard('{Enter}');
    expect(onOpen).toHaveBeenCalledTimes(2);
    document.removeEventListener('click', stop);
  });

  it('supports a controlled preview, no preview, custom labels, className and ref', async () => {
    const onPreviewOpenChange = vi.fn();
    const ref = React.createRef<HTMLElement>();
    const { rerender } = render(
      <CitationChip
        ref={ref}
        index={4}
        source={source}
        previewOpen
        onPreviewOpenChange={onPreviewOpenChange}
        labels={{ source: (i, t) => `Vir ${i}: ${t}` }}
        className="custom"
      />,
    );
    const chip = screen.getByRole('link', { name: 'Vir 4: Signature policy' });
    expect(ref.current).toBe(chip);
    expect(chip).toHaveClass('st-citation-chip', 'custom');
    expect(screen.getByText(source.snippet)).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(onPreviewOpenChange).toHaveBeenCalledWith(false);
    rerender(<CitationChip index={4} source={source} preview={false} />);
    await userEvent.tab();
    expect(screen.queryByText(source.snippet)).toBeNull();
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <p>
          Signatures are applied on send
          <CitationChip index={1} source={source} previewOpen />
          <CitationChip index={2} source={{ title: 'Local note' }} />.
        </p>
      </div>,
    );
    await expectNoA11yViolations(document.body);
    expect(container).toBeInTheDocument();
  });
});

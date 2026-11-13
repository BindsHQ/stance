import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { GeneratedImage } from './GeneratedImage';

const announcer = (container: HTMLElement) => container.querySelector('[data-st-announcer]')!;
const variations = [
  { id: 'a', src: '/a.png', alt: 'A red kite over hills' },
  { id: 'b', src: '/b.png', alt: 'A blue kite over the sea' },
  { id: 'c', src: '/c.png', alt: 'A green kite over a field' },
];

describe('GeneratedImage', () => {
  it('renders the image with its alt text', () => {
    render(<GeneratedImage src="/kite.png" alt="A red kite over hills" />);
    const img = screen.getByRole('img', { name: 'A red kite over hills' });
    expect(img).toHaveAttribute('src', '/kite.png');
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('is a progressbar while generating, with and without a value', () => {
    const { rerender } = render(<GeneratedImage alt="A kite" status="generating" />);
    const bar = screen.getByRole('progressbar', { name: 'Generating image' });
    expect(bar).not.toHaveAttribute('aria-valuenow');
    expect(bar).toHaveAttribute('aria-valuetext', 'Generating image');
    expect(screen.queryByRole('img')).toBeNull();
    rerender(<GeneratedImage alt="A kite" status="generating" progress={41.6} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '42');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '42%');
    expect(screen.getByText('42%')).toBeVisible();
  });

  it('shows a partial preview while generating when a src is given', () => {
    render(<GeneratedImage src="/partial.png" alt="A kite" status="generating" progress={60} />);
    expect(screen.getByRole('img', { name: 'A kite' })).toHaveAttribute('data-partial');
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('announces ready and error once, and not on first render', () => {
    const { container, rerender } = render(<GeneratedImage alt="A kite" status="generating" />);
    expect(announcer(container)).toBeEmptyDOMElement();
    rerender(<GeneratedImage src="/kite.png" alt="A kite" status="ready" />);
    expect(announcer(container)).toHaveTextContent('Image ready');
    rerender(<GeneratedImage alt="A kite" status="error" />);
    expect(announcer(container)).toHaveTextContent('Could not create this image');
    expect(container.querySelector('.st-generated-image__error')).toHaveTextContent(
      'Could not create this image',
    );
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('offers variations as a radio group and shows the selected one', async () => {
    const onSelect = vi.fn();
    render(<GeneratedImage alt="A kite" variations={variations} onSelect={onSelect} />);
    const group = screen.getByRole('radiogroup', { name: 'Variations' });
    expect(group).toBeInTheDocument();
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);
    expect(radios[0]).toBeChecked();
    expect(radios[1]).toHaveAccessibleName('Variation 2 of 3: A blue kite over the sea');
    expect(screen.getByRole('img', { name: 'A red kite over hills' })).toHaveAttribute(
      'src',
      '/a.png',
    );
    await userEvent.click(radios[1]!);
    expect(onSelect).toHaveBeenCalledWith('b');
    expect(radios[1]).toBeChecked();
    expect(screen.getByRole('img', { name: 'A blue kite over the sea' })).toHaveAttribute(
      'src',
      '/b.png',
    );
  });

  it('moves between variations with arrow keys, Home and End', async () => {
    const user = userEvent.setup();
    render(<GeneratedImage alt="A kite" variations={variations} />);
    const radios = screen.getAllByRole('radio');
    await user.tab();
    expect(radios[0]).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(radios[1]).toHaveFocus();
    expect(radios[1]).toBeChecked();
    await user.keyboard('{End}');
    expect(radios[2]).toBeChecked();
    await user.keyboard('{ArrowRight}');
    expect(radios[0]).toBeChecked();
    await user.keyboard('{ArrowLeft}');
    expect(radios[2]).toHaveFocus();
    await user.keyboard('{Home}');
    expect(radios[0]).toHaveFocus();
    expect(radios.map((r) => r.tabIndex)).toEqual([0, -1, -1]);
  });

  it('mirrors the arrow keys in right to left', async () => {
    const user = userEvent.setup();
    render(
      <div dir="rtl">
        <GeneratedImage alt="A kite" variations={variations} />
      </div>,
    );
    await user.tab();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getAllByRole('radio')[1]).toBeChecked();
  });

  it('supports a controlled selection', async () => {
    const onSelect = vi.fn();
    const { rerender } = render(
      <GeneratedImage alt="A kite" variations={variations} selectedId="b" onSelect={onSelect} />,
    );
    expect(screen.getAllByRole('radio')[1]).toBeChecked();
    await userEvent.click(screen.getAllByRole('radio')[2]!);
    expect(onSelect).toHaveBeenCalledWith('c');
    expect(screen.getAllByRole('radio')[1]).toBeChecked();
    rerender(
      <GeneratedImage alt="A kite" variations={variations} selectedId="c" onSelect={onSelect} />,
    );
    expect(screen.getAllByRole('radio')[2]).toBeChecked();
  });

  it('shows the prompt and only the actions that have handlers', async () => {
    const onDownload = vi.fn();
    const onRegenerate = vi.fn();
    const { rerender } = render(
      <GeneratedImage
        src="/kite.png"
        alt="A kite"
        prompt="A red kite over green hills"
        onDownload={onDownload}
        onRegenerate={onRegenerate}
      />,
    );
    expect(screen.getByText('Prompt')).toBeVisible();
    expect(screen.getByText(/A red kite over green hills/)).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(onDownload).toHaveBeenCalledWith('/kite.png');
    await userEvent.click(screen.getByRole('button', { name: 'Regenerate' }));
    expect(onRegenerate).toHaveBeenCalledTimes(1);
    rerender(
      <GeneratedImage
        alt="A kite"
        status="generating"
        onDownload={onDownload}
        onRegenerate={onRegenerate}
        onEdit={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: 'Download' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Regenerate' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled();
  });

  it('translates the built in strings', () => {
    render(
      <GeneratedImage
        alt="En drake"
        status="generating"
        progress={10}
        labels={{ generating: 'Skapar bild', progress: (v) => `${v} procent` }}
      />,
    );
    expect(screen.getByRole('progressbar', { name: 'Skapar bild' })).toHaveAttribute(
      'aria-valuetext',
      '10 procent',
    );
  });

  it('forwards the ref, className, aspect ratio and props', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <GeneratedImage
        ref={ref}
        className="mine"
        id="art"
        src="/kite.png"
        alt="A kite"
        aspectRatio="16 / 9"
      />,
    );
    expect(ref.current?.tagName).toBe('FIGURE');
    expect(ref.current).toHaveClass('st-generated-image', 'mine');
    expect(ref.current).toHaveAttribute('id', 'art');
    expect(ref.current).toHaveAttribute('data-status', 'ready');
    expect(ref.current?.style.getPropertyValue('--st-generated-image-ratio')).toBe('16 / 9');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <GeneratedImage
          src="/kite.png"
          alt="A red kite over hills"
          variations={variations}
          prompt="A red kite"
          onDownload={() => {}}
          onRegenerate={() => {}}
          onEdit={() => {}}
        />
        <GeneratedImage alt="A kite" status="generating" progress={30} />
        <GeneratedImage alt="A kite" status="error" />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

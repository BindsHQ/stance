import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { AttachmentTray, type AttachmentItem } from './AttachmentTray';

const items: AttachmentItem[] = [
  { id: 'a', name: 'contract.pdf', kind: 'file', size: 482_000 },
  {
    id: 'b',
    name: 'whiteboard.png',
    kind: 'image',
    previewUrl: '/whiteboard.png',
    size: 2_400_000,
  },
  { id: 'c', name: 'notes.txt', kind: 'file', size: 900 },
];

describe('AttachmentTray', () => {
  it('renders a labelled list with names and formatted sizes', () => {
    render(<AttachmentTray items={items} onRemove={() => {}} />);
    const list = screen.getByRole('list', { name: 'Attachments' });
    const rows = within(list).getAllByRole('listitem');
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent('contract.pdf');
    expect(rows[0]).toHaveTextContent('471 KB');
    expect(rows[1]).toHaveTextContent('2.3 MB');
    expect(rows[2]).toHaveTextContent('900 B');
  });

  it('shows a decorative thumbnail for images and an icon for files', () => {
    const { container } = render(<AttachmentTray items={items} />);
    const image = container.querySelector('img')!;
    expect(image).toHaveAttribute('src', '/whiteboard.png');
    expect(image).toHaveAttribute('alt', '');
    expect(container.querySelector('[data-kind="file"] [data-icon="file"]')).not.toBeNull();
  });

  it('renders nothing visible when there are no items', () => {
    render(<AttachmentTray items={[]} />);
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('names each remove button after its file and reports the id', async () => {
    const onRemove = vi.fn();
    render(<AttachmentTray items={items} onRemove={onRemove} />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove whiteboard.png' }));
    expect(onRemove).toHaveBeenCalledWith('b');
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('hides remove buttons when read only or when there is no handler', () => {
    const { rerender } = render(<AttachmentTray items={items} onRemove={() => {}} readOnly />);
    expect(screen.queryByRole('button')).toBeNull();
    rerender(<AttachmentTray items={items} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('moves focus to the next remove button after a removal, then to the list', async () => {
    const user = userEvent.setup();
    function Stateful() {
      const [list, setList] = React.useState(items.slice(0, 2));
      return (
        <AttachmentTray
          items={list}
          onRemove={(id) => setList((current) => current.filter((item) => item.id !== id))}
        />
      );
    }
    render(<Stateful />);
    const first = screen.getByRole('button', { name: 'Remove contract.pdf' });
    first.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Remove whiteboard.png' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('shows upload progress as a progressbar named for the file', () => {
    const { rerender } = render(
      <AttachmentTray items={[{ id: 'a', name: 'contract.pdf', kind: 'file', progress: 0.42 }]} />,
    );
    const bar = screen.getByRole('progressbar', { name: 'Uploading contract.pdf' });
    expect(bar).toHaveAttribute('aria-valuenow', '42');
    expect(bar).toHaveAttribute('aria-valuetext', '42%');
    expect(screen.getByRole('listitem')).toHaveAttribute('data-state', 'uploading');
    rerender(
      <AttachmentTray
        items={[{ id: 'a', name: 'contract.pdf', kind: 'file', progress: 1, size: 2048 }]}
      />,
    );
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.getByRole('listitem')).toHaveTextContent('2 KB');
  });

  it('shows an error on the item and announces it once', () => {
    const base: AttachmentItem = { id: 'a', name: 'contract.pdf', kind: 'file', progress: 0.5 };
    const { rerender } = render(<AttachmentTray items={[base]} />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('');
    const failed = { ...base, error: 'The file is larger than 20 MB.' };
    rerender(<AttachmentTray items={[failed]} />);
    expect(screen.getByRole('listitem')).toHaveAttribute('data-state', 'error');
    expect(screen.getByRole('listitem')).toHaveTextContent('The file is larger than 20 MB.');
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(status).toHaveTextContent(
      'contract.pdf could not be attached. The file is larger than 20 MB.',
    );
    const announced = status.textContent;
    rerender(<AttachmentTray items={[{ ...failed }]} />);
    expect(status.textContent).toBe(announced);
  });

  it('does not announce errors that are present on first render', () => {
    render(
      <AttachmentTray items={[{ id: 'a', name: 'a.pdf', kind: 'file', error: 'Too large.' }]} />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('');
    expect(screen.getByText('Too large.')).toBeInTheDocument();
  });

  it('uses custom labels and size format', () => {
    render(
      <AttachmentTray
        items={items.slice(0, 1)}
        onRemove={() => {}}
        formatSize={(bytes) => `${bytes} bytes`}
        labels={{ list: 'Anhänge', remove: (name) => `${name} entfernen` }}
      />,
    );
    expect(screen.getByRole('list', { name: 'Anhänge' })).toHaveTextContent('482000 bytes');
    expect(screen.getByRole('button', { name: 'contract.pdf entfernen' })).toBeInTheDocument();
  });

  it('forwards ref, className and rest props to the list', () => {
    const ref = React.createRef<HTMLUListElement>();
    render(<AttachmentTray ref={ref} items={items} className="mine" data-testid="tray" />);
    expect(ref.current).toBe(screen.getByTestId('tray'));
    expect(ref.current).toHaveClass('st-attachment-tray', 'mine');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <AttachmentTray
          items={[
            ...items,
            { id: 'd', name: 'scan.pdf', kind: 'file', progress: 0.3 },
            { id: 'e', name: 'huge.mov', kind: 'file', error: 'The file is too large.' },
          ]}
          onRemove={() => {}}
        />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

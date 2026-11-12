import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { MentionPicker, type MentionItem, type MentionPickerProps } from './MentionPicker';

const items: MentionItem[] = [
  {
    id: 'msa',
    label: 'Master services agreement',
    description: 'contracts/msa.pdf',
    group: 'Files',
  },
  { id: 'nda', label: 'Mutual NDA', description: 'contracts/nda.pdf', group: 'Files' },
  { id: 'priya', label: 'Priya Nair', description: 'Legal counsel', group: 'People' },
  { id: 'search', label: 'Web search', group: 'Tools' },
];

function Harness(
  props: Partial<MentionPickerProps> & { initialOpen?: boolean; ref?: React.Ref<HTMLDivElement> },
) {
  const { initialOpen = true, onOpenChange, ...rest } = props;
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const [open, setOpen] = React.useState(initialOpen);
  const [active, setActive] = React.useState<string | undefined>(undefined);
  return (
    <>
      <textarea
        ref={ref}
        aria-label="Message"
        aria-haspopup="listbox"
        aria-controls={open ? 'mentions' : undefined}
        aria-activedescendant={active}
      />
      <button type="button">Elsewhere</button>
      <MentionPicker
        id="mentions"
        {...rest}
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          onOpenChange?.(next);
        }}
        anchor={ref}
        items={items}
        onActiveDescendantChange={setActive}
      />
    </>
  );
}

describe('MentionPicker', () => {
  it('renders nothing while closed', () => {
    render(<Harness initialOpen={false} />);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('shows a labelled listbox with grouped options and the first one active', () => {
    render(<Harness />);
    const listbox = screen.getByRole('listbox', { name: 'Mentions' });
    expect(listbox).toHaveAttribute('id', 'mentions');
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(4);
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(options[1]).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('group', { name: 'Files' })).toContainElement(options[1]!);
    expect(screen.getByRole('group', { name: 'People' })).toBeInTheDocument();
  });

  it('reports the active option for aria-activedescendant and moves with the arrow keys', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByRole('textbox', { name: 'Message' });
    input.focus();
    const options = screen.getAllByRole('option');
    expect(input).toHaveAttribute('aria-activedescendant', options[0]!.id);
    await user.keyboard('{ArrowDown}');
    expect(input).toHaveAttribute('aria-activedescendant', options[1]!.id);
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(input).toHaveAttribute('aria-activedescendant', options[3]!.id);
    await user.keyboard('{ArrowDown}');
    expect(input).toHaveAttribute('aria-activedescendant', options[0]!.id);
    await user.keyboard('{End}');
    expect(options[3]).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Home}');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(input).toHaveFocus();
  });

  it('selects the active option with Enter and with Tab', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<Harness onSelect={onSelect} />);
    screen.getByRole('textbox').focus();
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onSelect).toHaveBeenLastCalledWith(items[1]);
    await user.keyboard('{ArrowDown}{Tab}');
    expect(onSelect).toHaveBeenLastCalledWith(items[2]);
    expect(screen.getByRole('textbox')).toHaveFocus();
  });

  it('selects on click without taking focus from the text area', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<Harness onSelect={onSelect} />);
    const input = screen.getByRole('textbox');
    input.focus();
    await user.click(screen.getByRole('option', { name: /Priya Nair/ }));
    expect(onSelect).toHaveBeenCalledWith(items[2]);
    expect(input).toHaveFocus();
  });

  it('closes with Escape and on an outside press', async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    const { unmount } = render(<Harness onOpenChange={onOpenChange} />);
    screen.getByRole('textbox').focus();
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-activedescendant');
    unmount();

    render(<Harness onOpenChange={onOpenChange} />);
    await act(() => new Promise((resolve) => setTimeout(resolve, 5)));
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }));
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('filters by query on label and description, ignoring case', () => {
    const { rerender } = render(<Harness query="NDA" />);
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('option', { name: /Mutual NDA/ })).toBeInTheDocument();
    rerender(<Harness query="contracts/" />);
    expect(screen.getAllByRole('option')).toHaveLength(2);
    rerender(<Harness query="legal" />);
    expect(screen.getByRole('option', { name: /Priya Nair/ })).toBeInTheDocument();
  });

  it('resets to the first option when the results change', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Harness />);
    screen.getByRole('textbox').focus();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    rerender(<Harness query="m" />);
    expect(screen.getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('shows the empty label and lets Enter through when nothing matches', async () => {
    const onSelect = vi.fn();
    const onKeyDown = vi.fn();
    render(
      <div onKeyDown={(event) => onKeyDown(event.defaultPrevented)}>
        <Harness query="zzz" onSelect={onSelect} emptyLabel="Nothing found" />
      </div>,
    );
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(screen.getByRole('status', { name: 'Mentions' })).toHaveTextContent('Nothing found');
    screen.getByRole('textbox').focus();
    await userEvent.keyboard('{Enter}');
    expect(onSelect).not.toHaveBeenCalled();
    expect(onKeyDown).toHaveBeenCalledWith(false);
  });

  it('shows a loading status and skips filtering when filter is false', () => {
    const { rerender } = render(<Harness loading loadingLabel="Searching files" />);
    expect(screen.getByRole('status')).toHaveTextContent('Searching files');
    expect(screen.queryByRole('option')).toBeNull();
    rerender(<Harness query="zzz" filter={false} />);
    expect(screen.getAllByRole('option')).toHaveLength(4);
  });

  it('claims Enter before a React handler on the anchor sees it', async () => {
    const seen: boolean[] = [];
    function Owner() {
      const ref = React.useRef<HTMLTextAreaElement>(null);
      return (
        <>
          <textarea
            ref={ref}
            aria-label="Message"
            onKeyDown={(event) => seen.push(event.defaultPrevented)}
          />
          <MentionPicker open anchor={ref} items={items} />
        </>
      );
    }
    render(<Owner />);
    screen.getByRole('textbox').focus();
    await userEvent.keyboard('{Enter}');
    expect(seen).toEqual([true]);
  });

  it('passes className, ref and rest props to the popup', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Harness ref={ref} className="mine" data-testid="popup" label="Reference" />);
    expect(ref.current).toBe(screen.getByTestId('popup'));
    expect(ref.current).toHaveClass('st-mention-picker', 'st-prompt-listbox', 'mine');
    expect(screen.getByRole('listbox', { name: 'Reference' })).toBeInTheDocument();
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { baseElement } = render(
      <div data-theme={theme}>
        <Harness />
      </div>,
    );
    await expectNoA11yViolations(baseElement);
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import {
  SlashCommandMenu,
  type SlashCommand,
  type SlashCommandMenuProps,
} from './SlashCommandMenu';

const commands: SlashCommand[] = [
  { id: 'summarise', name: 'summarise', description: 'Shorten the selected document' },
  { id: 'translate', name: 'translate', description: 'Translate into another language' },
  { id: 'clear', name: 'clear', description: 'Start a new conversation', shortcut: ['mod', 'k'] },
];

function Harness(props: Partial<SlashCommandMenuProps> & { ref?: React.Ref<HTMLDivElement> }) {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const [open, setOpen] = React.useState(true);
  const [active, setActive] = React.useState<string | undefined>(undefined);
  return (
    <>
      <textarea
        ref={ref}
        aria-label="Message"
        aria-haspopup="listbox"
        aria-controls={open ? 'commands' : undefined}
        aria-activedescendant={active}
      />
      <SlashCommandMenu
        id="commands"
        open={open}
        onOpenChange={setOpen}
        anchor={ref}
        commands={commands}
        onActiveDescendantChange={setActive}
        {...props}
      />
    </>
  );
}

describe('SlashCommandMenu', () => {
  it('renders nothing while closed', () => {
    render(<Harness open={false} />);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('lists commands in a labelled listbox with descriptions and shortcuts', () => {
    render(<Harness />);
    expect(screen.getByRole('listbox', { name: 'Commands' })).toHaveAttribute('id', 'commands');
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent('summarise');
    expect(options[0]).toHaveTextContent('Shorten the selected document');
    expect(options[2]!.querySelector('kbd')).not.toBeNull();
  });

  it('filters by the query and ignores a leading slash', () => {
    const { rerender } = render(<Harness query="/tr" />);
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('option', { name: /translate/ })).toBeInTheDocument();
    rerender(<Harness query="conversation" />);
    expect(screen.getByRole('option', { name: /clear/ })).toBeInTheDocument();
    rerender(<Harness query="/" />);
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('navigates with the keyboard and selects with Enter while focus stays put', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<Harness onSelect={onSelect} />);
    const input = screen.getByRole('textbox');
    input.focus();
    const options = screen.getAllByRole('option');
    expect(input).toHaveAttribute('aria-activedescendant', options[0]!.id);
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(input).toHaveAttribute('aria-activedescendant', options[2]!.id);
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith(commands[2]);
    expect(input).toHaveFocus();
  });

  it('selects on click', async () => {
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('option', { name: /translate/ }));
    expect(onSelect).toHaveBeenCalledWith(commands[1]);
  });

  it('closes with Escape', async () => {
    render(<Harness />);
    screen.getByRole('textbox').focus();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('shows the empty and loading labels', () => {
    const { rerender } = render(<Harness query="/zzz" />);
    expect(screen.getByRole('status', { name: 'Commands' })).toHaveTextContent('No commands');
    rerender(<Harness loading />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    rerender(<Harness query="/zzz" filter={false} emptyLabel="Nothing" />);
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('passes className and ref to the popup', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Harness ref={ref} className="mine" />);
    expect(ref.current).toHaveClass('st-slash-command-menu', 'st-prompt-listbox', 'mine');
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

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { FeedbackBar, type FeedbackValue } from './FeedbackBar';

const reasons = [
  { id: 'wrong', label: 'Not accurate' },
  { id: 'long', label: 'Too long' },
  { id: 'tone', label: 'Wrong tone' },
];
const bar = () => document.querySelector('.st-feedback-bar')!;

describe('FeedbackBar', () => {
  it('starts idle with two unpressed toggle buttons in a named group', () => {
    render(<FeedbackBar />);
    const group = screen.getByRole('group', { name: 'Rate this response' });
    const up = within(group).getByRole('button', { name: 'Good response' });
    const down = within(group).getByRole('button', { name: 'Bad response' });
    expect(up).toHaveAttribute('aria-pressed', 'false');
    expect(down).toHaveAttribute('aria-pressed', 'false');
    expect(bar()).toHaveAttribute('data-state', 'idle');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('opens the detail step after a rating, with labelled reasons and a labelled comment', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<FeedbackBar reasons={reasons} onValueChange={onValueChange} />);
    await user.click(screen.getByRole('button', { name: 'Bad response' }));
    expect(onValueChange).toHaveBeenCalledWith('down');
    expect(screen.getByRole('button', { name: 'Bad response' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(bar()).toHaveAttribute('data-state', 'detail');
    const group = screen.getByRole('group', { name: 'What went wrong?' });
    const chips = within(group).getAllByRole('button');
    expect(chips.map((c) => c.textContent)).toEqual(['Not accurate', 'Too long', 'Wrong tone']);
    expect(chips[0]).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('textbox', { name: 'Anything else? (optional)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send feedback' })).toBeEnabled();
  });

  it('asks a different question after a good rating', async () => {
    render(<FeedbackBar reasons={reasons} />);
    await userEvent.click(screen.getByRole('button', { name: 'Good response' }));
    expect(screen.getByRole('group', { name: 'What did you like?' })).toBeInTheDocument();
  });

  it('submits the rating, chosen reasons and trimmed comment, then thanks once and keeps focus', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<FeedbackBar reasons={reasons} onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: 'Bad response' }));
    await user.click(screen.getByRole('button', { name: 'Not accurate' }));
    await user.click(screen.getByRole('button', { name: 'Wrong tone' }));
    await user.click(screen.getByRole('button', { name: 'Wrong tone' }));
    await user.click(screen.getByRole('button', { name: 'Too long' }));
    expect(screen.getByRole('button', { name: 'Not accurate' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.type(screen.getByRole('textbox'), '  The date is wrong. ');
    await user.click(screen.getByRole('button', { name: 'Send feedback' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      value: 'down',
      reasons: ['wrong', 'long'],
      comment: 'The date is wrong.',
    });
    expect(bar()).toHaveAttribute('data-state', 'submitted');
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('Thanks for your feedback.');
    expect(screen.getAllByText(/Thanks for your feedback\./)).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Bad response' })).toHaveFocus();
  });

  it('submits with the keyboard from the comment field form', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<FeedbackBar onSubmit={onSubmit} />);
    await user.tab();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('group', { name: 'What did you like?' })).toBeInTheDocument();
    await user.tab();
    await user.tab();
    expect(screen.getByRole('textbox')).toHaveFocus();
    await user.keyboard('Clear and short');
    await user.tab();
    expect(screen.getByRole('button', { name: 'Send feedback' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenCalledWith({ value: 'up', reasons: [], comment: 'Clear and short' });
  });

  it('skip sends the rating without details', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<FeedbackBar reasons={reasons} onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: 'Good response' }));
    await user.click(screen.getByRole('button', { name: 'Not accurate' }));
    await user.click(screen.getByRole('button', { name: 'Skip' }));
    expect(onSubmit).toHaveBeenCalledWith({ value: 'up', reasons: [], comment: '' });
    expect(bar()).toHaveAttribute('data-state', 'submitted');
  });

  it('submits straight away when there is nothing more to ask', async () => {
    const onSubmit = vi.fn();
    render(<FeedbackBar allowComment={false} onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: 'Good response' }));
    expect(onSubmit).toHaveBeenCalledWith({ value: 'up', reasons: [], comment: '' });
    expect(bar()).toHaveAttribute('data-state', 'submitted');
    expect(screen.queryByRole('button', { name: 'Send feedback' })).toBeNull();
  });

  it('asks for details only for the ratings named by detailFor', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<FeedbackBar reasons={reasons} detailFor="down" onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: 'Good response' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('textbox')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Bad response' }));
    expect(screen.getByRole('group', { name: 'What went wrong?' })).toBeInTheDocument();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('clears the rating when the pressed thumb is chosen again', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<FeedbackBar reasons={reasons} onValueChange={onValueChange} />);
    const down = screen.getByRole('button', { name: 'Bad response' });
    await user.click(down);
    await user.click(down);
    expect(onValueChange).toHaveBeenLastCalledWith(null);
    expect(down).toHaveAttribute('aria-pressed', 'false');
    expect(bar()).toHaveAttribute('data-state', 'idle');
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('shows a default rating as rated, without opening the detail step', () => {
    render(<FeedbackBar defaultValue="up" reasons={reasons} />);
    expect(bar()).toHaveAttribute('data-state', 'rated');
    expect(screen.getByRole('button', { name: 'Good response' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('works controlled and returns to idle when the value is cleared outside', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = React.useState<FeedbackValue>(null);
      return (
        <>
          <FeedbackBar value={value} onValueChange={setValue} reasons={reasons} />
          <button type="button" onClick={() => setValue(null)}>
            Reset
          </button>
        </>
      );
    }
    render(<Controlled />);
    await user.click(screen.getByRole('button', { name: 'Good response' }));
    expect(bar()).toHaveAttribute('data-state', 'detail');
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(bar()).toHaveAttribute('data-state', 'idle');
    expect(screen.getByRole('button', { name: 'Good response' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('does not change a controlled value on its own', async () => {
    const onValueChange = vi.fn();
    render(<FeedbackBar value="up" onValueChange={onValueChange} allowComment={false} />);
    await userEvent.click(screen.getByRole('button', { name: 'Bad response' }));
    expect(onValueChange).toHaveBeenCalledWith('down');
    expect(screen.getByRole('button', { name: 'Good response' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('supports disabled, a prompt, translated labels, className and ref', async () => {
    const onValueChange = vi.fn();
    const ref = React.createRef<HTMLDivElement>();
    render(
      <FeedbackBar
        ref={ref}
        disabled
        prompt="Was this helpful?"
        className="custom"
        onValueChange={onValueChange}
        labels={{ up: 'Dober odgovor', group: 'Ocenite odgovor' }}
      />,
    );
    expect(ref.current).toBe(bar());
    expect(bar()).toHaveClass('custom');
    expect(screen.getByText('Was this helpful?')).toBeInTheDocument();
    const up = screen.getByRole('button', { name: 'Dober odgovor' });
    expect(up).toBeDisabled();
    await userEvent.click(up);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole('group', { name: 'Ocenite odgovor' })).toBeInTheDocument();
  });

  it.each(THEMES)('has no axe violations in %s (idle, detail, submitted)', async (theme) => {
    const user = userEvent.setup();
    const { container } = render(
      <div data-theme={theme}>
        <FeedbackBar />
        <FeedbackBar reasons={reasons} labels={{ group: 'Rate the second response' }} />
        <FeedbackBar allowComment={false} labels={{ group: 'Rate the third response' }} />
      </div>,
    );
    await user.click(screen.getAllByRole('button', { name: 'Bad response' })[1]!);
    await user.click(screen.getAllByRole('button', { name: 'Good response' })[2]!);
    await expectNoA11yViolations(container);
  });
});

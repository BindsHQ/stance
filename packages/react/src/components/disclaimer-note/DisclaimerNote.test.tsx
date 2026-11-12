import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { Icon } from '../../icons/Icon';
import { DisclaimerNote } from './DisclaimerNote';

describe('DisclaimerNote', () => {
  it('is a note with the text and a decorative info icon by default', () => {
    render(<DisclaimerNote>AI can make mistakes. Check important facts.</DisclaimerNote>);
    const note = screen.getByRole('note');
    expect(note).toHaveTextContent('AI can make mistakes. Check important facts.');
    expect(note.querySelector('[data-icon="info"]')).toBeInTheDocument();
    expect(note.querySelector('.st-disclaimer-note__icon')).toHaveAttribute('aria-hidden', 'true');
  });

  it('is not a live region, so it is never announced on its own', () => {
    render(<DisclaimerNote>Check important facts.</DisclaimerNote>);
    const note = screen.getByRole('note');
    expect(note).not.toHaveAttribute('aria-live');
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('takes a custom icon, or none', () => {
    const { rerender } = render(
      <DisclaimerNote icon={<Icon name="shield" />}>Private by default.</DisclaimerNote>,
    );
    expect(screen.getByRole('note').querySelector('[data-icon="shield"]')).toBeInTheDocument();
    rerender(<DisclaimerNote icon={null}>Private by default.</DisclaimerNote>);
    expect(screen.getByRole('note').querySelector('svg')).toBeNull();
    expect(screen.getByRole('note').querySelector('.st-disclaimer-note__icon')).toBeNull();
  });

  it('renders an action that works with the keyboard', async () => {
    const onClick = vi.fn();
    render(
      <DisclaimerNote
        action={
          <button type="button" onClick={onClick}>
            Learn more
          </button>
        }
      >
        Answers may be out of date.
      </DisclaimerNote>,
    );
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Learn more' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('passes align, className, rest props and the ref', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <DisclaimerNote ref={ref} align="center" className="custom" id="note">
        Centered
      </DisclaimerNote>,
    );
    const note = screen.getByRole('note');
    expect(ref.current).toBe(note);
    expect(note).toHaveClass('st-disclaimer-note', 'custom');
    expect(note).toHaveAttribute('data-align', 'center');
    expect(note).toHaveAttribute('id', 'note');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <DisclaimerNote action={<a href="#accuracy">Learn more</a>}>
          AI can make mistakes. Check important facts.
        </DisclaimerNote>
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

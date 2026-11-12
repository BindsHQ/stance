import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { SensitiveContentGate } from './SensitiveContentGate';

const secret = 'The patient reported chest pain.';
const root = () => document.querySelector('.st-sensitive-content-gate')!;

describe('SensitiveContentGate', () => {
  it('keeps the content out of the page until revealed and shows a named notice', () => {
    render(
      <SensitiveContentGate description="This response describes a medical emergency.">
        <p>{secret}</p>
      </SensitiveContentGate>,
    );
    expect(screen.queryByText(secret)).toBeNull();
    expect(document.body.innerHTML).not.toContain(secret);
    const notice = screen.getByRole('group', { name: 'Sensitive content' });
    expect(notice).toHaveAccessibleDescription('This response describes a medical emergency.');
    expect(screen.getByRole('button', { name: 'Show content' })).toBeInTheDocument();
    expect(root()).toHaveAttribute('data-state', 'hidden');
  });

  it('reveals on click and moves focus to the labelled content', async () => {
    const onRevealedChange = vi.fn();
    render(
      <SensitiveContentGate onRevealedChange={onRevealedChange}>
        <p>{secret}</p>
      </SensitiveContentGate>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Show content' }));
    expect(onRevealedChange).toHaveBeenCalledWith(true);
    const content = screen.getByRole('group', { name: 'Sensitive content, now shown' });
    expect(content).toHaveTextContent(secret);
    expect(content).toHaveFocus();
    expect(content).toHaveAttribute('tabindex', '-1');
    expect(screen.queryByRole('button', { name: 'Show content' })).toBeNull();
    expect(root()).toHaveAttribute('data-state', 'revealed');
  });

  it('works with the keyboard: Enter reveals, then hiding returns focus to the reveal button', async () => {
    const user = userEvent.setup();
    render(
      <SensitiveContentGate>
        <p>{secret}</p>
      </SensitiveContentGate>,
    );
    await user.tab();
    expect(screen.getByRole('button', { name: 'Show content' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByText(secret)).toBeInTheDocument();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Hide content' })).toHaveFocus();
    await user.keyboard(' ');
    expect(screen.queryByText(secret)).toBeNull();
    expect(screen.getByRole('button', { name: 'Show content' })).toHaveFocus();
  });

  it('can start revealed without moving focus, and can drop the hide button', () => {
    render(
      <SensitiveContentGate defaultRevealed allowHide={false}>
        <p>{secret}</p>
      </SensitiveContentGate>,
    );
    expect(screen.getByText(secret)).toBeInTheDocument();
    expect(document.body).toHaveFocus();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('works controlled and does not move focus when the app changes the state', async () => {
    const user = userEvent.setup();
    const onRevealedChange = vi.fn();
    const { rerender } = render(
      <SensitiveContentGate revealed={false} onRevealedChange={onRevealedChange}>
        <p>{secret}</p>
      </SensitiveContentGate>,
    );
    await user.click(screen.getByRole('button', { name: 'Show content' }));
    expect(onRevealedChange).toHaveBeenCalledWith(true);
    expect(screen.queryByText(secret)).toBeNull();

    function Controlled() {
      const [revealed, setRevealed] = React.useState(false);
      return (
        <>
          <button type="button" onClick={() => setRevealed(true)}>
            Show from outside
          </button>
          <SensitiveContentGate revealed={revealed} onRevealedChange={setRevealed}>
            <p>{secret}</p>
          </SensitiveContentGate>
        </>
      );
    }
    rerender(<Controlled />);
    const outside = screen.getByRole('button', { name: 'Show from outside' });
    await user.click(outside);
    expect(screen.getByText(secret)).toBeInTheDocument();
    expect(outside).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Hide content' }));
    expect(screen.queryByText(secret)).toBeNull();
    expect(screen.getByRole('button', { name: 'Show content' })).toHaveFocus();
  });

  it('takes a custom title, icon, labels, className, rest props and ref', async () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <SensitiveContentGate
        ref={ref}
        title="Graphic description"
        icon={null}
        className="custom"
        data-testid="gate"
        labels={{ reveal: 'Prikaži', hide: 'Skrij', content: 'Prikazana vsebina' }}
      >
        <p>{secret}</p>
      </SensitiveContentGate>,
    );
    const gate = screen.getByTestId('gate');
    expect(ref.current).toBe(gate);
    expect(gate).toHaveClass('st-sensitive-content-gate', 'custom');
    expect(screen.getByRole('group', { name: 'Graphic description' })).toBeInTheDocument();
    expect(gate.querySelector('.st-sensitive-content-gate__icon')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Prikaži' }));
    expect(screen.getByRole('group', { name: 'Prikazana vsebina' })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Skrij' })).toBeInTheDocument();
  });

  it.each(THEMES)('has no axe violations in %s (hidden and revealed)', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <SensitiveContentGate description="This response mentions self harm.">
          <p>{secret}</p>
        </SensitiveContentGate>
        <SensitiveContentGate defaultRevealed>
          <p>{secret}</p>
        </SensitiveContentGate>
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

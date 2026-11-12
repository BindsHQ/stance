import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { VoiceInputButton, type VoiceInputState } from './VoiceInputButton';

describe('VoiceInputButton', () => {
  it('is an unpressed toggle button named Voice input while idle', () => {
    render(<VoiceInputButton />);
    const button = screen.getByRole('button', { name: 'Voice input' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button).toHaveAttribute('data-state', 'idle');
    expect(button).toBeEnabled();
    expect(button.querySelector('[data-icon="microphone"]')).not.toBeNull();
  });

  it('is pressed while listening and keeps the same name', () => {
    render(<VoiceInputButton state="listening" level={0.6} />);
    const button = screen.getByRole('button', { name: 'Voice input' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button.style.getPropertyValue('--st-voice-level')).toBe('0.6');
  });

  it('clamps the level to the 0 to 1 range', () => {
    const { rerender } = render(<VoiceInputButton state="listening" level={4} />);
    expect(screen.getByRole('button').style.getPropertyValue('--st-voice-level')).toBe('1');
    rerender(<VoiceInputButton state="listening" level={-2} />);
    expect(screen.getByRole('button').style.getPropertyValue('--st-voice-level')).toBe('0');
    rerender(<VoiceInputButton state="listening" level={Number.NaN} />);
    expect(screen.getByRole('button').style.getPropertyValue('--st-voice-level')).toBe('0');
  });

  it('shows a busy mark while processing and still accepts a press', async () => {
    const onPress = vi.fn();
    render(<VoiceInputButton state="processing" onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Voice input' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button.querySelector('.st-spinner')).not.toBeNull();
    expect(button.querySelector('[data-icon="microphone"]')).toBeNull();
    await userEvent.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is disabled and explains itself when unavailable', async () => {
    const onPress = vi.fn();
    render(<VoiceInputButton state="unavailable" onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Voice input' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('title', 'Voice input unavailable');
    await userEvent.click(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('calls onPress on click, Enter and Space', async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();
    render(<VoiceInputButton onPress={onPress} />);
    await user.click(screen.getByRole('button'));
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onPress).toHaveBeenCalledTimes(3);
  });

  it('announces each state change once and nothing on first render', () => {
    const { rerender } = render(<VoiceInputButton state="idle" />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('');
    rerender(<VoiceInputButton state="listening" />);
    expect(status).toHaveTextContent('Listening');
    const said = status.textContent;
    rerender(<VoiceInputButton state="listening" level={0.4} />);
    rerender(<VoiceInputButton state="listening" level={0.9} />);
    expect(status.textContent).toBe(said);
    rerender(<VoiceInputButton state="processing" />);
    expect(status).toHaveTextContent('Processing speech');
    rerender(<VoiceInputButton state="idle" />);
    expect(status).toHaveTextContent('Voice input stopped');
    rerender(<VoiceInputButton state="unavailable" />);
    expect(status).toHaveTextContent('Voice input unavailable');
  });

  it('does not announce when it first renders in a busy state', () => {
    render(<VoiceInputButton state="listening" />);
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('works as a controlled toggle with custom labels', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [state, setState] = React.useState<VoiceInputState>('idle');
      return (
        <VoiceInputButton
          state={state}
          onPress={() => setState((current) => (current === 'idle' ? 'listening' : 'idle'))}
          labels={{ button: 'Diktat', listening: 'Hört zu', stopped: 'Diktat beendet' }}
        />
      );
    }
    render(<Controlled />);
    const button = screen.getByRole('button', { name: 'Diktat' });
    await user.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Hört zu');
    await user.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('status')).toHaveTextContent('Diktat beendet');
  });

  it('forwards ref, className, size and rest props', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<VoiceInputButton ref={ref} className="mine" size="lg" data-testid="voice" />);
    expect(ref.current).toBe(screen.getByTestId('voice'));
    expect(ref.current).toHaveClass('st-voice-input-button', 'mine');
    expect(ref.current).toHaveAttribute('data-size', 'lg');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <VoiceInputButton />
        <VoiceInputButton state="listening" level={0.5} labels={{ button: 'Dictate' }} />
        <VoiceInputButton state="processing" labels={{ button: 'Dictate reply' }} />
        <VoiceInputButton state="unavailable" labels={{ button: 'Dictate note' }} />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

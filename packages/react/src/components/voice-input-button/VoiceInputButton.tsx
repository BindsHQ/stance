'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useAnnouncer } from '../../internal/use-announcer.js';
import { Icon } from '../../icons/Icon.js';
import type { ButtonVariant } from '../button/Button.js';
import { IconButton } from '../icon-button/IconButton.js';
import { Spinner } from '../spinner/Spinner.js';

export type VoiceInputState = 'idle' | 'listening' | 'processing' | 'unavailable';

export interface VoiceInputButtonLabels {
  /** Accessible name of the button. It stays the same in every state. Default "Voice input". */
  button: string;
  /** Announced when listening starts. Default "Listening". */
  listening: string;
  /** Announced when speech is being turned into text. Default "Processing speech". */
  processing: string;
  /** Announced when voice input ends. Default "Voice input stopped". */
  stopped: string;
  /** Announced, and used as the tooltip, when the microphone cannot be used. Default "Voice input unavailable". */
  unavailable: string;
}

export interface VoiceInputButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  /** What the microphone is doing. Default `idle`. */
  state?: VoiceInputState;
  /** Input level from 0 to 1, shown as a ring around the button while listening. Default 0. */
  level?: number;
  /** Called when the button is pressed, to start or stop listening. */
  onPress?: () => void;
  /** Control size: xs 24, sm 32, md 40, lg 48. Default `sm`. */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Visual weight while idle. Default `ghost`. */
  variant?: Exclude<ButtonVariant, 'link'>;
  /** Translations for the built in strings. */
  labels?: Partial<VoiceInputButtonLabels>;
}

const defaultLabels: VoiceInputButtonLabels = {
  button: 'Voice input',
  listening: 'Listening',
  processing: 'Processing speech',
  stopped: 'Voice input stopped',
  unavailable: 'Voice input unavailable',
};

/**
 * A microphone toggle with idle, listening and processing states and a level indicator.
 * It does not record anything itself: the app owns the microphone and passes state in.
 */
export const VoiceInputButton = React.forwardRef<HTMLButtonElement, VoiceInputButtonProps>(
  function VoiceInputButton(
    {
      state = 'idle',
      level = 0,
      onPress,
      size = 'sm',
      variant = 'ghost',
      labels: labelsProp,
      className,
      style,
      onClick,
      disabled,
      ...props
    },
    ref,
  ) {
    const labels = { ...defaultLabels, ...labelsProp };
    const { announce, region } = useAnnouncer();
    const clamped = Number.isFinite(level) ? Math.min(Math.max(level, 0), 1) : 0;

    // Speak each change of state once. Nothing is said on first render.
    const previous = React.useRef(state);
    const messages = React.useRef(labels);
    messages.current = labels;
    React.useEffect(() => {
      if (previous.current === state) return;
      previous.current = state;
      const text = messages.current;
      announce(
        state === 'listening'
          ? text.listening
          : state === 'processing'
            ? text.processing
            : state === 'unavailable'
              ? text.unavailable
              : text.stopped,
      );
    }, [state, announce]);

    const unavailable = state === 'unavailable';
    return (
      <>
        <IconButton
          ref={ref}
          label={labels.button}
          hideTitle
          title={unavailable ? labels.unavailable : labels.button}
          icon={
            state === 'processing' ? (
              <Spinner size="sm" label={null} className="st-voice-input-button__spinner" />
            ) : (
              <Icon name="microphone" />
            )
          }
          size={size}
          variant={state === 'listening' ? 'primary' : variant}
          shape="circle"
          aria-pressed={state === 'listening'}
          aria-busy={state === 'processing' || undefined}
          disabled={disabled || unavailable}
          className={cx('st-voice-input-button', className)}
          data-state={state}
          style={{ ['--st-voice-level' as string]: clamped, ...style }}
          onClick={(event) => {
            onClick?.(event);
            if (!event.defaultPrevented) onPress?.();
          }}
          {...props}
        />
        {region}
      </>
    );
  },
);

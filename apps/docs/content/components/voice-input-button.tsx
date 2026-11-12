import * as React from 'react';
import { VoiceInputButton } from '@bindshq/stance-react';
import type { VoiceInputState } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'voice-input-button',
  name: 'VoiceInputButton',
  category: 'ai',
  summary:
    'A microphone button for dictating a message, with idle, listening and processing states and a ring that follows the input level.',
  description:
    'Use VoiceInputButton in the trailing slot of PromptComposer. It shows what the microphone is doing and nothing more: your app asks for permission, records, and passes the state and level in. Show the unavailable state when the browser has no microphone or permission was refused.',
  imports: ['VoiceInputButton'],
  status: 'beta',
  examples: [
    {
      name: 'Basic',
      title: 'Start and stop',
      description: 'Press to listen, press again to finish. The level here is simulated.',
    },
    {
      name: 'States',
      title: 'All states',
    },
    {
      name: 'Sizes',
      title: 'Sizes',
    },
  ],
  props: [
    {
      component: 'VoiceInputButton',
      name: 'state',
      type: "'idle' | 'listening' | 'processing' | 'unavailable'",
      default: "'idle'",
      description: 'What the microphone is doing.',
    },
    {
      component: 'VoiceInputButton',
      name: 'level',
      type: 'number',
      default: '0',
      description: 'Input level from 0 to 1, shown as a ring while listening.',
    },
    {
      component: 'VoiceInputButton',
      name: 'onPress',
      type: '() => void',
      description: 'Called when the button is pressed, to start or stop listening.',
    },
    {
      component: 'VoiceInputButton',
      name: 'size',
      type: "'xs' | 'sm' | 'md' | 'lg'",
      default: "'sm'",
      description: 'Control size: 24, 32, 40 or 48 pixels.',
    },
    {
      component: 'VoiceInputButton',
      name: 'variant',
      type: "'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'",
      default: "'ghost'",
      description: 'Visual weight while idle. Listening always uses the primary style.',
    },
    {
      component: 'VoiceInputButton',
      name: 'labels',
      type: 'Partial<VoiceInputButtonLabels>',
      description: 'Translations: button, listening, processing, stopped and unavailable.',
    },
  ],
  accessibility: [
    'A toggle button with aria-pressed. Its name stays “Voice input” in every state, so the pressed state is what changes.',
    'Each change of state is announced politely once: Listening, Processing speech, Voice input stopped. The level is never announced.',
    'Listening is shown by a filled button as well as the ring, so it does not depend on motion or colour alone.',
    'With reduced motion the ring is steady instead of following the level.',
    'When unavailable the button is disabled and its tooltip says why.',
    'On touch screens the target grows to 44 pixels.',
  ],
  keyboard: [
    {
      keys: ['Enter', 'Space'],
      description: 'Starts or stops listening.',
    },
  ],
  guidelines: {
    do: [
      'Put what was heard into the composer so people can check it before sending.',
      'Explain how to allow the microphone when it is unavailable.',
    ],
    dont: [
      'Start listening without a press.',
      'Send the message as soon as speech ends; let people review it.',
    ],
  },
  related: ['prompt-composer', 'icon-button', 'toggle-button'],
};

export function Basic() {
  const [state, setState] = React.useState<VoiceInputState>('idle');
  const [level, setLevel] = React.useState(0);
  React.useEffect(() => {
    if (state !== 'listening') return;
    const id = window.setInterval(() => setLevel(0.2 + Math.random() * 0.8), 160);
    return () => window.clearInterval(id);
  }, [state]);
  React.useEffect(() => {
    if (state !== 'processing') return;
    const id = window.setTimeout(() => setState('idle'), 1500);
    return () => window.clearTimeout(id);
  }, [state]);
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <VoiceInputButton
        state={state}
        level={level}
        size="md"
        onPress={() =>
          setState(state === 'idle' ? 'listening' : state === 'listening' ? 'processing' : 'idle')
        }
      />
      <span>
        {state === 'idle'
          ? 'Press to dictate'
          : state === 'listening'
            ? 'Listening'
            : 'Processing speech'}
      </span>
    </div>
  );
}

export function States() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center' }}>
      <VoiceInputButton state="idle" size="md" labels={{ button: 'Voice input, idle' }} />
      <VoiceInputButton
        state="listening"
        level={0.7}
        size="md"
        labels={{ button: 'Voice input, listening' }}
      />
      <VoiceInputButton
        state="processing"
        size="md"
        labels={{ button: 'Voice input, processing' }}
      />
      <VoiceInputButton
        state="unavailable"
        size="md"
        labels={{ button: 'Voice input, unavailable' }}
      />
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
      <VoiceInputButton size="xs" labels={{ button: 'Voice input, extra small' }} />
      <VoiceInputButton size="sm" labels={{ button: 'Voice input, small' }} />
      <VoiceInputButton size="md" labels={{ button: 'Voice input, medium' }} />
      <VoiceInputButton size="lg" variant="outline" labels={{ button: 'Voice input, large' }} />
    </div>
  );
}

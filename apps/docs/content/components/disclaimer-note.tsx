import { DisclaimerNote, Icon } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'disclaimer-note',
  name: 'DisclaimerNote',
  category: 'ai',
  summary:
    'A quiet note under the composer or a response, such as a reminder to check important facts.',
  description:
    'Use DisclaimerNote for standing information about how the assistant works: answers can be wrong, conversations may be reviewed, a feature is in preview. It is calm by design and is not announced on its own. For something the reader must act on now, use Alert or Banner.',
  imports: ['DisclaimerNote'],
  status: 'beta',
  examples: [
    { name: 'Basic', title: 'Under a response' },
    {
      name: 'WithAction',
      title: 'With an action',
      description: 'action takes a link or small button for the full explanation.',
    },
    {
      name: 'Centered',
      title: 'Centred, without an icon',
      description:
        'Under a composer the note is usually centred. Pass icon={null} to drop the icon.',
      layout: 'fill',
    },
    { name: 'CustomIcon', title: 'Custom icon' },
  ],
  props: [
    {
      component: 'DisclaimerNote',
      name: 'children',
      type: 'ReactNode',
      description: 'The note.',
    },
    {
      component: 'DisclaimerNote',
      name: 'icon',
      type: 'ReactNode',
      default: 'info icon',
      description: 'A leading icon. Pass null for none.',
    },
    {
      component: 'DisclaimerNote',
      name: 'action',
      type: 'ReactNode',
      description: 'A link or small button after the text.',
    },
    {
      component: 'DisclaimerNote',
      name: 'align',
      type: "'start' | 'center'",
      default: "'start'",
      description: 'Text alignment.',
    },
  ],
  accessibility: [
    'Exposed with the note role, so assistive technology can find it without it interrupting anyone.',
    'It is not a live region and is never announced while a response streams.',
    'The icon is decorative. The text uses muted ink that still meets contrast in every theme.',
    'An action keeps its own name and focus ring, and gains a 24px target on touch screens.',
  ],
  keyboard: [{ keys: ['Tab'], description: 'Moves to the action, when there is one.' }],
  guidelines: {
    do: [
      'Keep it to one or two short sentences.',
      'Say what the reader should do, for example check important facts.',
    ],
    dont: [
      'Use it for errors or anything urgent.',
      'Repeat it under every message; once near the composer is enough.',
    ],
  },
  related: ['ai-generated-label', 'alert', 'caption'],
};

export function Basic() {
  return <DisclaimerNote>AI can make mistakes. Check important facts.</DisclaimerNote>;
}

export function WithAction() {
  return (
    <DisclaimerNote action={<a href="#how-answers-work">How answers work</a>}>
      Answers are based on your workspace documents.
    </DisclaimerNote>
  );
}

export function Centered() {
  return (
    <div style={{ width: '100%', maxWidth: 480 }}>
      <DisclaimerNote icon={null} align="center">
        The assistant can make mistakes. Check important facts before you send.
      </DisclaimerNote>
    </div>
  );
}

export function CustomIcon() {
  return (
    <DisclaimerNote icon={<Icon name="shield" size={14} />}>
      Conversations in this workspace are not used to train models.
    </DisclaimerNote>
  );
}

import * as React from 'react';
import { ModelPicker } from '@bindshq/stance-react';
import type { ModelOption } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'model-picker',
  name: 'ModelPicker',
  category: 'ai',
  summary:
    'A compact select for choosing which model answers the next message, with a short description and capability badges on each option.',
  description:
    'Use ModelPicker when people can choose between models and the choice changes speed, depth or cost. Describe each model by what it is good for, in a few words. If there is only one model, or the product chooses for people, leave the picker out.',
  imports: ['ModelPicker'],
  status: 'beta',
  examples: [
    {
      name: 'Basic',
      title: 'Choose a model',
      minHeight: 320,
    },
    {
      name: 'VisibleLabel',
      title: 'Visible label and sizes',
      minHeight: 320,
    },
    {
      name: 'Unavailable',
      title: 'Unavailable models',
      description:
        'A disabled model stays in the list so people know it exists, with the reason in its description.',
      minHeight: 320,
    },
  ],
  props: [
    {
      component: 'ModelPicker',
      name: 'models',
      type: 'ModelOption[]',
      required: true,
      description: 'The models: { id, name, description?, badges?, disabled? }.',
    },
    {
      component: 'ModelPicker',
      name: 'value',
      type: 'string',
      description: 'The selected model id, when controlled.',
    },
    {
      component: 'ModelPicker',
      name: 'defaultValue',
      type: 'string',
      description: 'The initially selected model id when uncontrolled.',
    },
    {
      component: 'ModelPicker',
      name: 'onValueChange',
      type: '(value: string) => void',
      description: 'Called with the id of the chosen model.',
    },
    {
      component: 'ModelPicker',
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
      default: "'sm'",
      description: 'Control height: 32, 40 or 48 pixels.',
    },
    {
      component: 'ModelPicker',
      name: 'label',
      type: 'string',
      default: "'Model'",
      description: 'Names the picker.',
    },
    {
      component: 'ModelPicker',
      name: 'hideLabel',
      type: 'boolean',
      default: 'true',
      description: 'Keep the label for assistive technology only.',
    },
    {
      component: 'ModelPicker',
      name: 'placeholder',
      type: 'string',
      default: "'Choose a model'",
      description: 'Shown when no model is selected.',
    },
    {
      component: 'ModelPicker',
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Turns the picker off, for example while a response is streaming.',
    },
  ],
  accessibility: [
    'Built on Select: a combobox that keeps focus on the trigger while arrow keys move through the list.',
    'The label names the control even when it is visually hidden, and it can be translated.',
    'Each option reads its name, badges and description together. Badges are text, never colour alone.',
    'Disabled models are announced as unavailable and skipped by the arrow keys.',
    'Typing a letter jumps to the model whose name starts with it.',
  ],
  keyboard: [
    {
      keys: ['Enter', 'Space', '↓'],
      description: 'Opens the list.',
    },
    {
      keys: ['↓', '↑'],
      description: 'Move through the models.',
    },
    {
      keys: ['Enter'],
      description: 'Chooses the active model and closes the list.',
    },
    {
      keys: ['Esc'],
      description: 'Closes the list without changing the model.',
    },
  ],
  guidelines: {
    do: [
      'Describe models by what they are good for: “Quick answers”, “Long documents”.',
      'Keep badges to one or two words each.',
    ],
    dont: [
      'List version numbers people have no way to compare.',
      'Change the model in the middle of a response; apply it to the next message.',
    ],
  },
  related: ['select', 'prompt-composer', 'badge'],
};

const models: ModelOption[] = [
  { id: 'swift', name: 'Swift', description: 'Quick answers for everyday work', badges: ['Fast'] },
  {
    id: 'depth',
    name: 'Depth',
    description: 'Careful reasoning for long documents',
    badges: ['Reasoning', 'Vision'],
  },
  {
    id: 'atlas',
    name: 'Atlas',
    description: 'Searches the web and cites sources',
    badges: ['Web'],
  },
];

export function Basic() {
  const [model, setModel] = React.useState('swift');
  return <ModelPicker models={models} value={model} onValueChange={setModel} />;
}

export function VisibleLabel() {
  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
      <ModelPicker models={models} defaultValue="swift" label="Answer with" hideLabel={false} />
      <ModelPicker
        models={models}
        defaultValue="depth"
        size="md"
        label="Review with"
        hideLabel={false}
      />
      <ModelPicker models={models} size="lg" label="Draft with" hideLabel={false} />
    </div>
  );
}

export function Unavailable() {
  return (
    <ModelPicker
      defaultValue="swift"
      models={[
        ...models,
        { id: 'lab', name: 'Lab', description: 'Available on the Business plan', disabled: true },
      ]}
    />
  );
}

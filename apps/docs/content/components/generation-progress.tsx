import * as React from 'react';
import { GenerationProgress } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'generation-progress',
  name: 'GenerationProgress',
  category: 'ai',
  summary:
    'Progress for longer generations such as images or documents, with a stage label and a way to cancel.',
  description:
    'Use GenerationProgress when making something takes more than a few seconds: an image, a report, a long export. Give it a value when you can measure the work, and leave the value out when you cannot. Name the current stage so people know it is moving. For a short wait before text use ThinkingIndicator.',
  imports: ['GenerationProgress'],
  status: 'beta',
  examples: [
    {
      name: 'Basic',
      title: 'With stages',
      description: 'The value and the stage update as the work moves on.',
      layout: 'fill',
    },
    {
      name: 'Indeterminate',
      title: 'Unknown amount of work',
      layout: 'fill',
    },
    {
      name: 'Cancel',
      title: 'With cancel',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'GenerationProgress',
      name: 'value',
      type: 'number | null',
      description: 'Progress from 0 to 1. Leave it out while the amount of work is unknown.',
    },
    {
      component: 'GenerationProgress',
      name: 'label',
      type: 'React.ReactNode',
      default: "'Generating'",
      description: 'What is being made. Also the accessible name of the progress bar.',
    },
    {
      component: 'GenerationProgress',
      name: 'stage',
      type: 'string',
      description: 'The current step, for example "Rendering pages".',
    },
    {
      component: 'GenerationProgress',
      name: 'onCancel',
      type: '() => void',
      description: 'Shows a cancel button and is called when it is pressed.',
    },
    {
      component: 'GenerationProgress',
      name: 'labels',
      type: 'Partial<GenerationProgressLabels>',
      description: 'Translations: cancel, and value(value) to format the percentage.',
    },
  ],
  accessibility: [
    'A progressbar named by the label, with value text that includes the stage, for example 40%, Rendering pages.',
    'Each stage change is announced politely, once. Value changes are not announced.',
    'Without a value the bar is indeterminate and exposes no value.',
    'With reduced motion the indeterminate bar is static.',
    'Cancel is a real button with a visible label.',
  ],
  keyboard: [{ keys: ['Enter', 'Space'], description: 'On Cancel: cancels the generation.' }],
  guidelines: {
    do: [
      'Name what is being made: Creating report, not Loading.',
      'Offer cancel when the work takes long or costs something.',
    ],
    dont: ['Show a value you cannot measure. An honest indeterminate bar is better.'],
  },
  related: ['progress', 'thinking-indicator', 'streaming-skeleton', 'interrupted-state'],
};

const stages = ['Outlining', 'Writing sections', 'Rendering pages', 'Finishing'];

export function Basic() {
  const [value, setValue] = React.useState(0);
  React.useEffect(() => {
    const timer = window.setInterval(() => setValue((v) => (v >= 1 ? 0 : v + 0.05)), 600);
    return () => window.clearInterval(timer);
  }, []);
  const clamped = Math.min(value, 1);
  const stage = stages[Math.min(stages.length - 1, Math.floor(clamped * stages.length))];
  return <GenerationProgress label="Creating report" value={clamped} stage={stage} />;
}

export function Indeterminate() {
  return <GenerationProgress label="Creating image" stage="Waiting for a free slot" />;
}

export function Cancel() {
  const [cancelled, setCancelled] = React.useState(false);
  return cancelled ? (
    <p style={{ margin: 0 }}>Cancelled. Nothing was saved.</p>
  ) : (
    <GenerationProgress
      label="Exporting 240 documents"
      value={0.35}
      stage="Document 84 of 240"
      onCancel={() => setCancelled(true)}
    />
  );
}

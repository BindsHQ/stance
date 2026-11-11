import { Button, Step, Stepper } from '@bindshq/stance-react';
import { useState } from 'react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'stepper',
  name: 'Stepper',
  category: 'navigation',
  summary: 'Shows progress through an ordered, multi-step task.',
  description:
    'Use Stepper for flows that must be completed in order, such as creating a signature: choose a template, add details, assign users, deploy. Steps before the active one are complete; mark a step with status="error" when it needs attention. Pass onStepClick to let people return to completed steps.',
  imports: ['Stepper', 'Step'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', layout: 'fill' },
    {
      name: 'Interactive',
      title: 'Clickable steps',
      description: 'Completed steps become buttons that jump back.',
      layout: 'fill',
    },
    { name: 'Vertical', title: 'Vertical with descriptions', layout: 'start' },
    { name: 'WithError', title: 'Error state', layout: 'fill' },
  ],
  props: [
    {
      component: 'Stepper',
      name: 'activeStep',
      type: 'number',
      required: true,
      description: 'Zero-based index of the current step.',
    },
    {
      component: 'Stepper',
      name: 'orientation',
      type: "'horizontal' | 'vertical'",
      default: "'horizontal'",
      description: 'Horizontal steppers stack below 640px.',
    },
    {
      component: 'Stepper',
      name: 'onStepClick',
      type: '(index: number) => void',
      description: 'Makes completed steps clickable.',
    },
    {
      component: 'Stepper',
      name: 'allowFutureSteps',
      type: 'boolean',
      default: 'false',
      description: 'Also allow clicking upcoming steps.',
    },
    {
      component: 'Stepper',
      name: 'aria-label',
      type: 'string',
      default: "'Progress'",
      description: 'Name of the list.',
    },
    {
      component: 'Stepper',
      name: 'labels',
      type: 'Partial<StepperLabels>',
      description: 'Translatable status words and “Step x of y”.',
    },
    {
      component: 'Step',
      name: 'title',
      type: 'ReactNode',
      required: true,
      description: 'Step name.',
    },
    { component: 'Step', name: 'description', type: 'ReactNode', description: 'Supporting text.' },
    {
      component: 'Step',
      name: 'status',
      type: "'complete' | 'current' | 'upcoming' | 'error'",
      description: 'Overrides the derived status.',
    },
    {
      component: 'Step',
      name: 'icon',
      type: 'ReactNode',
      description: 'Custom indicator content.',
    },
    {
      component: 'Step',
      name: 'disabled',
      type: 'boolean',
      description: 'Prevents clicking this step.',
    },
  ],
  accessibility: [
    'An ordered list; the current step has aria-current="step".',
    'Each step announces its position and status, e.g. “Assign users, Step 3 of 4, Current step”, so meaning never depends on colour or icons.',
    'Clickable steps are real buttons; non-clickable steps are not focusable.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves between clickable steps.' },
    { keys: ['Enter', 'Space'], description: 'Returns to the step.' },
  ],
  guidelines: {
    do: ['Keep to between three and seven steps.', 'Use short noun or verb phrases.'],
    dont: ['Use for navigation between unrelated pages.', 'Let people skip required steps.'],
  },
  related: ['tabs', 'progress'],
};

export function Basic() {
  return (
    <Stepper activeStep={2} style={{ width: '100%' }}>
      <Step title="Choose template" />
      <Step title="Add details" />
      <Step title="Assign users" />
      <Step title="Deploy" />
    </Stepper>
  );
}

export function Interactive() {
  const [step, setStep] = useState(2);
  return (
    <div style={{ display: 'grid', gap: 24, width: '100%' }}>
      <Stepper activeStep={step} onStepClick={setStep}>
        <Step title="Template" />
        <Step title="Details" />
        <Step title="Users" />
        <Step title="Deploy" />
      </Stepper>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          Back
        </Button>
        <Button disabled={step === 3} onClick={() => setStep((s) => s + 1)}>
          Continue
        </Button>
      </div>
    </div>
  );
}

export function Vertical() {
  return (
    <Stepper activeStep={1} orientation="vertical">
      <Step title="Connect Exchange" description="Relay connector verified" />
      <Step title="Sync users" description="Importing 214 users from Azure AD" />
      <Step title="Assign templates" description="Choose a signature per team" />
      <Step title="Go live" description="Signatures apply to outgoing mail" />
    </Stepper>
  );
}

export function WithError() {
  return (
    <Stepper activeStep={2} style={{ width: '100%' }}>
      <Step title="Upload spreadsheet" />
      <Step title="Map columns" status="error" description="2 columns unmapped" />
      <Step title="Review" />
      <Step title="Import" />
    </Stepper>
  );
}

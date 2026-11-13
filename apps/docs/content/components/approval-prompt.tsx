import * as React from 'react';
import { ApprovalPrompt, Button, CodeBlock } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'approval-prompt',
  name: 'ApprovalPrompt',
  category: 'ai',
  summary:
    'Asks a person to allow or deny an agent action, stating what will happen and how risky it is. Deny is always the safe default.',
  description:
    'Use ApprovalPrompt before an agent changes data, spends money or acts outside the product. Say what will happen in the title, the effect in the description, and show the exact command or change in the details. Nothing is ever allowed by accident: Escape denies, a countdown can only deny, and for high risk Enter does not allow.',
  imports: ['ApprovalPrompt'],
  status: 'beta',
  examples: [
    {
      name: 'Basic',
      title: 'Allow or deny',
      layout: 'fill',
    },
    {
      name: 'AllowAlways',
      title: 'With details and always allow',
      description: 'Show the exact command. Offer always allow for low risk, repeatable actions.',
      layout: 'fill',
    },
    {
      name: 'HighRisk',
      title: 'High risk',
      description: 'Enter does not allow. The person has to press Space or click.',
      layout: 'fill',
    },
    {
      name: 'Countdown',
      title: 'Countdown to deny',
      description: 'When time runs out the request is denied. Keep waiting stops the clock.',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'ApprovalPrompt',
      name: 'title',
      type: 'React.ReactNode',
      required: true,
      description: 'What the agent wants to do, for example Send the email to 240 customers.',
    },
    {
      component: 'ApprovalPrompt',
      name: 'description',
      type: 'React.ReactNode',
      description: 'The effect of allowing it, in plain words.',
    },
    {
      component: 'ApprovalPrompt',
      name: 'risk',
      type: "'low' | 'medium' | 'high'",
      default: "'low'",
      description: 'How much is at stake. High risk blocks Enter on the allow buttons.',
    },
    {
      component: 'ApprovalPrompt',
      name: 'details',
      type: 'React.ReactNode',
      description: 'The exact action, for example the command or the diff.',
    },
    {
      component: 'ApprovalPrompt',
      name: 'onAllow',
      type: '() => void',
      description: 'Called when the person allows the action once.',
    },
    {
      component: 'ApprovalPrompt',
      name: 'onAllowAlways',
      type: '() => void',
      description:
        'Called when the person allows this kind of action from now on. Shows the button.',
    },
    {
      component: 'ApprovalPrompt',
      name: 'onDeny',
      type: "(reason: 'deny' | 'escape' | 'timeout') => void",
      description: 'Called when the person denies, presses Escape, or the countdown runs out.',
    },
    {
      component: 'ApprovalPrompt',
      name: 'busy',
      type: 'boolean',
      default: 'false',
      description: 'The decision is being applied. Disables the buttons and stops the countdown.',
    },
    {
      component: 'ApprovalPrompt',
      name: 'countdown',
      type: 'number',
      description:
        'Seconds until the request is denied automatically. It never allows automatically.',
    },
    {
      component: 'ApprovalPrompt',
      name: 'autoFocus',
      type: 'boolean',
      default: 'false',
      description: 'Move focus to the deny button when the prompt appears.',
    },
    {
      component: 'ApprovalPrompt',
      name: 'labels',
      type: 'ApprovalPromptLabelOverrides',
      description:
        'Translations: allow, allowAlways, deny, risk words, countdown(seconds), keepWaiting and highRiskHint.',
    },
  ],
  accessibility: [
    'An alertdialog group named by the title and described by the effect and the countdown.',
    'It does not take focus when it appears unless autoFocus is set, and then focus goes to Deny.',
    'Deny comes first in the tab order. Escape denies from anywhere inside the prompt.',
    'For high risk, Enter on Allow and Always allow does nothing, and the buttons say so to screen readers.',
    'The risk level is written in words beside an icon, never colour alone.',
    'The countdown can be stopped with Keep waiting. It is announced once when ten seconds remain, not every second.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves through Deny, Always allow and Allow, in that order.' },
    { keys: ['Escape'], description: 'Denies the request.' },
    { keys: ['Space'], description: 'Activates the focused button.' },
    {
      keys: ['Enter'],
      description: 'Activates the focused button, except Allow and Always allow at high risk.',
    },
  ],
  guidelines: {
    do: [
      'State the action and its effect in plain words, with numbers where they matter.',
      'Show the exact command, recipients or change in the details.',
      'Use high risk for anything that cannot be undone.',
    ],
    dont: [
      'Offer always allow for high risk actions.',
      'Use a countdown to rush a decision. Use it only so an unattended run stops safely.',
      'Ask for approval for reading data the person can already see.',
    ],
  },
  related: ['permission-sheet', 'plan-checklist', 'tool-call-card', 'diff-review', 'alert-dialog'],
};

export function Basic() {
  const [decision, setDecision] = React.useState('No decision yet.');
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 520 }}>
      <ApprovalPrompt
        title="Create a calendar event"
        description="Adds Lease review to your calendar on Thursday at 10:00."
        onAllow={() => setDecision('Allowed.')}
        onDeny={() => setDecision('Denied.')}
      />
      <p style={{ margin: 0, fontSize: 14 }}>{decision}</p>
    </div>
  );
}

export function AllowAlways() {
  return (
    <div style={{ width: '100%', maxWidth: 520 }}>
      <ApprovalPrompt
        title="Run the test suite"
        description="Runs in your project folder. It does not change any files."
        risk="medium"
        details={<CodeBlock code="npm test" language="bash" copyable={false} />}
        onAllow={() => {}}
        onAllowAlways={() => {}}
        onDeny={() => {}}
      />
    </div>
  );
}

export function HighRisk() {
  const [busy, setBusy] = React.useState(false);
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 520 }}>
      <ApprovalPrompt
        title="Send the email to 240 customers"
        description="This cannot be undone. Everyone on the Renewals list receives it now."
        risk="high"
        busy={busy}
        onAllow={() => setBusy(true)}
        onDeny={() => {}}
      />
      {busy && (
        <div>
          <Button size="sm" variant="outline" onClick={() => setBusy(false)}>
            Reset
          </Button>
        </div>
      )}
    </div>
  );
}

export function Countdown() {
  const [run, setRun] = React.useState(0);
  const [decision, setDecision] = React.useState('Waiting.');
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 520 }}>
      <ApprovalPrompt
        key={run}
        title="Upload the report to the shared drive"
        description="Anyone in the Finance group will be able to open it."
        risk="medium"
        countdown={20}
        onAllow={() => setDecision('Allowed.')}
        onDeny={(reason) => setDecision(reason === 'timeout' ? 'Denied: time ran out.' : 'Denied.')}
      />
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Button size="sm" variant="outline" onClick={() => setRun((n) => n + 1)}>
          Ask again
        </Button>
        <span style={{ fontSize: 14 }}>{decision}</span>
      </div>
    </div>
  );
}

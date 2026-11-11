import * as React from 'react';
import { Button, ErrorBoundary } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'error-boundary',
  name: 'ErrorBoundary',
  category: 'advanced',
  summary: 'Catches rendering errors in part of the screen and shows a recoverable fallback.',
  description:
    'Wrap independent regions, such as a signature preview, a chart or an integration panel, so a failure in one does not blank the whole page. The default fallback is an accessible alert with a retry button; you can supply your own. ErrorBoundary catches rendering errors only. Handle event and async errors where they happen.',
  imports: ['ErrorBoundary'],
  status: 'stable',
  examples: [
    {
      name: 'Basic',
      title: 'Default fallback',
      description: 'Toggle the failure to see the fallback, then retry.',
      layout: 'fill',
    },
    { name: 'CustomFallback', title: 'Custom fallback', layout: 'fill' },
    {
      name: 'ResetKeys',
      title: 'Reset on navigation',
      description:
        'Changing resetKeys clears the error, e.g. when the user opens another template.',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'ErrorBoundary',
      name: 'children',
      type: 'ReactNode',
      description: 'The region to protect.',
    },
    {
      component: 'ErrorBoundary',
      name: 'fallback',
      type: 'ReactNode | ({ error, reset }) => ReactNode',
      description: 'Custom fallback. Defaults to an accessible alert with a retry button.',
    },
    {
      component: 'ErrorBoundary',
      name: 'onError',
      type: '(error: Error, info: ErrorInfo) => void',
      description: 'Report the error and component stack to your error tracker.',
    },
    {
      component: 'ErrorBoundary',
      name: 'onReset',
      type: '() => void',
      description: 'Called after the boundary resets.',
    },
    {
      component: 'ErrorBoundary',
      name: 'resetKeys',
      type: 'readonly unknown[]',
      description: 'When any value changes, a caught error is cleared.',
    },
    {
      component: 'ErrorBoundary',
      name: 'title',
      type: 'string',
      default: "'Something went wrong'",
      description: 'Default fallback title.',
    },
    {
      component: 'ErrorBoundary',
      name: 'description',
      type: 'string',
      description: 'Default fallback description.',
    },
    {
      component: 'ErrorBoundary',
      name: 'retryLabel',
      type: 'string',
      default: "'Try again'",
      description: 'Default retry button label.',
    },
  ],
  accessibility: [
    'The default fallback uses role="alert", so the failure is announced when it appears.',
    'Technical details are in a collapsed disclosure, so they do not overwhelm the message.',
    'The retry button is a native button. After a reset, the region renders again in place.',
    'Write fallback copy that says what failed and what the person can do next.',
  ],
  keyboard: [
    {
      keys: ['Enter', 'Space'],
      description: 'Activates the retry button in the default fallback.',
    },
  ],
  guidelines: {
    do: [
      'Wrap independent regions separately so the rest of the screen keeps working.',
      'Send errors to monitoring with onError.',
    ],
    dont: ['Wrap the entire app in a single boundary only.', 'Show raw stack traces to end users.'],
  },
  related: ['alert', 'empty-state'],
};

// Error boundaries catch errors thrown while rendering on the client, so the demo throws after mount.
function SignaturePreview({ broken }: { broken: boolean }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (broken && mounted)
    throw new Error('Template HTML could not be parsed: unexpected </td> at line 14');
  return (
    <div
      style={{ padding: 16, border: '1px solid var(--st-color-border-default)', borderRadius: 12 }}
    >
      <strong>Priya Nair</strong>
      <div>Account Executive · Binds</div>
    </div>
  );
}

export function Basic() {
  const [broken, setBroken] = React.useState(true);
  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 460 }}>
      <Button size="sm" variant="outline" onClick={() => setBroken((b) => !b)}>
        {broken ? 'Fix the template' : 'Break the template'}
      </Button>
      <ErrorBoundary resetKeys={[broken]}>
        <SignaturePreview broken={broken} />
      </ErrorBoundary>
    </div>
  );
}

export function CustomFallback() {
  return (
    <div style={{ maxWidth: 460 }}>
      <ErrorBoundary
        fallback={({ reset }) => (
          <div
            style={{
              padding: 16,
              border: '1px dashed var(--st-color-border-strong)',
              borderRadius: 12,
            }}
          >
            <p style={{ marginTop: 0 }}>The preview isn’t available. Your template is saved.</p>
            <Button size="sm" onClick={reset}>
              Reload preview
            </Button>
          </div>
        )}
      >
        <SignaturePreview broken />
      </ErrorBoundary>
    </div>
  );
}

export function ResetKeys() {
  const [template, setTemplate] = React.useState('broken');
  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 460 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button
          size="sm"
          variant={template === 'broken' ? 'primary' : 'outline'}
          onClick={() => setTemplate('broken')}
        >
          Legacy template
        </Button>
        <Button
          size="sm"
          variant={template === 'ok' ? 'primary' : 'outline'}
          onClick={() => setTemplate('ok')}
        >
          Standard template
        </Button>
      </div>
      <ErrorBoundary resetKeys={[template]} title="This template can’t be previewed">
        <SignaturePreview broken={template === 'broken'} />
      </ErrorBoundary>
    </div>
  );
}

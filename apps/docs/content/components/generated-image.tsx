import * as React from 'react';
import { Button, GeneratedImage } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'generated-image',
  name: 'GeneratedImage',
  category: 'ai',
  summary:
    'Shows a picture the assistant made, holding its space while it loads, with variations to choose from and a few clear actions.',
  description:
    'Use GeneratedImage for pictures a model creates. The frame keeps its shape from the first moment, so nothing jumps when the image arrives. People can compare variations, read the prompt, and download, regenerate or edit the result.',
  imports: ['GeneratedImage'],
  status: 'beta',
  examples: [
    {
      name: 'Basic',
      title: 'A finished image',
      description: 'With the prompt and actions under it.',
      layout: 'fill',
    },
    {
      name: 'Generating',
      title: 'From generating to ready',
      description: 'The frame holds its space and reports progress.',
      layout: 'fill',
    },
    {
      name: 'Variations',
      title: 'Variations',
      description: 'Pick a version with a click or the arrow keys.',
      layout: 'fill',
    },
    {
      name: 'Failed',
      title: 'Error',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'GeneratedImage',
      name: 'src',
      type: 'string',
      description:
        'The image address. While generating it may be a partial preview, or be left out.',
    },
    {
      component: 'GeneratedImage',
      name: 'alt',
      type: 'string',
      required: true,
      description: 'Describes the image for people who cannot see it.',
    },
    {
      component: 'GeneratedImage',
      name: 'status',
      type: "'generating' | 'ready' | 'error'",
      default: "'ready'",
      description: 'Where the image is in its life.',
    },
    {
      component: 'GeneratedImage',
      name: 'progress',
      type: 'number',
      description: 'Progress from 0 to 100 while generating. Omit for an indeterminate state.',
    },
    {
      component: 'GeneratedImage',
      name: 'aspectRatio',
      type: 'number | string',
      default: '1',
      description: 'Width over height, as a number or a CSS ratio such as 16 / 9.',
    },
    {
      component: 'GeneratedImage',
      name: 'variations',
      type: '{ id: string; src: string; alt: string }[]',
      description: 'Alternative versions. The selected one shows in the frame.',
    },
    {
      component: 'GeneratedImage',
      name: 'selectedId',
      type: 'string',
      description: 'Controlled selected variation.',
    },
    {
      component: 'GeneratedImage',
      name: 'defaultSelectedId',
      type: 'string',
      description: 'Variation selected on first render. Defaults to the first.',
    },
    {
      component: 'GeneratedImage',
      name: 'onSelect',
      type: '(id: string) => void',
      description: 'Called when the reader picks a variation.',
    },
    {
      component: 'GeneratedImage',
      name: 'onDownload',
      type: '(src: string | undefined) => void',
      description: 'Shows a download action. Receives the address of the image on show.',
    },
    {
      component: 'GeneratedImage',
      name: 'onRegenerate',
      type: '() => void',
      description: 'Shows a regenerate action.',
    },
    {
      component: 'GeneratedImage',
      name: 'onEdit',
      type: '() => void',
      description: 'Shows an edit action.',
    },
    {
      component: 'GeneratedImage',
      name: 'prompt',
      type: 'React.ReactNode',
      description: 'The prompt the image was made from, shown under it.',
    },
    {
      component: 'GeneratedImage',
      name: 'labels',
      type: 'Partial<GeneratedImageLabels>',
      description:
        'Translations: generating, progress(value), ready, error, variations, variation(index, count), prompt, download, regenerate and edit.',
    },
  ],
  accessibility: [
    'Alt text is required, for the image and for each variation.',
    'While generating the frame is a progressbar with a name and, when known, a value.',
    'Ready and failed are announced politely, once.',
    'Variations are a radio group. Each one is named by its position and its alt text.',
    'The selected variation has a check mark as well as a stronger border.',
    'With reduced motion the loading state does not move.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves to the selected variation, then to the actions.' },
    {
      keys: ['ArrowRight', 'ArrowLeft'],
      description: 'Selects the next or previous variation. Mirrored in right to left.',
    },
    { keys: ['Home', 'End'], description: 'Selects the first or last variation.' },
  ],
  guidelines: {
    do: [
      'Write alt text that says what is in the picture, not that it was generated.',
      'Set aspectRatio to the shape you asked the model for.',
      'Show the prompt when people may want to refine it.',
    ],
    dont: [
      'Leave alt empty. A generated image is content.',
      'Offer download before the image is ready.',
    ],
  },
  related: ['generation-progress', 'file-preview-card', 'ai-generated-label', 'image'],
};

function art(sky: string, hill: string, sun: string) {
  const shapes = [
    '<rect width="320" height="320" fill="' + sky + '"/>',
    '<circle cx="232" cy="96" r="40" fill="' + sun + '"/>',
    '<path d="M0 230 Q80 150 170 215 T320 190 V320 H0Z" fill="' + hill + '"/>',
    '<path d="M0 270 Q110 215 220 265 T320 250 V320 H0Z" fill="#140C2E"/>',
  ];
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320">' + shapes.join('') + '</svg>';
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

const versions = [
  { id: 'dawn', src: art('#ECE6DF', '#817D8C', '#F4F1EC'), alt: 'Hills at dawn under a pale sun' },
  { id: 'dusk', src: art('#C9C4D4', '#4B4660', '#ECE6DF'), alt: 'Hills at dusk under a low sun' },
  { id: 'night', src: art('#3A3452', '#262040', '#C9C4D4'), alt: 'Hills at night under a moon' },
];

export function Basic() {
  return (
    <div style={{ width: '100%', maxWidth: 320 }}>
      <GeneratedImage
        src={versions[0]!.src}
        alt={versions[0]!.alt}
        prompt="Rolling hills at dawn, flat shapes, muted colours"
        onDownload={() => {}}
        onRegenerate={() => {}}
        onEdit={() => {}}
      />
    </div>
  );
}

export function Generating() {
  const [progress, setProgress] = React.useState(100);
  React.useEffect(() => {
    if (progress >= 100) return;
    const timer = window.setTimeout(() => setProgress((p) => Math.min(100, p + 8)), 200);
    return () => window.clearTimeout(timer);
  }, [progress]);
  const ready = progress >= 100;
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 320 }}>
      <GeneratedImage
        {...(ready && { src: versions[1]!.src })}
        alt={versions[1]!.alt}
        status={ready ? 'ready' : 'generating'}
        progress={progress}
        aspectRatio="4 / 3"
      />
      <div>
        <Button size="sm" variant="outline" onClick={() => setProgress(0)} disabled={!ready}>
          Generate again
        </Button>
      </div>
    </div>
  );
}

export function Variations() {
  const [selected, setSelected] = React.useState('dusk');
  return (
    <div style={{ width: '100%', maxWidth: 320 }}>
      <GeneratedImage
        alt={versions[0]!.alt}
        variations={versions}
        selectedId={selected}
        onSelect={setSelected}
        onDownload={() => {}}
      />
    </div>
  );
}

export function Failed() {
  return (
    <div style={{ width: '100%', maxWidth: 320 }}>
      <GeneratedImage
        alt="Hills at dawn"
        status="error"
        aspectRatio="16 / 9"
        onRegenerate={() => {}}
      />
    </div>
  );
}

import * as React from 'react';
import {
  Button,
  FileUpload,
  FormField,
  Input,
  SignaturePad,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@bindshq/stance-react';
import type { SignaturePadHandle, SignatureStroke } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'signature-pad',
  name: 'SignaturePad',
  category: 'forms',
  summary:
    'Captures a hand-drawn signature with pointer, touch or stylus, with undo, clear and form submission.',
  description:
    'Use SignaturePad where a person signs a document on screen. Strokes are stored as points, so the drawing survives resizes and follows the theme. Drawing is not possible for everyone: always offer a typed or uploaded signature beside it, as the first example shows.',
  imports: ['SignaturePad'],
  status: 'stable',
  examples: [
    { name: 'WithAlternatives', title: 'Draw, type or upload', layout: 'fill', minHeight: 360 },
    {
      name: 'Basic',
      title: 'Drawing pad',
      description: 'Undo removes the last stroke; Clear removes everything.',
      layout: 'fill',
    },
    {
      name: 'InAForm',
      title: 'In a form',
      description:
        'With a name, the signature is submitted as an SVG string (or a PNG data URL with format="png").',
      layout: 'fill',
    },
    {
      name: 'ImperativeHandle',
      title: 'Exporting',
      description: 'Use the ref to export SVG or PNG, or to clear the pad from your own buttons.',
      layout: 'fill',
    },
    {
      name: 'ReadOnly',
      title: 'Read-only',
      description: 'Show a captured signature without allowing changes.',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'SignaturePad',
      name: 'value',
      type: 'SignatureStroke[]',
      description: 'Controlled strokes. Each stroke is an array of { x, y } points in CSS pixels.',
    },
    {
      component: 'SignaturePad',
      name: 'defaultValue',
      type: 'SignatureStroke[]',
      default: '[]',
      description: 'Initial strokes when uncontrolled.',
    },
    {
      component: 'SignaturePad',
      name: 'onChange',
      type: '(strokes: SignatureStroke[]) => void',
      description: 'Called when a stroke is finished, undone or cleared.',
    },
    {
      component: 'SignaturePad',
      name: 'label',
      type: 'string',
      default: "'Signature'",
      description: 'Accessible name of the drawing area.',
    },
    {
      component: 'SignaturePad',
      name: 'height',
      type: 'number',
      default: '180',
      description: 'Height of the drawing area in px. The width fills the container.',
    },
    {
      component: 'SignaturePad',
      name: 'penWidth',
      type: 'number',
      default: '2.5',
      description: 'Stroke width in px.',
    },
    {
      component: 'SignaturePad',
      name: 'name',
      type: 'string',
      description: 'Adds a hidden input so the signature is submitted with a form.',
    },
    {
      component: 'SignaturePad',
      name: 'format',
      type: "'svg' | 'png'",
      default: "'svg'",
      description: 'What the hidden input carries: an SVG string or a PNG data URL.',
    },
    {
      component: 'SignaturePad',
      name: 'showActions',
      type: 'boolean',
      default: 'true',
      description: 'Show the Undo and Clear buttons.',
    },
    {
      component: 'SignaturePad',
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Prevents drawing and removes the pad from the tab order.',
    },
    {
      component: 'SignaturePad',
      name: 'readOnly',
      type: 'boolean',
      default: 'false',
      description: 'Shows the signature without allowing changes.',
    },
    {
      component: 'SignaturePad',
      name: 'invalid',
      type: 'boolean',
      description: 'Marks the pad invalid. Set automatically inside an erroring FormField.',
    },
    {
      component: 'SignaturePad',
      name: 'labels',
      type: 'Partial<SignaturePadLabels>',
      description: 'Translations for buttons, the hint, announcements and the description.',
    },
    {
      component: 'SignaturePad',
      name: 'ref',
      type: 'Ref<SignaturePadHandle>',
      description: 'clear(), undo(), isEmpty(), toDataURL(type?) and toSVG().',
    },
  ],
  accessibility: [
    'Drawing needs fine pointer control, so it must never be the only way to sign. Offer typing a name or uploading an image alongside it (WCAG 2.5.1, 2.5.7).',
    'The pad is exposed as an image whose name states whether a signature is present, for example “Signature: no signature yet”.',
    'A description tells keyboard and screen-reader users to use the typed or uploaded alternative.',
    'Capturing, undoing and clearing are announced through a polite live region.',
    'Undo and Clear are real buttons; Backspace or Delete on the focused pad also removes the last stroke.',
    'Ink uses the theme’s text colour, so it keeps full contrast in light, dark and high contrast.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves focus to the pad, then to Undo and Clear.' },
    {
      keys: ['Backspace', 'Delete'],
      description: 'Removes the last stroke while the pad is focused.',
    },
  ],
  guidelines: {
    do: [
      'Offer Draw, Type and Upload together, and let the person choose.',
      'State what signing means next to the action: “By signing, you agree to…”.',
    ],
    dont: [
      'Make a drawn signature the only way to complete a document.',
      'Treat the drawing as proof of identity; that belongs to your product’s signing process.',
    ],
  },
  related: ['file-upload', 'tabs', 'form-field'],
};

export function WithAlternatives() {
  const [typed, setTyped] = React.useState('');
  return (
    <div style={{ width: '100%', maxWidth: 520 }}>
      <Tabs defaultValue="draw">
        <TabsList aria-label="How to sign">
          <TabsTrigger value="draw">Draw</TabsTrigger>
          <TabsTrigger value="type">Type</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
        </TabsList>
        <TabsContent value="draw">
          <div style={{ paddingTop: 16 }}>
            <SignaturePad label="Your signature" name="signature" />
          </div>
        </TabsContent>
        <TabsContent value="type">
          <div style={{ paddingTop: 16 }}>
            <FormField
              label="Type your full name"
              description="Your typed name is used as your signature."
            >
              <Input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="name" />
            </FormField>
          </div>
        </TabsContent>
        <TabsContent value="upload">
          <div style={{ paddingTop: 16 }}>
            <FileUpload
              accept="image/png,image/jpeg,image/svg+xml"
              maxSize={2 * 1024 * 1024}
              title="Upload an image of your signature"
              hint="PNG, JPG or SVG up to 2 MB"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function Basic() {
  return (
    <div style={{ width: '100%', maxWidth: 520 }}>
      <SignaturePad label="Your signature" />
    </div>
  );
}

export function InAForm() {
  const [submitted, setSubmitted] = React.useState<number | null>(null);
  return (
    <form
      style={{ width: '100%', maxWidth: 520, display: 'grid', gap: 16 }}
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(String(new FormData(e.currentTarget).get('signature') ?? '').length);
      }}
    >
      <FormField
        label="Signature"
        description="Sign as your name appears on the agreement."
        required
      >
        <SignaturePad name="signature" />
      </FormField>
      <div>
        <Button type="submit">Sign agreement</Button>
      </div>
      <p role="status" style={{ margin: 0 }}>
        {submitted === null
          ? ''
          : submitted === 0
            ? 'Nothing was submitted: the pad is empty.'
            : `Submitted an SVG of ${submitted} characters.`}
      </p>
    </form>
  );
}

export function ImperativeHandle() {
  const pad = React.useRef<SignaturePadHandle>(null);
  const [strokes, setStrokes] = React.useState<SignatureStroke[]>([]);
  const [output, setOutput] = React.useState('');
  return (
    <div style={{ width: '100%', maxWidth: 520, display: 'grid', gap: 12 }}>
      <SignaturePad
        ref={pad}
        value={strokes}
        onChange={setStrokes}
        showActions={false}
        height={140}
      />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setOutput(`${pad.current?.toSVG().length ?? 0} characters of SVG`)}
        >
          Export SVG
        </Button>
        <Button size="sm" variant="ghost" onClick={() => pad.current?.clear()}>
          Clear
        </Button>
      </div>
      <p role="status" style={{ margin: 0 }}>
        {strokes.length} stroke{strokes.length === 1 ? '' : 's'}
        {output ? ` · ${output}` : ''}
      </p>
    </div>
  );
}

const sample: SignatureStroke[] = [
  [
    { x: 40, y: 90 },
    { x: 60, y: 50 },
    { x: 85, y: 95 },
    { x: 105, y: 55 },
    { x: 130, y: 92 },
    { x: 160, y: 70 },
    { x: 200, y: 88 },
    { x: 250, y: 74 },
  ],
];

export function ReadOnly() {
  return (
    <div style={{ width: '100%', maxWidth: 520 }}>
      <SignaturePad label="Signature of Priya Nair" defaultValue={sample} readOnly height={140} />
    </div>
  );
}

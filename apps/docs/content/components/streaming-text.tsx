import * as React from 'react';
import { Button, StreamingText } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'streaming-text',
  name: 'StreamingText',
  category: 'ai',
  summary:
    'Reveals text at a steady pace as it arrives, with an optional caret, and never animates what is already on screen.',
  description:
    'Pass StreamingText the full text so far and it reveals each new part at an even pace, however unevenly the text arrives. Text that is complete when it first appears is shown at once. Use it for the body of an assistant message; for a label of work in progress use ShimmerText.',
  imports: ['StreamingText'],
  status: 'beta',
  examples: [
    {
      name: 'Basic',
      title: 'A streamed answer',
      description: 'Text arrives in uneven bursts and is revealed word by word.',
      layout: 'fill',
    },
    {
      name: 'Cadence',
      title: 'Cadence',
      description: 'Reveal by word, by character, or all at once.',
      layout: 'fill',
    },
    {
      name: 'Replaced',
      title: 'Replaced text',
      description: 'When the text is replaced, only the part that changed is revealed again.',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'StreamingText',
      name: 'text',
      type: 'string',
      required: true,
      description: 'The full text so far. Pass the growing string as it arrives.',
    },
    {
      component: 'StreamingText',
      name: 'streaming',
      type: 'boolean',
      default: 'false',
      description: 'True while more text is expected.',
    },
    {
      component: 'StreamingText',
      name: 'cadence',
      type: "'char' | 'word' | 'instant'",
      default: "'word'",
      description: 'How text is revealed: one character, one word, or all at once.',
    },
    {
      component: 'StreamingText',
      name: 'caret',
      type: 'boolean',
      default: 'false',
      description: 'Shows a caret after the text while it is streaming or being revealed.',
    },
    {
      component: 'StreamingText',
      name: 'onRevealEnd',
      type: '() => void',
      description: 'Called once when the stream has ended and all text is on screen.',
    },
    {
      component: 'StreamingText',
      name: 'as',
      type: 'React.ElementType',
      default: "'span'",
      description: 'The element to render.',
    },
    {
      component: 'StreamingText',
      name: 'interval',
      type: 'number',
      description:
        'Milliseconds per revealed chunk. Defaults to the --st-duration-stream token, 24ms.',
    },
  ],
  accessibility: [
    'Partial text is hidden from assistive technology and the element is marked busy, so screen readers get the text once, when it is complete.',
    'Nothing is announced per word or per character.',
    'With reduced motion the text appears at once and the caret does not blink.',
    'Revealed text never moves: the word being typed already holds its space, so it cannot jump to the next line half way through.',
    'Focus is never moved.',
  ],
  guidelines: {
    do: [
      'Pass the whole text so far each time, not only the new part.',
      'Set streaming to false when the response ends, so the text is exposed to screen readers.',
    ],
    dont: [
      'Use it for text that is already complete; plain text is enough.',
      'Wrap it in a live region of your own. Announce the finished message once instead.',
    ],
  },
  related: ['message', 'thinking-indicator', 'shimmer-text', 'streaming-skeleton'],
};

const answer =
  'The first term ends on 30 June 2027. After that the agreement renews for one year at a time unless either side gives 90 days notice in writing.';

function useFakeStream(full: string) {
  const [text, setText] = React.useState(full);
  const [streaming, setStreaming] = React.useState(false);
  const timer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearInterval(timer.current), []);
  const start = () => {
    window.clearInterval(timer.current);
    let length = 0;
    setText('');
    setStreaming(true);
    timer.current = window.setInterval(() => {
      length = Math.min(full.length, length + 18);
      setText(full.slice(0, length));
      if (length >= full.length) {
        window.clearInterval(timer.current);
        setStreaming(false);
      }
    }, 320);
  };
  return { text, streaming, start };
}

export function Basic() {
  const { text, streaming, start } = useFakeStream(answer);
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 480 }}>
      <StreamingText as="p" text={text} streaming={streaming} caret style={{ margin: 0 }} />
      <div>
        <Button size="sm" variant="outline" onClick={start} disabled={streaming}>
          Play again
        </Button>
      </div>
    </div>
  );
}

export function Cadence() {
  const { text, streaming, start } = useFakeStream(answer);
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 480 }}>
      <StreamingText as="p" text={text} streaming={streaming} cadence="word" />
      <StreamingText as="p" text={text} streaming={streaming} cadence="char" />
      <StreamingText as="p" text={text} streaming={streaming} cadence="instant" />
      <div>
        <Button size="sm" variant="outline" onClick={start} disabled={streaming}>
          Play again
        </Button>
      </div>
    </div>
  );
}

export function Replaced() {
  const [long, setLong] = React.useState(false);
  const text = long
    ? 'The notice period is 90 days, counted from the day the written notice is received.'
    : 'The notice period is 90 days.';
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 480 }}>
      <StreamingText as="p" text={text} style={{ margin: 0 }} />
      <div>
        <Button size="sm" variant="outline" onClick={() => setLong((v) => !v)}>
          {long ? 'Shorter answer' : 'Longer answer'}
        </Button>
      </div>
    </div>
  );
}

import { describe, expect, it } from 'vitest';
import {
  parseMarkdown,
  sanitizeImageUrl,
  sanitizeLinkUrl,
  type MarkdownBlock,
  type MarkdownInline,
} from './markdown';

const text = (value: string): MarkdownInline => ({ type: 'text', value });
const inline = (source: string, options = {}) => {
  const [block] = parseMarkdown(source, options);
  if (!block || block.type !== 'paragraph') throw new Error(`not a paragraph: ${source}`);
  return block.children;
};

/** Flattens a tree to the text a reader would see, to compare renders across prefixes. */
function visible(blocks: MarkdownBlock[]): string {
  const inl = (nodes: MarkdownInline[]): string =>
    nodes
      .map((n) =>
        n.type === 'text' || n.type === 'code'
          ? n.value
          : n.type === 'image'
            ? n.alt
            : n.type === 'break'
              ? '\n'
              : n.type === 'citation'
                ? `[${n.index}]`
                : inl(n.children),
      )
      .join('');
  return blocks
    .map((b) => {
      switch (b.type) {
        case 'heading':
        case 'paragraph':
          return inl(b.children);
        case 'blockquote':
          return visible(b.children);
        case 'list':
          return b.items.map((i) => visible(i.children)).join('\n');
        case 'code':
          return b.value;
        case 'hr':
          return '';
        case 'table':
          return [b.header, ...b.rows].map((r) => r.map(inl).join(' ')).join('\n');
      }
    })
    .join('\n');
}

describe('parseMarkdown blocks', () => {
  it('parses headings, paragraphs and rules', () => {
    expect(parseMarkdown('# One\n\nText here\nsame paragraph\n\n---\n\n###### Six ##')).toEqual([
      { type: 'heading', level: 1, children: [text('One')] },
      { type: 'paragraph', children: [text('Text here\nsame paragraph')] },
      { type: 'hr' },
      { type: 'heading', level: 6, children: [text('Six')] },
    ]);
  });

  it('needs a space after the hashes and supports setext headings', () => {
    expect(parseMarkdown('#tag')[0]).toEqual({ type: 'paragraph', children: [text('#tag')] });
    expect(parseMarkdown('Title\n=====\n\nSub\n---')).toEqual([
      { type: 'heading', level: 1, children: [text('Title')] },
      { type: 'heading', level: 2, children: [text('Sub')] },
    ]);
  });

  it('parses fenced code with a language and keeps the content literal', () => {
    const [block] = parseMarkdown('```ts\nconst a = "<b>";\n  **not bold**\n```\nafter');
    expect(block).toEqual({
      type: 'code',
      language: 'ts',
      value: 'const a = "<b>";\n  **not bold**',
      closed: true,
    });
    expect(parseMarkdown('~~~\na\n```\nb\n~~~')[0]).toMatchObject({ value: 'a\n```\nb' });
  });

  it('keeps an unclosed fence open to the end', () => {
    expect(parseMarkdown('```js\nlet a = 1;\n\n# not a heading')).toEqual([
      { type: 'code', language: 'js', value: 'let a = 1;\n\n# not a heading', closed: false },
    ]);
  });

  it('parses block quotes with nested blocks and lazy lines', () => {
    expect(parseMarkdown('> # Quote\n> text\nlazy\n>\n> - item\n\nout')).toEqual([
      {
        type: 'blockquote',
        children: [
          { type: 'heading', level: 1, children: [text('Quote')] },
          { type: 'paragraph', children: [text('text\nlazy')] },
          {
            type: 'list',
            ordered: false,
            start: 1,
            tight: true,
            items: [{ children: [{ type: 'paragraph', children: [text('item')] }] }],
          },
        ],
      },
      { type: 'paragraph', children: [text('out')] },
    ]);
  });

  it('parses tight, loose, ordered and nested lists', () => {
    const [tight] = parseMarkdown('- a\n- b\n  - c\n  - d\n- e');
    expect(tight).toMatchObject({ type: 'list', ordered: false, tight: true });
    if (tight?.type !== 'list') throw new Error('list');
    expect(tight.items).toHaveLength(3);
    expect(tight.items[1]!.children[1]).toMatchObject({ type: 'list', items: [{}, {}] });

    const [loose] = parseMarkdown('1. a\n\n2. b');
    expect(loose).toMatchObject({ type: 'list', ordered: true, start: 1, tight: false });

    const [from] = parseMarkdown('7) seven\n8) eight');
    expect(from).toMatchObject({ ordered: true, start: 7, items: [{}, {}] });
  });

  it('keeps continuation paragraphs and code inside a list item', () => {
    const [list] = parseMarkdown('1. first\n\n   more\n\n   ```sh\n   npm i\n   ```\n2. second');
    if (list?.type !== 'list') throw new Error('list');
    expect(list.items).toHaveLength(2);
    expect(list.items[0]!.children.map((b) => b.type)).toEqual(['paragraph', 'paragraph', 'code']);
    expect(list.items[0]!.children[2]).toMatchObject({ language: 'sh', value: 'npm i' });
  });

  it('starts a new list when the marker changes and ends a list at a paragraph', () => {
    expect(parseMarkdown('- a\n+ b\n\ntext').map((b) => b.type)).toEqual([
      'list',
      'list',
      'paragraph',
    ]);
    expect(parseMarkdown('text\n2. not a list')).toHaveLength(1);
    expect(parseMarkdown('text\n- a list').map((b) => b.type)).toEqual(['paragraph', 'list']);
  });

  it('parses task lists', () => {
    const [list] = parseMarkdown('- [x] done\n- [ ] todo\n- [X] also\n- plain [x]');
    if (list?.type !== 'list') throw new Error('list');
    expect(list.items.map((i) => i.checked)).toEqual([true, false, true, undefined]);
    expect(list.items[0]!.children[0]).toEqual({ type: 'paragraph', children: [text('done')] });
  });

  it('parses GFM tables with alignment, escapes and short rows', () => {
    const [table] = parseMarkdown(
      '| Name | Qty | Note |\n|:--|--:|:-:|\n| A \\| B | 2 | **x** |\n| C |\n\nafter',
    );
    expect(table).toEqual({
      type: 'table',
      align: ['start', 'end', 'center'],
      header: [[text('Name')], [text('Qty')], [text('Note')]],
      rows: [
        [[text('A | B')], [text('2')], [{ type: 'strong', children: [text('x')] }]],
        [[text('C')], [], []],
      ],
    });
    expect(parseMarkdown('a | b\n--- | ---\n1 | 2')[0]).toMatchObject({ type: 'table' });
    expect(parseMarkdown('a | b\n---\n1 | 2')[0]).toMatchObject({ type: 'heading' });
    expect(parseMarkdown('a | b\nc | d')[0]).toMatchObject({ type: 'paragraph' });
  });

  it('lets a table follow a paragraph line directly', () => {
    expect(parseMarkdown('Results:\n| a | b |\n|---|---|\n| 1 | 2 |').map((b) => b.type)).toEqual([
      'paragraph',
      'table',
    ]);
  });

  it('normalises line endings and tabs', () => {
    expect(parseMarkdown('a\r\nb\r\rc')).toHaveLength(2);
    expect(parseMarkdown('-\ta').map((b) => b.type)).toEqual(['paragraph']);
    expect(parseMarkdown('- a\n\t- b')[0]).toMatchObject({ type: 'list', items: [{}] });
  });

  it('treats raw HTML as text', () => {
    expect(inline('<script>alert(1)</script> <img src=x onerror=alert(1)>')).toEqual([
      text('<script>alert(1)</script> <img src=x onerror=alert(1)>'),
    ]);
    expect(parseMarkdown('<div onclick="x()">\n\nhi\n\n</div>').map((b) => b.type)).toEqual([
      'paragraph',
      'paragraph',
      'paragraph',
    ]);
  });
});

describe('parseMarkdown inlines', () => {
  it('parses emphasis, strong, both and strikethrough', () => {
    expect(inline('*a* **b** ***c*** ~~d~~ _e_ __f__')).toEqual([
      { type: 'em', children: [text('a')] },
      text(' '),
      { type: 'strong', children: [text('b')] },
      text(' '),
      { type: 'em', children: [{ type: 'strong', children: [text('c')] }] },
      text(' '),
      { type: 'del', children: [text('d')] },
      text(' '),
      { type: 'em', children: [text('e')] },
      text(' '),
      { type: 'strong', children: [text('f')] },
    ]);
  });

  it('nests emphasis', () => {
    expect(inline('**bold *both* bold**')).toEqual([
      {
        type: 'strong',
        children: [text('bold '), { type: 'em', children: [text('both')] }, text(' bold')],
      },
    ]);
  });

  it('leaves loose markers alone', () => {
    expect(inline('2 * 3 * 4')).toEqual([text('2 * 3 * 4')]);
    expect(inline('snake_case_name and a_b')).toEqual([text('snake_case_name and a_b')]);
    expect(inline('*open only')).toEqual([text('*open only')]);
    expect(inline('~one~ ~~~three~~~')).toEqual([text('~one~ ~~~three~~~')]);
    expect(inline('** not strong **')).toEqual([text('** not strong **')]);
  });

  it('parses code spans and keeps their content literal', () => {
    expect(inline('use `a*b*` and ``a ` b`` now')).toEqual([
      text('use '),
      { type: 'code', value: 'a*b*' },
      text(' and '),
      { type: 'code', value: 'a ` b' },
      text(' now'),
    ]);
    expect(inline('a ` b')).toEqual([text('a ` b')]);
  });

  it('handles escapes, entities and line breaks', () => {
    expect(inline('\\*not\\* \\[x\\] &amp; &lt;b&gt; &#65;&#x42; &nope; \\a')).toEqual([
      text('*not* [x] & <b> AB &nope; \\a'),
    ]);
    expect(inline('one  \ntwo\\\nthree\nfour')).toEqual([
      text('one'),
      { type: 'break' },
      text('two'),
      { type: 'break' },
      text('three\nfour'),
    ]);
  });

  it('parses links with titles, angle addresses and nested brackets', () => {
    expect(inline('[a **b**](https://x.test/p(1) "T") [c](</a b>) [d [e]](/rel)')).toEqual([
      {
        type: 'link',
        href: 'https://x.test/p(1)',
        title: 'T',
        children: [text('a '), { type: 'strong', children: [text('b')] }],
      },
      text(' '),
      { type: 'link', href: '/a b', children: [text('c')] },
      text(' '),
      { type: 'link', href: '/rel', children: [text('d [e]')] },
    ]);
  });

  it('keeps brackets that are not links', () => {
    expect(inline('[x] and [y](not a link) and [z]')).toEqual([
      text('[x] and [y](not a link) and [z]'),
    ]);
  });

  it('parses autolinks, bare addresses and trims trailing punctuation', () => {
    expect(inline('<https://a.test> <me@a.test> see https://b.test/x?y=1. (www.c.test)')).toEqual([
      { type: 'link', href: 'https://a.test', children: [text('https://a.test')] },
      text(' '),
      { type: 'link', href: 'mailto:me@a.test', children: [text('me@a.test')] },
      text(' see '),
      { type: 'link', href: 'https://b.test/x?y=1', children: [text('https://b.test/x?y=1')] },
      text('. ('),
      { type: 'link', href: 'https://www.c.test', children: [text('www.c.test')] },
      text(')'),
    ]);
    expect(inline('xhttps://a.test and http:// alone')).toEqual([
      text('xhttps://a.test and http:// alone'),
    ]);
  });

  it('parses images and only allows web addresses for them', () => {
    expect(inline('![A *cat*](https://a.test/c.png "Cat")')).toEqual([
      { type: 'image', src: 'https://a.test/c.png', alt: 'A cat', title: 'Cat' },
    ]);
    expect(inline('![x](data:image/svg+xml;base64,AAAA)')).toEqual([
      { type: 'image', src: undefined, alt: 'x' },
    ]);
  });

  it('turns numbered markers into citations only when asked', () => {
    expect(inline('Fact [1][23] and [a].', { citations: true })).toEqual([
      text('Fact '),
      { type: 'citation', index: 1 },
      { type: 'citation', index: 23 },
      text(' and [a].'),
    ]);
    expect(inline('Fact [1].')).toEqual([text('Fact [1].')]);
    expect(inline('`[1]` \\[2\\]', { citations: true })).toEqual([
      { type: 'code', value: '[1]' },
      text(' [2]'),
    ]);
  });
});

describe('address checks', () => {
  it.each([
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    ' javascript:alert(1)',
    'java\tscript:alert(1)',
    'java\nscript:alert(1)',
    '\u0001javascript:alert(1)',
    'jav\u200bascript:alert(1)',
    'vbscript:msgbox(1)',
    'data:text/html,<script>alert(1)</script>',
    'file:///etc/passwd',
    'blob:https://a.test/1',
    'tel:112',
    'x-app://open',
  ])('rejects %j as a link', (url) => {
    expect(sanitizeLinkUrl(url)).toBeUndefined();
  });

  it.each([
    'https://a.test',
    'HTTP://a.test',
    'mailto:me@a.test',
    '/path?x=1#y',
    './a',
    '../a',
    '#top',
    '?q=1',
    'page.html',
    '//a.test/x',
    '',
  ])('allows %j as a link', (url) => {
    expect(sanitizeLinkUrl(url)).toBe(url);
  });

  it('does not allow mailto or data for images', () => {
    expect(sanitizeImageUrl('mailto:me@a.test')).toBeUndefined();
    expect(sanitizeImageUrl('data:image/png;base64,AA')).toBeUndefined();
    expect(sanitizeImageUrl('/a.png')).toBe('/a.png');
  });

  it('drops unsafe addresses from the tree in every link form', () => {
    const sources = [
      '[x](javascript:alert(1))',
      '[x](<javascript:alert(1)>)',
      '[x](JAVASCRIPT:alert\\(1\\))',
      '[x](&#106;avascript:alert(1))',
      '[x](&#x6A;avascript:alert(1))',
      '[x](java&#9;script:alert(1))',
      '[x](data:text/html;base64,PHNjcmlwdD4=)',
      '<javascript:alert(1)>',
      '[x](  javascript:alert(1)  )',
      '[x](vbscript:x "t")',
    ];
    for (const source of sources) {
      const json = JSON.stringify(parseMarkdown(source));
      expect(json, source).not.toMatch(/"href":"[^"]*script:/i);
      expect(json, source).not.toMatch(/"href":"data:/i);
    }
  });
});

describe('hostile input', () => {
  const within = (ms: number, run: () => void) => {
    const start = performance.now();
    run();
    expect(performance.now() - start).toBeLessThan(ms);
  };
  const depth = (nodes: MarkdownInline[]): number =>
    nodes.reduce((max, n) => Math.max(max, 'children' in n ? 1 + depth(n.children) : 0), 0);

  it('survives emphasis bombs quickly and keeps the tree shallow', () => {
    within(1500, () => {
      for (const source of [
        '*'.repeat(50000) + 'a',
        '*a '.repeat(20000),
        '*a'.repeat(5000) + '*'.repeat(5000),
        '**a *b '.repeat(5000) + '*c** '.repeat(5000),
        '_'.repeat(20000) + 'a' + '_'.repeat(20000),
        '*_~~'.repeat(10000),
        'a**b'.repeat(20000),
      ]) {
        const blocks = parseMarkdown(source);
        const first = blocks[0];
        if (first?.type === 'paragraph') expect(depth(first.children)).toBeLessThanOrEqual(25);
      }
    });
  });

  it('survives bracket, backtick, entity and link bombs quickly', () => {
    within(1500, () => {
      for (const source of [
        '['.repeat(50000),
        '[a]('.repeat(10000),
        '['.repeat(5000) + 'a' + '](x)'.repeat(5000),
        '!['.repeat(20000) + ']'.repeat(20000),
        '`'.repeat(50000) + 'a',
        Array.from({ length: 3000 }, (_, i) => '`'.repeat(i + 1) + 'a').join(' '),
        '&'.repeat(50000),
        '<'.repeat(50000),
        'http://'.repeat(10000),
        '\\'.repeat(50001),
        '[1]'.repeat(10000),
      ]) {
        expect(() => parseMarkdown(source, { citations: true })).not.toThrow();
        expect(() => parseMarkdown(source, { streaming: true })).not.toThrow();
      }
    });
  });

  it('survives block nesting bombs', () => {
    within(1500, () => {
      for (const source of [
        '>'.repeat(20000) + ' a',
        '> '.repeat(5000) + 'a',
        Array.from({ length: 2000 }, (_, i) => ' '.repeat(i * 2) + '- a').join('\n'),
        '- '.repeat(5000) + 'a',
        '1. '.repeat(5000) + 'a',
        '|'.repeat(20000) + '\n' + '|-'.repeat(10000),
        '#'.repeat(50000),
        '\n'.repeat(50000),
        '```\n'.repeat(10000),
      ]) {
        expect(() => parseMarkdown(source)).not.toThrow();
      }
    });
  });

  it('never throws on odd values', () => {
    expect(parseMarkdown('')).toEqual([]);
    expect(parseMarkdown('   \n\n  ')).toEqual([]);
    expect(parseMarkdown(undefined as unknown as string)).toEqual([]);
    expect(() => parseMarkdown(42 as unknown as string)).not.toThrow();
    expect(() => parseMarkdown('\u0000\ud800 \uffff')).not.toThrow();
  });
});

const longDocument = `# Quarterly review

Revenue grew **12%** against the plan, *mostly* from renewals [1]. See the
[full report](https://example.test/report "Report") or write to <team@example.test>.

## Details

1. First item with \`inline code\` and ~~old text~~
2. Second item
   - nested **bold**
   - nested [link](/relative)

   A paragraph inside the item.
3. Third

- [x] Reviewed
- [ ] Approved

> A quote with *emphasis*
> over two lines.

| Region | Revenue | Change |
|:-------|--------:|:------:|
| North  | 1,200   | **+4%** |
| South  | 900     | -2%    |

\`\`\`ts
export function sum(a: number, b: number) {
  return a + b; // **not bold**
}
\`\`\`

Setext heading
--------------

Final line with a bare https://example.test/path, an image ![chart](https://example.test/c.png)
and a hard
break. Done ***now***.
`;

describe('streaming', () => {
  it('parses every prefix of a long document without throwing', () => {
    for (let i = 0; i <= longDocument.length; i++) {
      const prefix = longDocument.slice(0, i);
      expect(() => parseMarkdown(prefix, { streaming: true, citations: true })).not.toThrow();
      expect(() => parseMarkdown(prefix)).not.toThrow();
    }
  });

  it('ends at the same tree as a plain parse', () => {
    expect(parseMarkdown(longDocument, { streaming: true })).toEqual(parseMarkdown(longDocument));
  });

  it('never shows emphasis, code or link markers that are about to be consumed', () => {
    const source = 'Start **bold text** then *soft* and `code` and [a link](https://a.test) end';
    for (let i = 0; i <= source.length; i++) {
      const shown = visible(parseMarkdown(source.slice(0, i), { streaming: true }));
      expect(shown, `prefix ${i}`).not.toMatch(/[*`\]]|\(http/);
    }
  });

  it('shows unclosed emphasis as emphasis while the text arrives', () => {
    expect(inline('Some **bold te', { streaming: true })).toEqual([
      text('Some '),
      { type: 'strong', children: [text('bold te')] },
    ]);
    expect(inline('Some ***both', { streaming: true })).toEqual([
      text('Some '),
      { type: 'strong', children: [{ type: 'em', children: [text('both')] }] },
    ]);
    expect(inline('Some ~~gone', { streaming: true })).toEqual([
      text('Some '),
      { type: 'del', children: [text('gone')] },
    ]);
    expect(inline('Some **', { streaming: true })).toEqual([text('Some ')]);
    expect(inline('Run `npm te', { streaming: true })).toEqual([
      text('Run '),
      { type: 'code', value: 'npm te' },
    ]);
    // A finished paragraph is read strictly.
    expect(parseMarkdown('Some **bold te\n\nnext', { streaming: true })[0]).toEqual({
      type: 'paragraph',
      children: [text('Some **bold te')],
    });
  });

  it('holds a half written link as its text', () => {
    expect(inline('See [the docs](https://exa', { streaming: true })).toEqual([
      text('See the docs'),
    ]);
    expect(inline('See [the docs](/gui')).toEqual([text('See [the docs](/gui')]);
  });

  it('shows a table from its header row on, with no paragraph flash', () => {
    const table = '| Name | Qty |\n|------|----:|\n| Pens | 12 |\n| Ink | 3 |';
    for (let i = 3; i <= table.length; i++) {
      const blocks = parseMarkdown(table.slice(0, i), { streaming: true });
      expect(
        blocks.map((b) => b.type),
        `prefix ${i}`,
      ).toEqual(['table']);
    }
    const half = parseMarkdown('| Name | Qty |\n|------|----:|\n| Pens |', { streaming: true })[0];
    expect(half).toMatchObject({ rows: [[[text('Pens')], []]] });
  });

  it('keeps an open fence as code and hides a half written closing fence', () => {
    expect(parseMarkdown('```py\nprint(1)\n``', { streaming: true })).toEqual([
      { type: 'code', language: 'py', value: 'print(1)', closed: false },
    ]);
    expect(parseMarkdown('```py\nprint(1)\n```', { streaming: true })[0]).toMatchObject({
      closed: true,
    });
  });

  it('waits on a lone marker at the end instead of guessing', () => {
    for (const marker of ['-', '--', '*', '1.', '#', '##', '>', '`', '``', '='])
      expect(parseMarkdown(`Text\n\n${marker}`, { streaming: true }), marker).toHaveLength(1);
    expect(parseMarkdown('Text\n\n-')).toHaveLength(2);
  });

  it('keeps earlier blocks identical as text is added', () => {
    let previous: MarkdownBlock[] = [];
    for (let i = 0; i <= longDocument.length; i += 7) {
      const blocks = parseMarkdown(longDocument.slice(0, i), { streaming: true });
      // Every block but the last two of the previous render is final.
      for (let b = 0; b < previous.length - 2; b++)
        expect(blocks[b], `prefix ${i} block ${b}`).toEqual(previous[b]);
      previous = blocks;
    }
  });
});

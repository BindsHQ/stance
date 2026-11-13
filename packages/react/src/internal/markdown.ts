/**
 * A small, safe Markdown parser for model output. It covers a CommonMark subset plus GFM
 * tables, task lists, strikethrough and autolinks, and returns a plain tree. Nothing here
 * produces HTML: raw HTML in the source stays text, and link and image addresses are
 * checked against a short list of protocols before they reach the tree.
 *
 * Not supported on purpose: raw HTML, reference style links, footnotes and indented code
 * blocks (fenced code is the form models write).
 */

export type MarkdownInline =
  | { type: 'text'; value: string }
  | { type: 'strong' | 'em' | 'del'; children: MarkdownInline[] }
  | { type: 'code'; value: string }
  | { type: 'link'; href: string | undefined; title?: string; children: MarkdownInline[] }
  | { type: 'image'; src: string | undefined; alt: string; title?: string }
  | { type: 'break' }
  | { type: 'citation'; index: number };

export type MarkdownAlign = 'start' | 'center' | 'end' | undefined;

export interface MarkdownListItem {
  /** `true` or `false` for a task list item, `undefined` for a plain item. */
  checked?: boolean;
  children: MarkdownBlock[];
}

export type MarkdownBlock =
  | { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; children: MarkdownInline[] }
  | { type: 'paragraph'; children: MarkdownInline[] }
  | { type: 'blockquote'; children: MarkdownBlock[] }
  | { type: 'list'; ordered: boolean; start: number; tight: boolean; items: MarkdownListItem[] }
  | { type: 'code'; language?: string; value: string; closed: boolean }
  | { type: 'hr' }
  | {
      type: 'table';
      align: MarkdownAlign[];
      header: MarkdownInline[][];
      rows: MarkdownInline[][][];
    };

export interface ParseMarkdownOptions {
  /**
   * The text is still arriving. The end of the text is then read generously: an open code
   * fence, a table without its rows, unclosed emphasis and a half written link all render
   * as what they are about to become, so nothing flips when the rest arrives.
   */
  streaming?: boolean;
  /** Turn `[1]` style markers into citation nodes. */
  citations?: boolean;
}

interface Ctx {
  streaming: boolean;
  citations: boolean;
}

const MAX_BLOCK_DEPTH = 12;
const MAX_INLINE_DEPTH = 24;
const MAX_LINK_DEPTH = 6;

/* ------------------------------------------------------------------ */
/* Addresses                                                           */
/* ------------------------------------------------------------------ */

const SCHEME = /^([a-z][a-z0-9+.-]*):/i;

function cleanUrl(url: string): string {
  // Browsers drop these characters before reading the scheme, so they must not hide one.
  // eslint-disable-next-line no-control-regex
  return url.replace(/[\u0000-\u0020\u007f-\u009f\u200b-\u200f\u2028\u2029\ufeff]/g, '');
}

/**
 * Returns the address when it is safe to use as a link: http, https, mailto or a relative
 * address. Anything else, such as `javascript:` or `data:`, returns undefined.
 */
export function sanitizeLinkUrl(url: string): string | undefined {
  const trimmed = url.trim();
  const scheme = SCHEME.exec(cleanUrl(trimmed))?.[1]?.toLowerCase();
  if (scheme === undefined) return trimmed;
  return scheme === 'http' || scheme === 'https' || scheme === 'mailto' ? trimmed : undefined;
}

/** Like `sanitizeLinkUrl` for image sources: http, https or relative only. */
export function sanitizeImageUrl(url: string): string | undefined {
  const trimmed = url.trim();
  const scheme = SCHEME.exec(cleanUrl(trimmed))?.[1]?.toLowerCase();
  if (scheme === undefined) return trimmed;
  return scheme === 'http' || scheme === 'https' ? trimmed : undefined;
}

/* ------------------------------------------------------------------ */
/* Blocks                                                              */
/* ------------------------------------------------------------------ */

const FENCE = /^ {0,3}(`{3,}|~{3,})[ \t]*([^`\s]*)[^`]*$/;
const HEADING = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$/;
const HR = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/;
const QUOTE = /^ {0,3}>/;
const LIST = /^( {0,3})([-*+]|\d{1,9}[.)])( +|$)(.*)$/;
const SETEXT = /^ {0,3}(=+|-+)[ \t]*$/;
const TABLE_RULE_CELL = /^:?-+:?$/;
const PENDING_RULE = /^[\s:|-]*$/;
const AMBIGUOUS_TAIL = /^\s*(?:[-*_=~]{1,2}|`{1,2}|\d{1,9}[.)]|#{1,6}|>)\s*$/;
const TASK = /^\[([ xX])\](?:\s+|$)/;

const isBlank = (line: string) => line.trim() === '';
const indentOf = (line: string) => line.length - line.trimStart().length;

/** Whether a line begins a block that may interrupt a paragraph. */
function startsBlock(line: string): boolean {
  if (FENCE.test(line) || HEADING.test(line) || HR.test(line) || QUOTE.test(line)) return true;
  const m = LIST.exec(line);
  if (!m || !m[4]) return false;
  // Only a list that starts at 1 may interrupt a paragraph.
  return /^[-*+]$/.test(m[2]!) || m[2] === '1.' || m[2] === '1)';
}

function splitRow(line: string): string[] {
  let row = line.trim();
  if (row.startsWith('|')) row = row.slice(1);
  if (row.endsWith('|') && !row.endsWith('\\|')) row = row.slice(0, -1);
  const cells: string[] = [];
  let cell = '';
  for (let i = 0; i < row.length; i++) {
    const c = row[i]!;
    if (c === '\\' && row[i + 1] === '|') {
      cell += '|';
      i++;
    } else if (c === '|') {
      cells.push(cell.trim());
      cell = '';
    } else cell += c;
  }
  cells.push(cell.trim());
  return cells;
}

function tableRule(line: string | undefined, columns: number): MarkdownAlign[] | null {
  if (line === undefined || !line.includes('-')) return null;
  const cells = splitRow(line);
  if (cells.length !== columns || !cells.every((c) => TABLE_RULE_CELL.test(c))) return null;
  return cells.map((c) => {
    const left = c.startsWith(':');
    const right = c.endsWith(':');
    return left && right ? 'center' : right ? 'end' : left ? 'start' : undefined;
  });
}

type TableStart = { align: MarkdownAlign[]; header: string[]; next: number } | null;

/** Looks for a table header at line `i`. While streaming, a header at the very end counts. */
function tableAt(lines: string[], i: number, ctx: Ctx, atEnd: boolean): TableStart {
  const line = lines[i]!;
  if (!line.includes('|')) return null;
  const header = splitRow(line);
  const align = tableRule(lines[i + 1], header.length);
  if (align) return { align, header, next: i + 2 };
  if (!ctx.streaming || !atEnd || !line.trimStart().startsWith('|')) return null;
  const last = lines.length - 1;
  if (i === last) return { align: header.map(() => undefined), header, next: i + 1 };
  if (i === last - 1 && PENDING_RULE.test(lines[last]!))
    return { align: header.map(() => undefined), header, next: i + 2 };
  return null;
}

function parseBlocks(lines: string[], ctx: Ctx, depth: number, atEnd: boolean): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const n = lines.length;
  const tail = (lastLine: number) => ctx.streaming && atEnd && lastLine === n - 1;
  let i = 0;
  while (i < n) {
    const line = lines[i]!;
    if (isBlank(line)) {
      i++;
      continue;
    }

    const fence = FENCE.exec(line);
    if (fence) {
      const marker = fence[1]!;
      const indent = indentOf(line);
      const close = new RegExp(
        `^ {0,3}${marker[0] === '`' ? '`' : '~'}{${marker.length},}[ \\t]*$`,
      );
      const body: string[] = [];
      let closed = false;
      i++;
      while (i < n) {
        if (close.test(lines[i]!)) {
          closed = true;
          i++;
          break;
        }
        const row = lines[i]!;
        body.push(row.slice(Math.min(indent, indentOf(row))));
        i++;
      }
      const block: MarkdownBlock = { type: 'code', value: body.join('\n'), closed };
      if (fence[2]) block.language = fence[2];
      blocks.push(block);
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      blocks.push({
        type: 'heading',
        level: heading[1]!.length as 1,
        children: parseInline(heading[2] ?? '', ctx, tail(i)),
      });
      i++;
      continue;
    }

    if (HR.test(line)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    if (QUOTE.test(line) && depth < MAX_BLOCK_DEPTH) {
      const inner: string[] = [];
      while (i < n) {
        const row = lines[i]!;
        if (QUOTE.test(row)) inner.push(row.replace(/^ {0,3}> ?/, ''));
        else if (isBlank(row) || startsBlock(row) || isBlank(inner[inner.length - 1] ?? '')) break;
        else inner.push(row);
        i++;
      }
      blocks.push({
        type: 'blockquote',
        children: parseBlocks(inner, ctx, depth + 1, tail(i - 1)),
      });
      continue;
    }

    const first = LIST.exec(line);
    if (first && depth < MAX_BLOCK_DEPTH) {
      const ordered = /\d/.test(first[2]!);
      const kind = first[2]!.slice(-1);
      const items: MarkdownListItem[] = [];
      let loose = false;
      let blankBefore = false;
      while (i < n) {
        const row = lines[i]!;
        const m = LIST.exec(row);
        if (!m || /\d/.test(m[2]!) !== ordered || m[2]!.slice(-1) !== kind || HR.test(row)) break;
        if (blankBefore) loose = true;
        const gap = m[3]!.length;
        const content = m[1]!.length + m[2]!.length + (gap >= 1 && gap <= 4 ? gap : 1);
        const inner: string[] = [(gap > 4 ? m[3]!.slice(1) : '') + m[4]!];
        let pendingBlank = false;
        let innerBlank = false;
        i++;
        while (i < n) {
          const next = lines[i]!;
          if (isBlank(next)) {
            inner.push('');
            pendingBlank = true;
          } else if (indentOf(next) >= content) {
            if (pendingBlank) innerBlank = true;
            pendingBlank = false;
            inner.push(next.slice(content));
          } else if (pendingBlank || startsBlock(next) || LIST.test(next)) break;
          else inner.push(next.trimStart());
          i++;
        }
        while (inner.length > 1 && isBlank(inner[inner.length - 1]!)) inner.pop();
        if (innerBlank) loose = true;
        blankBefore = pendingBlank;
        const item: MarkdownListItem = { children: [] };
        const task = TASK.exec(inner[0]!);
        if (task) {
          item.checked = task[1] !== ' ';
          inner[0] = inner[0]!.slice(task[0].length);
        }
        item.children = parseBlocks(inner, ctx, depth + 1, atEnd && i >= n && !pendingBlank);
        items.push(item);
      }
      const start = ordered ? Number.parseInt(first[2]!, 10) : 1;
      blocks.push({ type: 'list', ordered, start, tight: !loose, items });
      continue;
    }

    const table = tableAt(lines, i, ctx, atEnd);
    if (table) {
      const columns = table.header.length;
      const rows: string[][] = [];
      let written = 0;
      i = table.next;
      while (i < n && !isBlank(lines[i]!) && lines[i]!.includes('|') && !startsBlock(lines[i]!)) {
        const cells = splitRow(lines[i]!).slice(0, columns);
        written = cells.length;
        while (cells.length < columns) cells.push('');
        rows.push(cells);
        i++;
      }
      const lastRow = rows.length - 1;
      blocks.push({
        type: 'table',
        align: table.align,
        header: table.header.map((cell, c) =>
          parseInline(cell, ctx, lastRow < 0 && tail(i - 1) && c === columns - 1),
        ),
        rows: rows.map((row, r) =>
          row.map((cell, c) =>
            parseInline(cell, ctx, r === lastRow && tail(i - 1) && c === written - 1),
          ),
        ),
      });
      continue;
    }

    // Paragraph, or a setext heading when it is underlined.
    const text: string[] = [line.trimStart()];
    let level: 0 | 1 | 2 = 0;
    i++;
    while (i < n) {
      const row = lines[i]!;
      if (isBlank(row)) break;
      const rule = SETEXT.exec(row);
      if (rule) {
        level = rule[1]![0] === '=' ? 1 : 2;
        i++;
        break;
      }
      if (startsBlock(row) || tableAt(lines, i, ctx, atEnd)) break;
      text.push(row.trimStart());
      i++;
    }
    const source = text.join('\n').trimEnd();
    if (level) blocks.push({ type: 'heading', level, children: parseInline(source, ctx, false) });
    else blocks.push({ type: 'paragraph', children: parseInline(source, ctx, tail(i - 1)) });
  }
  return blocks;
}

/* ------------------------------------------------------------------ */
/* Inlines                                                             */
/* ------------------------------------------------------------------ */

interface NodeItem {
  kind: 'node';
  node: MarkdownInline;
  prev: Item | null;
  next: Item | null;
}
interface DelimItem {
  kind: 'delim';
  char: string;
  /** Characters of the run not yet used. */
  count: number;
  /** Length of the run as written. */
  length: number;
  open: boolean;
  close: boolean;
  pos: number;
  prev: Item | null;
  next: Item | null;
  /** Neighbours among the delimiters only, so searches never walk over text. */
  dprev: DelimItem | null;
  dnext: DelimItem | null;
}
type Item = NodeItem | DelimItem;

const PUNCT = /[\p{P}\p{S}]/u;
const ASCII_PUNCT = /[!-/:-@[-`{-~]/;
const ENTITY = /&(#\d{1,7}|#[xX][0-9a-fA-F]{1,6}|[a-zA-Z][a-zA-Z0-9]{1,31});/y;
const ANGLE_LINK = /<([a-zA-Z][a-zA-Z0-9+.-]{1,31}:[^\s<>]*)>/y;
const ANGLE_MAIL = /<([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+)>/y;
const BARE_LINK = /(?:https?:\/\/|www\.)[^\s<]+/y;
const entities: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00a0',
  copy: '\u00a9',
  reg: '\u00ae',
  trade: '\u2122',
  hellip: '\u2026',
  mdash: '\u2014',
  ndash: '\u2013',
  lsquo: '\u2018',
  rsquo: '\u2019',
  ldquo: '\u201c',
  rdquo: '\u201d',
  times: '\u00d7',
  rarr: '\u2192',
  larr: '\u2190',
  le: '\u2264',
  ge: '\u2265',
  ne: '\u2260',
  deg: '\u00b0',
  euro: '\u20ac',
  pound: '\u00a3',
};

function decodeEntity(body: string): string | undefined {
  if (body[0] !== '#') return entities[body];
  const code =
    body[1] === 'x' || body[1] === 'X'
      ? Number.parseInt(body.slice(2), 16)
      : Number.parseInt(body.slice(1), 10);
  if (!code || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) return '\ufffd';
  return String.fromCodePoint(code);
}

/** Resolves backslash escapes and entities in a link address or title. */
function unescapeText(text: string): string {
  return text
    .replace(/\\([!-/:-@[-`{-~])/g, '$1')
    .replace(/&(#\d{1,7}|#[xX][0-9a-fA-F]{1,6}|[a-zA-Z][a-zA-Z0-9]{1,31});/g, (all, body) => {
      return decodeEntity(body as string) ?? (all as string);
    });
}

interface Scan {
  /** Position of an opening backtick run to the position of its closing run. */
  code: Map<number, number>;
  /** Position of `[` to the position of its matching `]`. */
  brackets: Map<number, number>;
}

/** One pass that pairs code span delimiters and square brackets. */
function scan(src: string): Scan {
  const runs: { pos: number; len: number }[] = [];
  for (let i = 0; i < src.length; i++) {
    if (src[i] !== '`') continue;
    let j = i;
    while (src[j] === '`') j++;
    runs.push({ pos: i, len: j - i });
    i = j - 1;
  }
  const closing = new Map<number, number>();
  const seen = new Map<number, number>();
  for (let k = runs.length - 1; k >= 0; k--) {
    const run = runs[k]!;
    const later = seen.get(run.len);
    if (later !== undefined) closing.set(run.pos, later);
    seen.set(run.len, run.pos);
  }
  const code = new Map<number, number>();
  const brackets = new Map<number, number>();
  const stack: number[] = [];
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === '\\') i++;
    else if (c === '`') {
      let j = i;
      while (src[j] === '`') j++;
      const end = closing.get(i);
      if (end !== undefined) {
        code.set(i, end);
        i = end + (j - i) - 1;
      } else i = j - 1;
    } else if (c === '[') stack.push(i);
    else if (c === ']' && stack.length) brackets.set(stack.pop()!, i);
  }
  return { code, brackets };
}

type Destination = { href: string; title?: string; end: number } | 'open' | null;

/** Reads `(address "title")` starting at the opening parenthesis. */
function readDestination(src: string, start: number): Destination {
  // An address or title longer than this is not a link. It also bounds the work per bracket.
  const n = Math.min(src.length, start + 1024);
  const open = n === src.length ? 'open' : null;
  let i = start + 1;
  const space = () => {
    while (i < n && (src[i] === ' ' || src[i] === '\n' || src[i] === '\t')) i++;
  };
  space();
  let href: string;
  if (src[i] === '<') {
    let end = i + 1;
    while (end < n && src[end] !== '>' && src[end] !== '\n') end++;
    if (end >= n) return open;
    if (src[end] === '\n') return null;
    href = src.slice(i + 1, end);
    i = end + 1;
  } else {
    let depth = 0;
    const from = i;
    while (i < n) {
      const c = src[i]!;
      if (c === '\\') i++;
      else if (c === ' ' || c === '\n' || c === '\t') break;
      else if (c === '(') depth++;
      else if (c === ')') {
        if (depth === 0) break;
        depth--;
      }
      i++;
    }
    href = src.slice(from, i);
  }
  space();
  let title: string | undefined;
  const quote = src[i];
  if (quote === '"' || quote === "'" || quote === '(') {
    const closer = quote === '(' ? ')' : quote;
    let j = i + 1;
    while (j < n && src[j] !== closer) j += src[j] === '\\' ? 2 : 1;
    if (j >= n) return open;
    title = unescapeText(src.slice(i + 1, j));
    i = j + 1;
    space();
  }
  if (i >= n) return open;
  if (src[i] !== ')') return null;
  const result: Destination = { href: unescapeText(href), end: i + 1 };
  if (title) result.title = title;
  return result;
}

function plainText(nodes: MarkdownInline[]): string {
  let out = '';
  const stack: MarkdownInline[] = [...nodes].reverse();
  while (stack.length) {
    const node = stack.pop()!;
    if (node.type === 'text' || node.type === 'code') out += node.value;
    else if (node.type === 'image') out += node.alt;
    else if (node.type === 'break') out += ' ';
    else if (node.type === 'citation') out += `[${node.index}]`;
    else for (let i = node.children.length - 1; i >= 0; i--) stack.push(node.children[i]!);
  }
  return out;
}

/** Keeps nesting shallow so a hostile input cannot build a tree too deep to render. */
function limitDepth(nodes: MarkdownInline[], depth: number): MarkdownInline[] {
  return nodes.map((node) => {
    if (!('children' in node)) return node;
    if (depth >= MAX_INLINE_DEPTH) return { type: 'text', value: plainText([node]) };
    return { ...node, children: limitDepth(node.children, depth + 1) };
  });
}

function parseInline(src: string, ctx: Ctx, tail: boolean, linkDepth = 0): MarkdownInline[] {
  if (src === '') return [];
  const { code, brackets } = scan(src);
  const n = src.length;
  const inLink = linkDepth > 0;
  let head: Item | null = null;
  let last: Item | null = null;
  let buf = '';

  let dhead: DelimItem | null = null;
  let dlast: DelimItem | null = null;
  const append = (item: Item) => {
    item.prev = last;
    item.next = null;
    if (last) last.next = item;
    else head = item;
    last = item;
    if (item.kind === 'delim') {
      item.dprev = dlast;
      if (dlast) dlast.dnext = item;
      else dhead = item;
      dlast = item;
    }
  };
  const flush = () => {
    if (buf) append({ kind: 'node', node: { type: 'text', value: buf }, prev: null, next: null });
    buf = '';
  };
  const push = (node: MarkdownInline) => {
    flush();
    append({ kind: 'node', node, prev: null, next: null });
  };
  const pushAll = (nodes: MarkdownInline[]) => nodes.forEach(push);
  const inner = (text: string, depthAdd: number) =>
    linkDepth + depthAdd > MAX_LINK_DEPTH
      ? [{ type: 'text', value: text } as MarkdownInline]
      : parseInline(text, ctx, false, linkDepth + depthAdd);

  let i = 0;
  while (i < n) {
    const c = src[i]!;

    if (c === '\\') {
      const next = src[i + 1];
      if (next === '\n') {
        push({ type: 'break' });
        i += 2;
        while (src[i] === ' ') i++;
      } else if (next !== undefined && ASCII_PUNCT.test(next)) {
        buf += next;
        i += 2;
      } else {
        buf += c;
        i++;
      }
      continue;
    }

    if (c === '`') {
      let j = i;
      while (src[j] === '`') j++;
      const end = code.get(i);
      if (end !== undefined) {
        let value = src.slice(j, end).replace(/\n/g, ' ');
        if (value.length > 1 && value.startsWith(' ') && value.endsWith(' ') && value.trim())
          value = value.slice(1, -1);
        push({ type: 'code', value });
        i = end + (j - i);
      } else if (tail && !inLink) {
        // Code that is still being written: show it as code up to the end.
        const value = src.slice(j).replace(/\n/g, ' ');
        if (value.trim()) push({ type: 'code', value: value.replace(/^ /, '') });
        i = n;
      } else {
        buf += src.slice(i, j);
        i = j;
      }
      continue;
    }

    if (c === '\n') {
      const hard = / {2,}$/.test(buf);
      buf = buf.replace(/ +$/, '');
      if (hard) push({ type: 'break' });
      else buf += '\n';
      i++;
      while (src[i] === ' ') i++;
      continue;
    }

    if (c === '*' || c === '_' || c === '~') {
      let j = i;
      while (src[j] === c) j++;
      const count = j - i;
      if (c === '~' && count !== 2) {
        buf += src.slice(i, j);
        i = j;
        continue;
      }
      const before = i > 0 ? src[i - 1]! : ' ';
      const after = j < n ? src[j]! : ' ';
      const wsBefore = /\s/.test(before);
      const wsAfter = /\s/.test(after);
      const pBefore = PUNCT.test(before);
      const pAfter = PUNCT.test(after);
      const left = !wsAfter && (!pAfter || wsBefore || pBefore);
      const right = !wsBefore && (!pBefore || wsAfter || pAfter);
      flush();
      append({
        kind: 'delim',
        char: c,
        count,
        length: count,
        open: c === '_' ? left && (!right || pBefore) : left,
        close: c === '_' ? right && (!left || pAfter) : right,
        pos: i,
        prev: null,
        next: null,
        dprev: null,
        dnext: null,
      });
      i = j;
      continue;
    }

    if (c === '[' || (c === '!' && src[i + 1] === '[')) {
      const image = c === '!';
      const open = image ? i + 1 : i;
      const close = brackets.get(open);
      if (close !== undefined && (image || !inLink)) {
        const label = src.slice(open + 1, close);
        const dest = src[close + 1] === '(' ? readDestination(src, close + 1) : null;
        if (dest && dest !== 'open') {
          if (image) {
            const node: MarkdownInline = {
              type: 'image',
              src: sanitizeImageUrl(dest.href),
              alt: plainText(inner(label, 1)),
            };
            if (dest.title) node.title = dest.title;
            push(node);
          } else {
            const node: MarkdownInline = {
              type: 'link',
              href: sanitizeLinkUrl(dest.href),
              children: inner(label, 1),
            };
            if (dest.title) node.title = dest.title;
            push(node);
          }
          i = dest.end;
          continue;
        }
        if (dest === 'open' && tail) {
          // A link whose address is still arriving: show its text and wait.
          if (!image) pushAll(inner(label, 1));
          i = n;
          continue;
        }
        const numbered = /^\d{1,4}$/.test(label);
        if (!image && ctx.citations && numbered) {
          push({ type: 'citation', index: Number(label) });
          i = close + 1;
          continue;
        }
        if (tail && !image && !numbered && close === n - 1) {
          // Text in brackets at the very end is most often a link about to get its address.
          pushAll(inner(label, 1));
          i = n;
          continue;
        }
      } else if (tail && !inLink && close === undefined) {
        // An open bracket at the end, with its text still arriving: leave the bracket out.
        const before = src[i - 1];
        if (before === undefined || !/[\p{L}\p{N}]/u.test(before)) {
          i = open + 1;
          continue;
        }
      }
      buf += c;
      i++;
      continue;
    }

    if (c === '<' && !inLink) {
      ANGLE_LINK.lastIndex = i;
      ANGLE_MAIL.lastIndex = i;
      const link = ANGLE_LINK.exec(src);
      const mail = link ? null : ANGLE_MAIL.exec(src);
      const match = link ?? mail;
      if (match) {
        const text = match[1]!;
        push({
          type: 'link',
          href: sanitizeLinkUrl(mail ? `mailto:${text}` : text),
          children: [{ type: 'text', value: text }],
        });
        i += match[0].length;
        continue;
      }
    }

    if (c === '&') {
      ENTITY.lastIndex = i;
      const match = ENTITY.exec(src);
      const decoded = match ? decodeEntity(match[1]!) : undefined;
      if (match && decoded !== undefined) {
        buf += decoded;
        i += match[0].length;
        continue;
      }
    }

    if ((c === 'h' || c === 'w') && !inLink && (i === 0 || !/[\p{L}\p{N}_/]/u.test(src[i - 1]!))) {
      BARE_LINK.lastIndex = i;
      const match = BARE_LINK.exec(src);
      if (match) {
        let text = match[0];
        for (;;) {
          const before: string = text;
          text = text.replace(/[?!.,:;*_~'"]+$/, '');
          if (text.endsWith(')') && text.split('(').length < text.split(')').length)
            text = text.slice(0, -1);
          if (text === before) break;
        }
        const www = text.startsWith('www.');
        if (/^(?:https?:\/\/|www\.)[\p{L}\p{N}]/u.test(text) && (!www || text.includes('.', 4))) {
          push({
            type: 'link',
            href: sanitizeLinkUrl(www ? `https://${text}` : text),
            children: [{ type: 'text', value: text }],
          });
          i += text.length;
          continue;
        }
      }
    }

    buf += c;
    i++;
  }
  flush();

  /* Emphasis: the CommonMark delimiter algorithm over the item list. */
  const unlinkDelim = (item: DelimItem) => {
    if (item.dprev) item.dprev.dnext = item.dnext;
    else dhead = item.dnext;
    if (item.dnext) item.dnext.dprev = item.dprev;
    else dlast = item.dprev;
  };
  const replace = (item: Item, by: Item | null) => {
    const before = item.prev;
    const after = item.next;
    if (by) {
      by.prev = before;
      by.next = after;
    }
    if (before) before.next = by ?? after;
    else head = by ?? after;
    if (after) after.prev = by ?? before;
    else last = by ?? before;
  };
  const remove = (item: DelimItem) => {
    unlinkDelim(item);
    replace(item, null);
  };
  const toNode = (item: Item): MarkdownInline =>
    item.kind === 'node' ? item.node : { type: 'text', value: item.char.repeat(item.count) };
  /** Wraps everything after `from` up to, not including, `to` (or to the end). */
  const wrap = (from: DelimItem, to: DelimItem | null, strong: boolean) => {
    const children: MarkdownInline[] = [];
    for (let p = from.next; p && p !== to; p = p.next) children.push(toNode(p));
    const type = from.char === '~' ? 'del' : strong ? 'strong' : 'em';
    const node: NodeItem = {
      kind: 'node',
      node: { type, children: merge(children) },
      prev: from,
      next: to,
    };
    from.next = node;
    from.dnext = to;
    if (to) {
      to.prev = node;
      to.dprev = from;
    } else {
      last = node;
      dlast = from;
    }
  };

  const bottom = new Map<string, number>();
  let closer = dhead as DelimItem | null;
  while (closer) {
    if (!closer.close) {
      closer = closer.dnext;
      continue;
    }
    const key = `${closer.char}${closer.open ? 1 : 0}${closer.length % 3}`;
    const floor = bottom.get(key) ?? -1;
    let opener = closer.dprev;
    let found = false;
    while (opener && opener.pos >= floor) {
      if (opener.char === closer.char && opener.open) {
        const odd =
          (closer.open || opener.close) &&
          closer.length % 3 !== 0 &&
          (opener.length + closer.length) % 3 === 0;
        if (!odd) {
          found = true;
          break;
        }
      }
      opener = opener.dprev;
    }
    if (found && opener) {
      const use = closer.char === '~' ? 2 : closer.count >= 2 && opener.count >= 2 ? 2 : 1;
      wrap(opener, closer, use === 2);
      opener.count -= use;
      closer.count -= use;
      if (opener.count === 0) remove(opener);
      if (closer.count === 0) {
        const next: DelimItem | null = closer.dnext;
        remove(closer);
        closer = next;
      }
    } else {
      bottom.set(key, closer.pos);
      const next: DelimItem | null = closer.dnext;
      if (!closer.open) {
        // It can neither open nor close any more: it is text, and later searches skip it.
        unlinkDelim(closer);
        replace(closer, { kind: 'node', node: toNode(closer), prev: null, next: null });
      }
      closer = next;
    }
  }

  if (tail && !inLink) {
    // The text is still arriving. Hide a marker with nothing after it yet, and treat an
    // opener that has not been closed as open to the end.
    const end = last as Item | null;
    if (end && end.kind === 'delim') remove(end);
    let opener = dlast as DelimItem | null;
    while (opener) {
      const prev: DelimItem | null = opener.dprev;
      if (opener.open && opener.next) {
        if (opener.char === '~') wrap(opener, null, true);
        else {
          if (opener.count % 2 === 1) wrap(opener, null, false);
          if (opener.count >= 2) wrap(opener, null, true);
        }
        remove(opener);
      }
      opener = prev;
    }
  }

  const out: MarkdownInline[] = [];
  for (let p = head as Item | null; p; p = p.next) out.push(toNode(p));
  const merged = merge(out);
  return linkDepth === 0 ? limitDepth(merged, 0) : merged;
}

/** Joins neighbouring text nodes. */
function merge(nodes: MarkdownInline[]): MarkdownInline[] {
  const out: MarkdownInline[] = [];
  for (const node of nodes) {
    const prev = out[out.length - 1];
    if (node.type === 'text' && prev?.type === 'text')
      out[out.length - 1] = { type: 'text', value: prev.value + node.value };
    else out.push(node);
  }
  return out;
}

/* ------------------------------------------------------------------ */

/** Parses Markdown into a tree of blocks. It never throws, whatever the input. */
export function parseMarkdown(source: string, options: ParseMarkdownOptions = {}): MarkdownBlock[] {
  const ctx: Ctx = { streaming: options.streaming === true, citations: options.citations === true };
  const lines = String(source ?? '')
    .replace(/\r\n?/g, '\n')
    // eslint-disable-next-line no-control-regex
    .replace(/\u0000/g, '\ufffd')
    .split('\n')
    .map((line) => line.replace(/^[ \t]+/, (ws) => ws.replace(/\t/g, '    ')));
  if (ctx.streaming && lines.length) {
    // A lone marker at the very end could become several things. Wait for the next characters.
    const lastLine = lines[lines.length - 1]!;
    const pending = insideFence(lines) ? /^\s*(?:`{1,2}|~{1,2})\s*$/ : AMBIGUOUS_TAIL;
    if (pending.test(lastLine)) lines.pop();
  }
  try {
    return parseBlocks(lines, ctx, 0, true);
  } catch {
    // Unreachable by design. If it ever happens the text is still shown, unformatted.
    return [{ type: 'paragraph', children: [{ type: 'text', value: String(source) }] }];
  }
}

function insideFence(lines: string[]): boolean {
  let open: string | null = null;
  for (let i = 0; i < lines.length - 1; i++) {
    const m = FENCE.exec(lines[i]!);
    if (open === null) {
      if (m) open = m[1]!;
    } else if (new RegExp(`^ {0,3}\\${open[0]}{${open.length},}[ \\t]*$`).test(lines[i]!)) {
      open = null;
    }
  }
  return open !== null;
}

'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import {
  parseMarkdown,
  type MarkdownAlign,
  type MarkdownBlock,
  type MarkdownInline,
} from '../../internal/markdown.js';
import { CitationChip } from '../citation-chip/CitationChip.js';
import { Code } from '../code/Code.js';
import { CodeBlock } from '../code-block/CodeBlock.js';
import type { Source } from '../source-preview/SourcePreview.js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../table/Table.js';

/** The sources behind `[1]` style markers, keyed by the number in the marker. */
export type MarkdownRendererCitations = Record<number, Source>;

/** Props given to the component that renders a fenced code block. */
export interface MarkdownRendererCodeProps {
  /** The code, as written. */
  code: string;
  /** The language named after the opening fence, if any. */
  language?: string;
  /** True while the closing fence has not arrived yet. */
  incomplete: boolean;
}

/**
 * The elements MarkdownRenderer can render, keyed by tag. Each one may be replaced.
 * Headings are keyed by the tag that is rendered, after the base level is applied.
 */
export interface MarkdownRendererComponents {
  h1: React.ElementType;
  h2: React.ElementType;
  h3: React.ElementType;
  h4: React.ElementType;
  h5: React.ElementType;
  h6: React.ElementType;
  p: React.ElementType;
  blockquote: React.ElementType;
  ul: React.ElementType;
  ol: React.ElementType;
  li: React.ElementType;
  hr: React.ElementType;
  a: React.ElementType;
  strong: React.ElementType;
  em: React.ElementType;
  del: React.ElementType;
  /** Inline code. */
  code: React.ElementType;
  /** A fenced code block. */
  pre: React.ComponentType<MarkdownRendererCodeProps>;
  img: React.ElementType;
  table: React.ElementType;
  thead: React.ElementType;
  tbody: React.ElementType;
  tr: React.ElementType;
  /** Receives `align` as start, center or end when the column sets it. */
  th: React.ElementType;
  /** Receives `align` as start, center or end when the column sets it. */
  td: React.ElementType;
}

export interface MarkdownRendererLabels {
  /** Name of a ticked task list checkbox. Default "Done". */
  taskDone: string;
  /** Name of an empty task list checkbox. Default "To do". */
  taskTodo: string;
  /** Name of the scroll region around a wide table. Default "Table". */
  table: string;
  /** Name of a code block without a language. Default "Code". */
  code: string;
}

export interface MarkdownRendererProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children'
> {
  /** The Markdown source. */
  children?: string | null;
  /**
   * The text is still arriving. Unfinished Markdown at the end renders as what it is about
   * to become, and the region is marked busy. Default false.
   */
  streaming?: boolean;
  /** Replace the element rendered for a tag, for example your router link for `a`. */
  components?: Partial<MarkdownRendererComponents>;
  /** Called when a link is activated. Call `event.preventDefault()` to handle it yourself. */
  onLinkClick?: (event: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
  /** Sources for `[1]` style markers. Each marker with a source renders a CitationChip. */
  citations?: MarkdownRendererCitations;
  /** Called when the reader opens a cited source. */
  onCitationOpen?: (source: Source, index: number) => void;
  /** Render images. When false an image becomes a link with its alt text. Default false. */
  allowImages?: boolean;
  /** Text size. Default `md`. */
  size?: 'sm' | 'md';
  /** The heading level a `#` heading renders at, so the page outline stays valid. Default 2. */
  headingBaseLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Target for links, for example `_blank`. Links always carry rel="noopener noreferrer". */
  linkTarget?: React.HTMLAttributeAnchorTarget;
  /** Translations for the built in strings. */
  labels?: Partial<MarkdownRendererLabels>;
}

const defaultLabels: MarkdownRendererLabels = {
  taskDone: 'Done',
  taskTodo: 'To do',
  table: 'Table',
  code: 'Code',
};

type Slots = Partial<MarkdownRendererComponents>;

/**
 * Renders model Markdown as React elements with Stance typography. The source is parsed
 * to a tree and never injected as HTML, link addresses are limited to http, https, mailto
 * and relative ones, and unfinished Markdown is tolerated while a response streams in.
 */
export const MarkdownRenderer = React.forwardRef<HTMLDivElement, MarkdownRendererProps>(
  function MarkdownRenderer(
    {
      children,
      streaming = false,
      components,
      onLinkClick,
      citations,
      onCitationOpen,
      allowImages = false,
      size = 'md',
      headingBaseLevel = 2,
      linkTarget,
      labels: labelsProp,
      className,
      ...props
    },
    ref,
  ) {
    const labels = { ...defaultLabels, ...labelsProp };
    const source = typeof children === 'string' ? children : '';
    const hasCitations = citations !== undefined;
    const blocks = React.useMemo(
      () => parseMarkdown(source, { streaming, citations: hasCitations }),
      [source, streaming, hasCitations],
    );
    const slots: Slots = components ?? {};

    const el = (
      tag: Exclude<keyof MarkdownRendererComponents, 'pre'>,
      key: React.Key,
      elementProps: Record<string, unknown> | null,
      ...content: React.ReactNode[]
    ) => React.createElement(slots[tag] ?? tag, { key, ...elementProps }, ...content);

    const renderInlines = (nodes: MarkdownInline[]): React.ReactNode[] =>
      nodes.map((node, key) => {
        switch (node.type) {
          case 'text':
            return node.value;
          case 'break':
            return <br key={key} />;
          case 'strong':
          case 'em':
          case 'del':
            return el(node.type, key, null, ...renderInlines(node.children));
          case 'code':
            return React.createElement(slots.code ?? Code, { key }, node.value);
          case 'citation': {
            const cited = citations?.[node.index];
            if (!cited) return `[${node.index}]`;
            return (
              <CitationChip
                key={key}
                index={node.index}
                source={cited}
                onOpen={onCitationOpen ? () => onCitationOpen(cited, node.index) : undefined}
              />
            );
          }
          case 'link':
            return renderLink(key, node.href, node.title, renderInlines(node.children));
          case 'image': {
            if (allowImages && node.src !== undefined)
              return el('img', key, {
                className: 'st-markdown__image',
                src: node.src,
                alt: node.alt,
                title: node.title,
                loading: 'lazy',
                decoding: 'async',
              });
            return renderLink(key, node.src, node.title, [node.alt || node.src || '']);
          }
        }
      });

    const renderLink = (
      key: React.Key,
      href: string | undefined,
      title: string | undefined,
      content: React.ReactNode[],
    ) => {
      // An address that did not pass the protocol check renders as its text only.
      if (href === undefined) return <React.Fragment key={key}>{content}</React.Fragment>;
      return el(
        'a',
        key,
        {
          className: 'st-markdown__link',
          href,
          title,
          target: linkTarget,
          rel: 'noopener noreferrer',
          onClick: onLinkClick
            ? (event: React.MouseEvent<HTMLAnchorElement>) => onLinkClick(event, href)
            : undefined,
        },
        ...content,
      );
    };

    const cellProps = (align: MarkdownAlign) => (align ? { align } : null);

    const renderBlocks = (list: MarkdownBlock[], tight = false): React.ReactNode[] =>
      list.map((block, key) => {
        switch (block.type) {
          case 'paragraph':
            return tight ? (
              <React.Fragment key={key}>{renderInlines(block.children)}</React.Fragment>
            ) : (
              el('p', key, null, ...renderInlines(block.children))
            );
          case 'heading': {
            const level = Math.min(6, headingBaseLevel + block.level - 1) as 1 | 2 | 3 | 4 | 5 | 6;
            return el(
              `h${level}`,
              key,
              { className: 'st-markdown__heading', 'data-level': block.level },
              ...renderInlines(block.children),
            );
          }
          case 'hr':
            return el('hr', key, { className: 'st-markdown__rule' });
          case 'blockquote':
            return el(
              'blockquote',
              key,
              { className: 'st-markdown__quote' },
              ...renderBlocks(block.children),
            );
          case 'code': {
            const incomplete = streaming && !block.closed;
            if (slots.pre)
              return React.createElement(slots.pre, {
                key,
                code: block.value,
                incomplete,
                ...(block.language ? { language: block.language } : null),
              });
            return (
              <CodeBlock
                key={key}
                className="st-markdown__code"
                code={block.value}
                language={block.language}
                label={block.language ?? labels.code}
                copyable={!incomplete}
              />
            );
          }
          case 'list': {
            const task = block.items.some((item) => item.checked !== undefined);
            return el(
              block.ordered ? 'ol' : 'ul',
              key,
              {
                className: 'st-markdown__list',
                'data-task': task ? '' : undefined,
                start: block.ordered && block.start !== 1 ? block.start : undefined,
              },
              ...block.items.map((item, index) =>
                el(
                  'li',
                  index,
                  item.checked === undefined
                    ? null
                    : {
                        className: 'st-markdown__task',
                        'data-checked': item.checked ? '' : undefined,
                      },
                  item.checked === undefined ? null : (
                    <input
                      key="box"
                      className="st-markdown__checkbox"
                      type="checkbox"
                      checked={item.checked}
                      disabled
                      readOnly
                      aria-label={item.checked ? labels.taskDone : labels.taskTodo}
                    />
                  ),
                  ...renderBlocks(item.children, block.tight),
                ),
              ),
            );
          }
          case 'table': {
            const Root = slots.table ?? Table;
            const rootProps = slots.table
              ? { key }
              : {
                  key,
                  density: 'compact',
                  scrollLabel: labels.table,
                  wrapperClassName: 'st-markdown__table',
                };
            return React.createElement(
              Root,
              rootProps,
              React.createElement(
                slots.thead ?? TableHeader,
                null,
                React.createElement(
                  slots.tr ?? TableRow,
                  null,
                  ...block.header.map((cell, c) =>
                    React.createElement(
                      slots.th ?? TableHead,
                      { key: c, scope: 'col', ...cellProps(block.align[c]) },
                      ...renderInlines(cell),
                    ),
                  ),
                ),
              ),
              block.rows.length > 0 &&
                React.createElement(
                  slots.tbody ?? TableBody,
                  null,
                  ...block.rows.map((row, r) =>
                    React.createElement(
                      slots.tr ?? TableRow,
                      { key: r },
                      ...row.map((cell, c) =>
                        React.createElement(
                          slots.td ?? TableCell,
                          { key: c, ...cellProps(block.align[c]) },
                          ...renderInlines(cell),
                        ),
                      ),
                    ),
                  ),
                ),
            );
          }
        }
      });

    return (
      <div
        ref={ref}
        className={cx('st-markdown', className)}
        data-size={size}
        data-streaming={streaming ? '' : undefined}
        aria-busy={streaming || undefined}
        {...props}
      >
        {renderBlocks(blocks)}
      </div>
    );
  },
);

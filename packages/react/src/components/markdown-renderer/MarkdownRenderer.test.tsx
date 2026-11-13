import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { MarkdownRenderer } from './MarkdownRenderer';

const sample = `# Summary

Revenue grew **12%**, *mostly* from renewals [1]. Read the [report](https://example.test/r).

- [x] Reviewed
- [ ] Approved

1. One
2. Two

> Quoted

| Region | Revenue |
|:-------|--------:|
| North  | 1,200   |

\`\`\`ts
const a = 1;
\`\`\`

---

Use \`npm test\` and ~~old~~ text.
`;

describe('MarkdownRenderer', () => {
  it('renders real headings, lists, quotes, tables, code and links', () => {
    const { container } = render(<MarkdownRenderer>{sample}</MarkdownRenderer>);
    expect(screen.getByRole('heading', { level: 2, name: 'Summary' })).toBeInTheDocument();
    expect(screen.getByText('12%').tagName).toBe('STRONG');
    expect(screen.getByText('mostly').tagName).toBe('EM');
    expect(screen.getByText('old').tagName).toBe('DEL');
    expect(screen.getByText('npm test').tagName).toBe('CODE');
    expect(screen.getAllByRole('list')).toHaveLength(2);
    expect(container.querySelector('ol')).toHaveTextContent('OneTwo');
    expect(container.querySelector('blockquote')).toHaveTextContent('Quoted');
    expect(container.querySelector('hr')).toBeInTheDocument();
    const table = screen.getByRole('table');
    expect(within(table).getByRole('columnheader', { name: 'Region' })).toBeInTheDocument();
    expect(within(table).getByRole('cell', { name: '1,200' })).toBeInTheDocument();
    expect(container.querySelector('.st-code-block')).toHaveTextContent('const a = 1;');
    const link = screen.getByRole('link', { name: 'report' });
    expect(link).toHaveAttribute('href', 'https://example.test/r');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).not.toHaveAttribute('target');
  });

  it('renders task lists as named, read only checkboxes', () => {
    render(<MarkdownRenderer>{'- [x] Reviewed\n- [ ] Approved'}</MarkdownRenderer>);
    const done = screen.getByRole('checkbox', { name: 'Done' });
    const todo = screen.getByRole('checkbox', { name: 'To do' });
    expect(done).toBeChecked();
    expect(done).toBeDisabled();
    expect(todo).not.toBeChecked();
  });

  it('starts headings at the base level and stops at h6', () => {
    const { rerender } = render(
      <MarkdownRenderer headingBaseLevel={3}>{'# A\n\n## B\n\n###### F'}</MarkdownRenderer>,
    );
    expect(screen.getByRole('heading', { level: 3, name: 'A' })).toHaveAttribute('data-level', '1');
    expect(screen.getByRole('heading', { level: 4, name: 'B' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 6, name: 'F' })).toBeInTheDocument();
    rerender(<MarkdownRenderer headingBaseLevel={1}>{'# A'}</MarkdownRenderer>);
    expect(screen.getByRole('heading', { level: 1, name: 'A' })).toBeInTheDocument();
  });

  it('never renders HTML from the source', () => {
    const { container } = render(
      <MarkdownRenderer>
        {
          '<script>window.hacked = 1</script>\n\n<img src=x onerror="window.hacked = 1">\n\n<b>bold</b> <iframe src="https://a.test"></iframe>'
        }
      </MarkdownRenderer>,
    );
    expect(container.querySelector('script, img, iframe, b')).toBeNull();
    expect(container).toHaveTextContent('<script>window.hacked = 1</script>');
    expect((window as unknown as { hacked?: number }).hacked).toBeUndefined();
  });

  it('drops unsafe link addresses and keeps the text', () => {
    render(
      <MarkdownRenderer allowImages>
        {
          '[one](javascript:alert(1)) [two](JAVASCRIPT:alert(1)) [three](data:text/html,x) [four](&#106;avascript:x) <javascript:alert(1)> ![five](javascript:alert(1)) [six](/ok) [seven](mailto:a@b.test)'
        }
      </MarkdownRenderer>,
    );
    const links = screen.getAllByRole('link');
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/ok', 'mailto:a@b.test']);
    expect(screen.getByText(/one two three four/)).toBeInTheDocument();
    expect(screen.queryByRole('img')).toBeNull();
    for (const a of document.querySelectorAll('a'))
      expect(a.getAttribute('href')).not.toMatch(/script:|data:/i);
  });

  it('keeps images off by default and renders them with alt text when allowed', () => {
    const source = '![A chart](https://example.test/c.png "Chart")';
    const { rerender } = render(<MarkdownRenderer>{source}</MarkdownRenderer>);
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByRole('link', { name: 'A chart' })).toHaveAttribute(
      'href',
      'https://example.test/c.png',
    );
    rerender(<MarkdownRenderer allowImages>{source}</MarkdownRenderer>);
    const img = screen.getByRole('img', { name: 'A chart' });
    expect(img).toHaveAttribute('src', 'https://example.test/c.png');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('renders a CitationChip for a marker with a source', async () => {
    const onCitationOpen = vi.fn();
    const source = { title: 'Annual report' };
    render(
      <MarkdownRenderer citations={{ 1: source }} onCitationOpen={onCitationOpen}>
        {'Revenue grew [1] and costs fell [2].'}
      </MarkdownRenderer>,
    );
    const chip = screen.getByRole('button', { name: 'Source 1: Annual report' });
    expect(screen.getByText(/costs fell \[2\]/)).toBeInTheDocument();
    await userEvent.click(chip);
    expect(onCitationOpen).toHaveBeenCalledWith(source, 1);
  });

  it('leaves markers as text without the citations prop', () => {
    render(<MarkdownRenderer>{'Revenue grew [1].'}</MarkdownRenderer>);
    expect(screen.getByText('Revenue grew [1].')).toBeInTheDocument();
  });

  it('calls onLinkClick with the address and lets the app cancel navigation', async () => {
    const onLinkClick = vi.fn((event: React.MouseEvent, _href: string) => event.preventDefault());
    render(
      <MarkdownRenderer onLinkClick={onLinkClick} linkTarget="_blank">
        {'[docs](/docs/start)'}
      </MarkdownRenderer>,
    );
    const link = screen.getByRole('link', { name: 'docs' });
    expect(link).toHaveAttribute('target', '_blank');
    await userEvent.click(link);
    expect(onLinkClick).toHaveBeenCalledTimes(1);
    expect(onLinkClick.mock.calls[0]![1]).toBe('/docs/start');
  });

  it('accepts element overrides', () => {
    const Pre = vi.fn(({ code, language }: { code: string; language?: string }) => (
      <pre data-language={language}>{code}</pre>
    ));
    const { container } = render(
      <MarkdownRenderer
        components={{
          a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
            <a data-router="" {...props} />
          ),
          p: 'div',
          pre: Pre,
        }}
      >
        {'Go [home](/).\n\n```sh\nls\n```'}
      </MarkdownRenderer>,
    );
    expect(screen.getByRole('link', { name: 'home' })).toHaveAttribute('data-router');
    expect(container.querySelector('p')).toBeNull();
    expect(container.querySelector('pre')).toHaveAttribute('data-language', 'sh');
    expect(Pre.mock.calls[0]![0]).toMatchObject({ code: 'ls', language: 'sh', incomplete: false });
  });

  it('marks the region busy while streaming and shows unfinished Markdown as it will be', () => {
    const { container, rerender } = render(
      <MarkdownRenderer streaming>{'Some **bold te'}</MarkdownRenderer>,
    );
    expect(container.firstChild).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('bold te').tagName).toBe('STRONG');
    expect(container).not.toHaveTextContent('*');
    rerender(<MarkdownRenderer streaming>{'```ts\nconst a'}</MarkdownRenderer>);
    expect(container.querySelector('.st-code-block')).toHaveTextContent('const a');
    expect(screen.queryByRole('button', { name: /copy/i })).toBeNull();
    rerender(<MarkdownRenderer>{'```ts\nconst a = 1;\n```'}</MarkdownRenderer>);
    expect(container.firstChild).not.toHaveAttribute('aria-busy');
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });

  it('renders every prefix of a document without throwing or remounting earlier blocks', () => {
    const { container, rerender } = render(<MarkdownRenderer streaming>{''}</MarkdownRenderer>);
    let firstHeading: Element | null = null;
    for (let i = 1; i <= sample.length; i++) {
      rerender(
        <MarkdownRenderer streaming citations={{ 1: { title: 'Report' } }}>
          {sample.slice(0, i)}
        </MarkdownRenderer>,
      );
      const heading = container.querySelector('h2');
      if (heading && i > 12) {
        firstHeading ??= heading;
        expect(heading).toBe(firstHeading);
      }
    }
    rerender(<MarkdownRenderer citations={{ 1: { title: 'Report' } }}>{sample}</MarkdownRenderer>);
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(container.querySelector('h2')).toBe(firstHeading);
  });

  it('renders nothing for empty or missing text and survives hostile input', () => {
    const { container, rerender } = render(<MarkdownRenderer>{''}</MarkdownRenderer>);
    expect(container.firstChild).toBeEmptyDOMElement();
    rerender(<MarkdownRenderer>{null}</MarkdownRenderer>);
    expect(container.firstChild).toBeEmptyDOMElement();
    expect(() =>
      rerender(
        <MarkdownRenderer streaming>
          {'*a'.repeat(2000) + '['.repeat(2000) + '>'.repeat(2000) + '`'.repeat(999)}
        </MarkdownRenderer>,
      ),
    ).not.toThrow();
  });

  it('translates the built in strings', () => {
    render(
      <MarkdownRenderer labels={{ taskDone: 'Klar', taskTodo: 'Att göra' }}>
        {'- [x] a\n- [ ] b'}
      </MarkdownRenderer>,
    );
    expect(screen.getByRole('checkbox', { name: 'Klar' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Att göra' })).toBeInTheDocument();
  });

  it('forwards the ref, className, size and props', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <MarkdownRenderer ref={ref} className="mine" id="answer" size="sm">
        Hello
      </MarkdownRenderer>,
    );
    expect(ref.current).toHaveClass('st-markdown', 'mine');
    expect(ref.current).toHaveAttribute('id', 'answer');
    expect(ref.current).toHaveAttribute('data-size', 'sm');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <MarkdownRenderer citations={{ 1: { title: 'Report', url: 'https://example.test' } }}>
          {sample}
        </MarkdownRenderer>
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { RunLog, type RunLogEntry } from './RunLog';

const entries: RunLogEntry[] = [
  { id: '1', time: '14:02:10', level: 'info', text: 'Run started' },
  { id: '2', time: '14:02:11', level: 'debug', text: 'Resolved 12 files' },
  { id: '3', time: '14:02:12', level: 'warn', text: 'Slow response from search' },
  { id: '4', time: '14:02:13', level: 'error', text: 'Request failed with 503' },
];

const many = (count: number): RunLogEntry[] =>
  Array.from({ length: count }, (_, i) => ({ id: `m${i}`, level: 'info', text: `Line ${i}` }));

const announcer = (container: HTMLElement) => container.querySelector('[data-st-announcer]')!;
const lines = (container: HTMLElement) => container.querySelectorAll('.st-run-log__line');

/** jsdom has no layout: give the viewport a size and a scroll height. */
function layout(viewport: HTMLElement, scrollHeight: number, clientHeight = 200) {
  Object.defineProperty(viewport, 'scrollHeight', { configurable: true, value: scrollHeight });
  Object.defineProperty(viewport, 'clientHeight', { configurable: true, value: clientHeight });
}

afterEach(() => vi.restoreAllMocks());

describe('RunLog', () => {
  it('renders a silent log region with a level word on every line', () => {
    const { container } = render(<RunLog entries={entries} />);
    const log = screen.getByRole('log', { name: 'Run log' });
    expect(log).toHaveAttribute('aria-live', 'off');
    expect(log).toHaveAttribute('tabindex', '0');
    expect(lines(container)).toHaveLength(4);
    const error = within(log).getByText('Request failed with 503').closest('.st-run-log__line')!;
    expect(error).toHaveAttribute('data-level', 'error');
    expect(error).toHaveTextContent('14:02:13');
    expect(within(error as HTMLElement).getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('4 lines')).toBeInTheDocument();
  });

  it('renders only the lines near the viewport when the log is long', () => {
    const { container } = render(<RunLog entries={many(2000)} />);
    expect(lines(container).length).toBeLessThan(60);
    expect(container.querySelector('.st-run-log__lines')!.getAttribute('style')).toContain(
      'block-size: 40000px',
    );
  });

  it('filters by level when uncontrolled', async () => {
    const user = userEvent.setup();
    const onLevelsChange = vi.fn();
    const { container } = render(<RunLog entries={entries} onLevelsChange={onLevelsChange} />);
    const group = screen.getByRole('group', { name: 'Levels' });
    const debug = within(group).getByRole('button', { name: /Debug/ });
    expect(debug).toHaveAttribute('aria-pressed', 'true');
    await user.click(debug);
    expect(onLevelsChange).toHaveBeenCalledWith(['error', 'warn', 'info']);
    expect(debug).toHaveAttribute('aria-pressed', 'false');
    expect(lines(container)).toHaveLength(3);
    expect(screen.queryByText('Resolved 12 files')).toBeNull();
    expect(screen.getByText('3 of 4 lines')).toBeInTheDocument();
    await user.click(debug);
    expect(onLevelsChange).toHaveBeenLastCalledWith(['error', 'warn', 'info', 'debug']);
    expect(lines(container)).toHaveLength(4);
  });

  it('filters by level when controlled, and honours defaultLevels', async () => {
    const onLevelsChange = vi.fn();
    const { container, rerender } = render(
      <RunLog entries={entries} levels={['error']} onLevelsChange={onLevelsChange} />,
    );
    expect(lines(container)).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: /Warning/ }));
    expect(onLevelsChange).toHaveBeenCalledWith(['error', 'warn']);
    expect(lines(container)).toHaveLength(1);
    rerender(<RunLog entries={entries} levels={[]} />);
    expect(screen.getByText('No log lines')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy' })).toBeDisabled();
  });

  it('starts from defaultLevels', () => {
    const { container } = render(<RunLog entries={entries} defaultLevels={['warn', 'error']} />);
    expect(lines(container)).toHaveLength(2);
  });

  it('copies the shown lines and confirms', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const onCopy = vi.fn();
    const { container } = render(
      <RunLog entries={entries} defaultLevels={['info', 'error']} onCopy={onCopy} />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    });
    const text = '14:02:10 INFO Run started\n14:02:13 ERROR Request failed with 503';
    expect(onCopy).toHaveBeenCalledWith(text);
    expect(writeText).toHaveBeenCalledWith(text);
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
    expect(announcer(container)).toHaveTextContent('Copied');
  });

  it('announces new errors only', () => {
    const { container, rerender } = render(<RunLog entries={entries} />);
    expect(announcer(container)).toBeEmptyDOMElement();
    rerender(<RunLog entries={[...entries, { id: '5', level: 'info', text: 'Retrying' }]} />);
    expect(announcer(container)).toBeEmptyDOMElement();
    rerender(
      <RunLog
        entries={[
          ...entries,
          { id: '5', level: 'info', text: 'Retrying' },
          { id: '6', level: 'error', text: 'Gave up after 3 attempts' },
        ]}
      />,
    );
    expect(announcer(container)).toHaveTextContent('Error: Gave up after 3 attempts');
  });

  it('follows the newest line until the reader scrolls up', async () => {
    const { rerender } = render(<RunLog entries={many(50)} />);
    const viewport = screen.getByRole('log');
    layout(viewport, 1000);
    rerender(<RunLog entries={many(51)} />);
    expect(viewport.scrollTop).toBe(1000);
    expect(screen.queryByRole('button', { name: 'Jump to latest' })).toBeNull();

    // The reader scrolls up: the log lets go and offers a way back.
    viewport.scrollTop = 300;
    fireEvent.scroll(viewport);
    expect(screen.getByRole('button', { name: 'Jump to latest' })).toBeInTheDocument();
    layout(viewport, 1200);
    rerender(<RunLog entries={many(60)} />);
    expect(viewport.scrollTop).toBe(300);

    await userEvent.click(screen.getByRole('button', { name: 'Jump to latest' }));
    expect(viewport.scrollTop).toBe(1200);
    expect(screen.queryByRole('button', { name: 'Jump to latest' })).toBeNull();
    layout(viewport, 1400);
    rerender(<RunLog entries={many(70)} />);
    expect(viewport.scrollTop).toBe(1400);
  });

  it('resumes following when the reader returns to the bottom', () => {
    const { rerender } = render(<RunLog entries={many(50)} />);
    const viewport = screen.getByRole('log');
    layout(viewport, 1000);
    viewport.scrollTop = 800;
    fireEvent.scroll(viewport);
    viewport.scrollTop = 400;
    fireEvent.scroll(viewport);
    viewport.scrollTop = 800;
    fireEvent.scroll(viewport);
    layout(viewport, 1100);
    rerender(<RunLog entries={many(55)} />);
    expect(viewport.scrollTop).toBe(1100);
  });

  it('does not follow when follow is false', () => {
    const { rerender } = render(<RunLog entries={many(50)} follow={false} />);
    const viewport = screen.getByRole('log');
    layout(viewport, 1000);
    rerender(<RunLog entries={many(60)} follow={false} />);
    expect(viewport.scrollTop).toBe(0);
  });

  it('supports wrap, maxHeight, a hidden toolbar and translated labels', () => {
    const { container } = render(
      <RunLog
        entries={entries}
        wrap
        maxHeight="50vh"
        showToolbar={false}
        labels={{ label: 'Körlogg', level: { error: 'Fel' } }}
      />,
    );
    const log = screen.getByRole('log', { name: 'Körlogg' });
    expect(log.getAttribute('style')).toContain('max-block-size: 50vh');
    expect(container.firstElementChild).toHaveAttribute('data-wrap', '');
    expect(screen.queryByRole('group', { name: 'Levels' })).toBeNull();
    expect(within(log).getByText('Fel')).toBeInTheDocument();
    expect(within(log).getByText('Warning')).toBeInTheDocument();
  });

  it('forwards the ref, className and props', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<RunLog ref={ref} entries={entries} className="mine" id="log" />);
    expect(ref.current).toHaveClass('st-run-log', 'mine');
    expect(ref.current).toHaveAttribute('id', 'log');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <RunLog entries={entries} />
        <RunLog entries={[]} labels={{ label: 'Empty log' }} />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

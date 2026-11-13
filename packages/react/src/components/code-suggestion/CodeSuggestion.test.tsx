import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { CodeSuggestion } from './CodeSuggestion';

const code = 'export const total = (net: number) => net * 1.25;\n';
const announcer = (container: HTMLElement) => container.querySelector('[data-st-announcer]')!;

describe('CodeSuggestion', () => {
  it('renders the code with its file name and language', () => {
    render(<CodeSuggestion code={code} language="ts" filename="src/total.ts" />);
    const group = screen.getByRole('group', { name: 'src/total.ts' });
    expect(group).toHaveTextContent('src/total.ts');
    expect(group).toHaveTextContent('ts');
    expect(screen.getByRole('region', { name: 'src/total.ts' })).toHaveTextContent(
      'export const total = (net: number) => net * 1.25;',
    );
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Apply' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Run' })).toBeNull();
  });

  it('falls back to a generic name without a file name', () => {
    render(<CodeSuggestion code={code} />);
    expect(screen.getByRole('group', { name: 'Suggested code' })).toBeInTheDocument();
  });

  it('copies the code and reports it', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const onCopy = vi.fn();
    render(<CodeSuggestion code={code} onCopy={onCopy} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    });
    expect(writeText).toHaveBeenCalledWith(code);
    expect(onCopy).toHaveBeenCalledWith(true);
  });

  it('applies, then confirms with an announcement', async () => {
    const onApply = vi.fn();
    const { container, rerender } = render(
      <CodeSuggestion code={code} filename="src/total.ts" onApply={onApply} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(announcer(container)).toBeEmptyDOMElement();
    rerender(<CodeSuggestion code={code} filename="src/total.ts" onApply={onApply} applied />);
    expect(screen.getByRole('button', { name: 'Applied' })).toBeDisabled();
    expect(announcer(container)).toHaveTextContent('Applied to src/total.ts');
    expect(screen.getByRole('group', { name: 'src/total.ts' })).toHaveAttribute('data-applied', '');
  });

  it('does not announce when it starts applied', () => {
    const { container } = render(<CodeSuggestion code={code} onApply={() => {}} applied />);
    expect(announcer(container)).toBeEmptyDOMElement();
  });

  it('runs and shows the result as a polite status', async () => {
    const onRun = vi.fn();
    const { container, rerender } = render(<CodeSuggestion code={code} onRun={onRun} />);
    const result = container.querySelector('.st-code-suggestion__result')!;
    expect(result).toHaveAttribute('role', 'status');
    expect(result).toHaveAttribute('aria-live', 'polite');
    expect(result).toBeEmptyDOMElement();
    await userEvent.click(screen.getByRole('button', { name: 'Run' }));
    expect(onRun).toHaveBeenCalledTimes(1);

    rerender(<CodeSuggestion code={code} onRun={onRun} runStatus="running" />);
    expect(screen.getByRole('button', { name: /Run/ })).toHaveAttribute('aria-busy', 'true');
    expect(result).toHaveTextContent('Result');
    expect(result).toHaveTextContent('Running');

    rerender(<CodeSuggestion code={code} onRun={onRun} runStatus="complete" runOutput="125" />);
    expect(result).toHaveTextContent('Complete');
    expect(result.querySelector('pre')).toHaveTextContent('125');
    expect(screen.getByRole('button', { name: 'Run again' })).toBeEnabled();

    rerender(
      <CodeSuggestion
        code={code}
        onRun={onRun}
        runStatus="error"
        runOutput={<strong>TypeError</strong>}
      />,
    );
    expect(result).toHaveTextContent('Failed');
    expect(result.querySelector('strong')).toHaveTextContent('TypeError');
    expect(container.firstElementChild).toHaveAttribute('data-run-status', 'error');
  });

  it('holds apply and run while the code is streaming', () => {
    render(<CodeSuggestion code={code} streaming onApply={() => {}} onRun={() => {}} />);
    const group = screen.getByRole('group', { name: 'Suggested code' });
    expect(group).toHaveAttribute('aria-busy', 'true');
    expect(group).toHaveTextContent('Writing code');
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Run' })).toBeDisabled();
  });

  it('works with the keyboard', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    const onRun = vi.fn();
    render(<CodeSuggestion code={code} onApply={onApply} onRun={onRun} />);
    await user.tab();
    expect(screen.getByRole('button', { name: 'Copy' })).toHaveFocus();
    await user.tab();
    await user.keyboard('{Enter}');
    expect(onRun).toHaveBeenCalledTimes(1);
    await user.tab();
    await user.keyboard(' ');
    expect(onApply).toHaveBeenCalledTimes(1);
  });

  it('passes wrap, line numbers and max height to the code block', () => {
    const { container } = render(
      <CodeSuggestion code={'a\nb'} wrap showLineNumbers maxHeight="10rem" />,
    );
    expect(container.querySelector('.st-code-block')).toHaveAttribute('data-wrap', '');
    expect(container.querySelectorAll('.st-code-block__line-number')).toHaveLength(2);
    expect(container.querySelector('pre')!.getAttribute('style')).toContain('max-height: 10rem');
  });

  it('uses translated labels', () => {
    render(
      <CodeSuggestion
        code={code}
        onApply={() => {}}
        onRun={() => {}}
        runStatus="complete"
        labels={{
          apply: 'Använd',
          rerun: 'Kör igen',
          output: 'Resultat',
          runStatus: { complete: 'Klar' },
        }}
      />,
    );
    expect(screen.getByRole('button', { name: 'Använd' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Kör igen' })).toBeInTheDocument();
    expect(screen.getByText('Resultat')).toBeInTheDocument();
    expect(screen.getByText('Klar')).toBeInTheDocument();
  });

  it('forwards the ref, className and props', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<CodeSuggestion ref={ref} code={code} className="mine" id="fix" />);
    expect(ref.current).toHaveClass('st-code-suggestion', 'mine');
    expect(ref.current).toHaveAttribute('id', 'fix');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <CodeSuggestion
          code={code}
          language="ts"
          filename="src/total.ts"
          onApply={() => {}}
          onRun={() => {}}
          runStatus="complete"
          runOutput="125"
        />
        <CodeSuggestion code={code} streaming labels={{ label: 'Draft code' }} />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

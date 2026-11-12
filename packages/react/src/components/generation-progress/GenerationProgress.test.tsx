import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { GenerationProgress } from './GenerationProgress';

const announcer = (container: HTMLElement) => container.querySelector('[data-st-announcer]')!;

describe('GenerationProgress', () => {
  it('is an indeterminate progressbar named by its label when no value is given', () => {
    const { container } = render(<GenerationProgress />);
    const bar = screen.getByRole('progressbar', { name: 'Generating' });
    expect(bar).not.toHaveAttribute('aria-valuenow');
    expect(bar).not.toHaveAttribute('aria-valuetext');
    expect(container.firstElementChild).toHaveAttribute('data-state', 'indeterminate');
  });

  it('exposes a determinate value with value text that includes the stage', () => {
    const { container } = render(
      <GenerationProgress value={0.4} label="Creating report" stage="Rendering pages" />,
    );
    const bar = screen.getByRole('progressbar', { name: 'Creating report' });
    expect(bar).toHaveAttribute('aria-valuenow', '40');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(bar).toHaveAttribute('aria-valuetext', '40%, Rendering pages');
    expect(screen.getByText('40%')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Rendering pages')).toBeVisible();
    expect(container.firstElementChild).toHaveAttribute('data-state', 'loading');
  });

  it('clamps the value and marks completion', () => {
    const { container, rerender } = render(<GenerationProgress value={1.4} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    expect(container.firstElementChild).toHaveAttribute('data-state', 'complete');
    rerender(<GenerationProgress value={-1} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('announces each stage change once and never the first stage or value changes', () => {
    const { container, rerender } = render(<GenerationProgress value={0.1} stage="Outlining" />);
    expect(announcer(container)).toBeEmptyDOMElement();
    rerender(<GenerationProgress value={0.2} stage="Outlining" />);
    expect(announcer(container)).toBeEmptyDOMElement();
    rerender(<GenerationProgress value={0.5} stage="Writing" />);
    expect(announcer(container)).toHaveTextContent('Writing');
    expect(announcer(container)).toHaveAttribute('aria-live', 'polite');
    const spoken = announcer(container).textContent;
    rerender(<GenerationProgress value={0.6} stage="Writing" />);
    expect(announcer(container).textContent).toBe(spoken);
  });

  it('shows cancel only with onCancel and calls it from mouse and keyboard', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<GenerationProgress />);
    expect(screen.queryByRole('button')).toBeNull();
    rerender(<GenerationProgress onCancel={onCancel} />);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.keyboard('{Enter}');
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it('uses translated labels', () => {
    render(
      <GenerationProgress
        value={0.25}
        onCancel={() => {}}
        labels={{ cancel: 'Avbryt', value: (v) => `${v * 100} procent` }}
      />,
    );
    expect(screen.getByRole('button', { name: 'Avbryt' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '25 procent');
  });

  it('forwards the ref, className and props', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<GenerationProgress ref={ref} className="mine" id="job" />);
    expect(ref.current).toHaveClass('st-generation-progress', 'mine');
    expect(ref.current).toHaveAttribute('id', 'job');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <GenerationProgress label="Creating image" />
        <GenerationProgress value={0.6} stage="Adding detail" onCancel={() => {}} />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

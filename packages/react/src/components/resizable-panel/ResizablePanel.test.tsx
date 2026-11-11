import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { ResizeHandle, SplitPanel } from '../split-panel/SplitPanel';
import { ResizablePanel } from './ResizablePanel';

describe('ResizablePanel', () => {
  it('shares remaining space between panels without defaults', () => {
    render(
      <SplitPanel>
        <ResizablePanel defaultSize={40}>A</ResizablePanel>
        <ResizeHandle />
        <ResizablePanel>B</ResizablePanel>
        <ResizeHandle />
        <ResizablePanel>C</ResizablePanel>
      </SplitPanel>,
    );
    expect(screen.getByText('A')).toHaveAttribute('data-size', '40');
    expect(screen.getByText('B')).toHaveAttribute('data-size', '30');
    expect(screen.getByText('C')).toHaveAttribute('data-size', '30');
    expect(screen.getByText('A').style.flex).toBe('40 1 0px');
  });

  it('second handle resizes the middle pair and respects maxSize', async () => {
    render(
      <SplitPanel>
        <ResizablePanel>A</ResizablePanel>
        <ResizeHandle aria-label="first" />
        <ResizablePanel maxSize={40}>B</ResizablePanel>
        <ResizeHandle aria-label="second" />
        <ResizablePanel>C</ResizablePanel>
      </SplitPanel>,
    );
    screen.getByRole('separator', { name: 'second' }).focus();
    await userEvent.keyboard('{End}');
    expect(screen.getByText('B')).toHaveAttribute('data-size', '40');
    expect(screen.getByText('A')).toHaveAttribute('data-size', '33');
  });

  it('marks a collapsed panel', async () => {
    render(
      <SplitPanel>
        <ResizablePanel collapsible collapsedSize={4} defaultSize={30}>
          Nav
        </ResizablePanel>
        <ResizeHandle aria-label="Resize navigation" />
        <ResizablePanel>Content</ResizablePanel>
      </SplitPanel>,
    );
    screen.getByRole('separator').focus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByText('Nav')).toHaveAttribute('data-collapsed');
    expect(screen.getByText('Nav')).toHaveAttribute('data-size', '4');
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <SplitPanel>
        <ResizablePanel>A</ResizablePanel>
        <ResizeHandle />
        <ResizablePanel>B</ResizablePanel>
      </SplitPanel>,
    );
    await expectNoA11yViolations(container);
  });
});

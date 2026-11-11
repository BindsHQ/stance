import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { ScrollArea } from './ScrollArea';

function mockOverflow(
  el: HTMLElement,
  { scrollHeight = 600, clientHeight = 200, scrollTop = 0 } = {},
) {
  Object.defineProperty(el, 'scrollHeight', { configurable: true, value: scrollHeight });
  Object.defineProperty(el, 'clientHeight', { configurable: true, value: clientHeight });
  el.scrollTop = scrollTop;
}

describe('ScrollArea', () => {
  it('is not focusable when content fits', () => {
    render(
      <ScrollArea label="Activity" data-testid="area">
        Short
      </ScrollArea>,
    );
    const area = screen.getByTestId('area');
    expect(area).not.toHaveAttribute('tabindex');
    expect(area).not.toHaveAttribute('role');
  });

  it('becomes a focusable labelled region when it overflows and tracks edges', () => {
    render(
      <ScrollArea label="Deployment log" maxHeight={200} data-testid="area">
        <div style={{ height: 600 }}>Log</div>
      </ScrollArea>,
    );
    const area = screen.getByTestId('area');
    mockOverflow(area);
    fireEvent.scroll(area);
    expect(screen.getByRole('region', { name: 'Deployment log' })).toHaveAttribute('tabindex', '0');
    expect(area).toHaveAttribute('data-at-start');
    expect(area).not.toHaveAttribute('data-at-end');
    mockOverflow(area, { scrollTop: 400 });
    fireEvent.scroll(area);
    expect(area).toHaveAttribute('data-at-end');
    expect(area).not.toHaveAttribute('data-at-start');
  });

  it('respects orientation and style props', () => {
    render(
      <ScrollArea orientation="horizontal" maxWidth={300} data-testid="area">
        Wide
      </ScrollArea>,
    );
    const area = screen.getByTestId('area');
    expect(area).toHaveAttribute('data-orientation', 'horizontal');
    expect(area.style.maxWidth).toBe('300px');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <ScrollArea label="Organisation users" maxHeight={120} data-testid="area">
          <ul>
            {Array.from({ length: 30 }, (_, i) => (
              <li key={i}>User {i}</li>
            ))}
          </ul>
        </ScrollArea>
      </div>,
    );
    const area = screen.getByTestId('area');
    mockOverflow(area);
    fireEvent.scroll(area);
    await expectNoA11yViolations(container);
  });
});

import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { Theme, ThemeProvider, ThemeScript, useTheme } from './ThemeProvider';

function Probe() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="pref">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button onClick={() => setTheme('dark')}>dark</button>
      <button onClick={() => setTheme('high-contrast')}>hc</button>
    </div>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('dark');
  });

  it('applies the default theme to <html>', () => {
    render(
      <ThemeProvider defaultTheme="light">
        <Probe />
      </ThemeProvider>,
    );
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  });

  it('resolves system to light when the OS has no preference', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('pref')).toHaveTextContent('system');
    expect(screen.getByTestId('resolved')).toHaveTextContent('light');
  });

  it('persists changes and toggles the dark class', async () => {
    render(
      <ThemeProvider defaultTheme="light">
        <Probe />
      </ThemeProvider>,
    );
    await userEvent.click(screen.getByText('dark'));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem('stance-theme')).toBe('dark');
    await userEvent.click(screen.getByText('hc'));
    expect(document.documentElement).toHaveAttribute('data-theme', 'high-contrast');
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('reads a legacy storage key so existing preferences survive migration', () => {
    localStorage.setItem('theme', 'dark');
    render(
      <ThemeProvider storageKey="stance-theme" legacyStorageKeys={['theme']}>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
  });

  it('honours a custom storage key', async () => {
    render(
      <ThemeProvider storageKey="theme">
        <Probe />
      </ThemeProvider>,
    );
    await userEvent.click(screen.getByText('dark'));
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('respects forcedTheme', () => {
    localStorage.setItem('stance-theme', 'dark');
    render(
      <ThemeProvider forcedTheme="light">
        <Probe />
      </ThemeProvider>,
    );
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  });

  it('syncs from other tabs via the storage event', () => {
    render(
      <ThemeProvider defaultTheme="light">
        <Probe />
      </ThemeProvider>,
    );
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'stance-theme', newValue: 'high-contrast' }),
      );
    });
    expect(screen.getByTestId('resolved')).toHaveTextContent('high-contrast');
  });

  it('throws a helpful error outside the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/ThemeProvider/);
    spy.mockRestore();
  });

  it('renders a scoped Theme and an inline ThemeScript', () => {
    const { container } = render(
      <>
        <ThemeScript storageKey="x" />
        <Theme theme="dark">hi</Theme>
      </>,
    );
    expect(container.querySelector('script')?.innerHTML).toContain('"k":"x"');
    expect(screen.getByText('hi')).toHaveAttribute('data-theme', 'dark');
  });
});

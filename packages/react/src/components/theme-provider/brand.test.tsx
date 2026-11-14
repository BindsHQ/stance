import { act, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bindsBrand, createBrandTheme } from '@bindshq/stance-tokens';

const acme = { name: 'Acme', light: '#F7F5F0', dark: '#101B2D', accent: '#0A7C66' };

/** Fresh module state for each test: contrast reports are logged once per brand. */
async function load() {
  vi.resetModules();
  return import('./ThemeProvider');
}

const flush = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));

describe('ThemeProvider brand', () => {
  let info: ReturnType<typeof vi.spyOn>;
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    info = vi.spyOn(console, 'info').mockImplementation(() => {});
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    info.mockRestore();
    warn.mockRestore();
  });

  it('scopes the brand variables to its subtree', async () => {
    const { ThemeProvider } = await load();
    const { container } = render(
      <ThemeProvider defaultTheme="light" brand={acme}>
        <p>inside</p>
      </ThemeProvider>,
    );
    const scope = container.querySelector('[data-stance-brand]') as HTMLElement;
    expect(scope).toContainElement(screen.getByText('inside'));
    expect(scope.style.display).toBe('contents');
    const key = scope.getAttribute('data-stance-brand')!;
    const css = scope.querySelector('style')!.textContent!;
    expect(css).toBe(createBrandTheme(acme, { scope: `[data-stance-brand='${key}']` }).css);
    expect(css).toContain(`:root[data-theme='dark'] [data-stance-brand='${key}']`);
    expect(css).toContain(`[data-stance-brand='${key}'] [data-theme='dark']`);
    expect(css).toContain('--st-color-bg-canvas: #F7F5F0;');
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  });

  it('follows nested Theme elements inside the scope', async () => {
    const { ThemeProvider, Theme } = await load();
    const { container } = render(
      <ThemeProvider defaultTheme="light" brand={acme}>
        <Theme theme="dark">dark pane</Theme>
      </ThemeProvider>,
    );
    const key = container.querySelector('[data-stance-brand]')!.getAttribute('data-stance-brand');
    const css = container.querySelector('style')!.textContent!;
    const darkBlock = css.slice(css.indexOf(`[data-stance-brand='${key}'] [data-theme='dark'] {`));
    expect(darkBlock).toContain('--st-color-bg-canvas: #101B2D;');
    expect(screen.getByText('dark pane')).toHaveAttribute('data-theme', 'dark');
  });

  it('renders the same markup on the server, so hydration does not flash', async () => {
    const { ThemeProvider } = await load();
    const html = renderToString(
      <ThemeProvider brand={acme}>
        <p>ssr</p>
      </ThemeProvider>,
    );
    const { container } = render(
      <ThemeProvider brand={acme}>
        <p>ssr</p>
      </ThemeProvider>,
    );
    expect(html).toContain('data-stance-brand="');
    expect(html).toContain('<style>');
    const key = container.querySelector('[data-stance-brand]')!.getAttribute('data-stance-brand')!;
    expect(html).toContain(`data-stance-brand="${key}"`);
  });

  it('adds no wrapper for the Binds palette', async () => {
    const { ThemeProvider } = await load();
    for (const brand of ['binds' as const, bindsBrand, undefined]) {
      const { container, unmount } = render(
        <ThemeProvider brand={brand}>
          <p>plain</p>
        </ThemeProvider>,
      );
      expect(container.querySelector('[data-stance-brand]')).toBeNull();
      expect(container.querySelector('style')).toBeNull();
      unmount();
    }
  });

  it('logs nothing for the default palette, even in development', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const { ThemeProvider } = await load();
    render(
      <>
        <ThemeProvider>a</ThemeProvider>
        <ThemeProvider brand="binds">b</ThemeProvider>
      </>,
    );
    await flush();
    expect(info).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it('never reports contrast in production or test', async () => {
    for (const mode of ['production', 'test']) {
      vi.stubEnv('NODE_ENV', mode);
      const { ThemeProvider } = await load();
      const { unmount } = render(<ThemeProvider>a</ThemeProvider>);
      render(<ThemeProvider brand={{ name: 'Fog', light: '#DDDDDD', dark: '#999999' }} />);
      await flush();
      unmount();
    }
    expect(info).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it('reports contrast problems once in development', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const { ThemeProvider } = await load();
    const fog = { name: 'Fog', light: '#DDDDDD', dark: '#999999' };
    const { rerender } = render(<ThemeProvider brand={fog}>a</ThemeProvider>);
    rerender(<ThemeProvider brand={{ ...fog }}>a</ThemeProvider>);
    await flush();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]![0])).toMatch(/Stance brand "Fog" has \d+ contrast issues/);
    expect(info).not.toHaveBeenCalled();
  });
});

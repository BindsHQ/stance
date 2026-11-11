import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { ThemeProvider } from '../theme-provider/ThemeProvider';
import { ThemeSwitcher } from './ThemeSwitcher';

describe('ThemeSwitcher', () => {
  beforeEach(() => localStorage.clear());

  it('exposes a labelled radiogroup with the current theme checked', () => {
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeSwitcher />
      </ThemeProvider>,
    );
    expect(screen.getByRole('radiogroup', { name: 'Theme' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Light' })).toHaveAttribute('aria-checked', 'true');
  });

  it('switches theme on click', async () => {
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeSwitcher />
      </ThemeProvider>,
    );
    await userEvent.click(screen.getByRole('radio', { name: 'High contrast' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'high-contrast');
  });

  it('moves selection with arrow keys and keeps a single tab stop', async () => {
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeSwitcher />
      </ThemeProvider>,
    );
    const user = userEvent.setup();
    await user.tab();
    expect(screen.getByRole('radio', { name: 'Light' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Dark' })).toHaveFocus();
    expect(screen.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getAllByRole('radio').filter((r) => r.tabIndex === 0)).toHaveLength(1);
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <ThemeProvider>
        <ThemeSwitcher showLabels />
      </ThemeProvider>,
    );
    await expectNoA11yViolations(container);
  });
});

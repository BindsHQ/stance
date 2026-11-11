import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { SearchInput } from './SearchInput';

describe('SearchInput', () => {
  it('is a searchbox that clears with the button and Escape', async () => {
    const onValueChange = vi.fn();
    const onClear = vi.fn();
    render(
      <SearchInput
        aria-label="Search templates"
        onValueChange={onValueChange}
        onClear={onClear}
        shortcut="/"
      />,
    );
    const box = screen.getByRole('searchbox', { name: 'Search templates' });
    expect(screen.getByText('/')).toBeInTheDocument();
    await userEvent.type(box, 'nda');
    expect(onValueChange).toHaveBeenLastCalledWith('nda');
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(box).toHaveValue('');
    expect(box).toHaveFocus();
    await userEvent.type(box, 'lease{Escape}');
    expect(box).toHaveValue('');
    expect(onClear).toHaveBeenCalledTimes(2);
  });

  it('calls onSearch on Enter', async () => {
    const onSearch = vi.fn();
    render(<SearchInput aria-label="Search" onSearch={onSearch} />);
    await userEvent.type(screen.getByRole('searchbox'), 'acme{Enter}');
    expect(onSearch).toHaveBeenCalledWith('acme');
  });

  it('is controlled', async () => {
    render(<SearchInput aria-label="Search" value="fixed" onValueChange={() => {}} />);
    await userEvent.type(screen.getByRole('searchbox'), 'x');
    expect(screen.getByRole('searchbox')).toHaveValue('fixed');
  });

  it.each(THEMES)('axe clean in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <SearchInput aria-label="Search" defaultValue="nda" />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
} from './NavigationMenu';

function Example(props: { orientation?: 'horizontal' | 'vertical' }) {
  return (
    <>
      <NavigationMenu aria-label="Main" {...props}>
        <NavigationMenuItem>
          <NavigationMenuLink href="#home" active>
            Home
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem value="products">
          <NavigationMenuTrigger>Products</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuLink href="#esignify" description="Email signatures for every employee">
              eSignify
            </NavigationMenuLink>
            <NavigationMenuLink href="#stance">Stance</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#contact">Contact</NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenu>
      <button type="button">After</button>
    </>
  );
}

describe('NavigationMenu', () => {
  it('uses a nav landmark with a disclosure button, not role=menu', () => {
    render(<Example />);
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
    expect(screen.queryByRole('menu')).toBeNull();
    const trigger = screen.getByRole('button', { name: 'Products' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-controls');
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
  });

  it('toggles the panel on click and exposes its links', async () => {
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Products' });
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: /eSignify/ })).toBeVisible();
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps a panel opened by hover open when it is then clicked', () => {
    vi.useFakeTimers();
    try {
      render(<Example />);
      const trigger = screen.getByRole('button', { name: 'Products' });
      fireEvent.pointerEnter(trigger, { pointerType: 'mouse' });
      act(() => vi.advanceTimersByTime(200));
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    } finally {
      vi.useRealTimers();
    }
  });

  it('moves between top-level items with arrow keys', async () => {
    render(<Example />);
    const user = userEvent.setup();
    screen.getByRole('link', { name: 'Home' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Products' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('link', { name: 'Home' })).toHaveFocus();
  });

  it('opens with ArrowDown, moves within the panel and closes on Escape', async () => {
    render(<Example />);
    const user = userEvent.setup();
    const trigger = screen.getByRole('button', { name: 'Products' });
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    await waitFor(() => expect(screen.getByRole('link', { name: /eSignify/ })).toHaveFocus());
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('link', { name: 'Stance' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();
  });

  it('closes when focus leaves the navigation or on outside click', async () => {
    render(<Example />);
    const user = userEvent.setup();
    const trigger = screen.getByRole('button', { name: 'Products' });
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'After' }));
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens on hover after a short delay', () => {
    vi.useFakeTimers();
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Products' });
    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' });
    act(() => vi.advanceTimersByTime(200));
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    vi.useRealTimers();
  });

  it.each(THEMES)('has no axe violations with a panel open in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <Example />
      </div>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Products' }));
    await expectNoA11yViolations(container);
  });
});

describe('NavigationMenu in RTL', () => {
  it('moves to the next top-level item with ArrowLeft', async () => {
    render(
      <div dir="rtl">
        <Example />
      </div>,
    );
    const user = userEvent.setup();
    screen.getByRole('link', { name: 'Home' }).focus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('button', { name: 'Products' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('link', { name: 'Home' })).toHaveFocus();
  });

  it('opens a vertical item with ArrowLeft', async () => {
    render(
      <div dir="rtl">
        <Example orientation="vertical" />
      </div>,
    );
    const user = userEvent.setup();
    const trigger = screen.getByRole('button', { name: 'Products' });
    trigger.focus();
    await user.keyboard('{ArrowRight}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.keyboard('{ArrowLeft}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });
});

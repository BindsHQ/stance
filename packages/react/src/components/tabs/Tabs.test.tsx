import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';

function Example(props: Partial<React.ComponentProps<typeof Tabs>>) {
  return (
    <Tabs defaultValue="overview" {...props}>
      <TabsList aria-label="Template sections">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="assignees" badge={12}>
          Assignees
        </TabsTrigger>
        <TabsTrigger value="archived" disabled>
          Archived
        </TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Overview panel</TabsContent>
      <TabsContent value="assignees">Assignees panel</TabsContent>
      <TabsContent value="archived">Archived panel</TabsContent>
      <TabsContent value="history">History panel</TabsContent>
    </Tabs>
  );
}

describe('Tabs', () => {
  it('wires tablist, tabs and panels', () => {
    render(<Example />);
    expect(screen.getByRole('tablist', { name: 'Template sections' })).toHaveAttribute(
      'aria-orientation',
      'horizontal',
    );
    const tab = screen.getByRole('tab', { name: 'Overview' });
    expect(tab).toHaveAttribute('aria-selected', 'true');
    const panel = screen.getByRole('tabpanel', { name: 'Overview' });
    expect(tab).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveTextContent('Overview panel');
  });

  it('keeps one tab stop and moves with arrows, skipping disabled tabs (automatic)', async () => {
    const onValueChange = vi.fn();
    render(<Example onValueChange={onValueChange} />);
    const user = userEvent.setup();
    await user.tab();
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: /Assignees/ })).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Assignees panel');
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'History' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveFocus();
    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'History' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveFocus();
    expect(onValueChange).toHaveBeenCalledWith('assignees');
    await user.tab();
    expect(screen.getByRole('tabpanel')).toHaveFocus();
  });

  it('requires Enter/Space in manual mode', async () => {
    render(<Example activationMode="manual" />);
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Overview panel');
    await user.keyboard('{Enter}');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Assignees panel');
  });

  it('uses up/down in vertical orientation', async () => {
    render(<Example orientation="vertical" />);
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('tab', { name: /Assignees/ })).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveFocus();
  });

  it('supports controlled usage and forceMount', () => {
    const { rerender } = render(
      <Tabs value="a">
        <TabsList aria-label="x">
          <TabsTrigger value="a">A</TabsTrigger>
          <TabsTrigger value="b">B</TabsTrigger>
        </TabsList>
        <TabsContent value="a">A</TabsContent>
        <TabsContent value="b" forceMount>
          B
        </TabsContent>
      </Tabs>,
    );
    expect(screen.getByText('B', { selector: '[role=tabpanel]' })).not.toBeVisible();
    rerender(
      <Tabs value="b">
        <TabsList aria-label="x">
          <TabsTrigger value="a">A</TabsTrigger>
          <TabsTrigger value="b">B</TabsTrigger>
        </TabsList>
        <TabsContent value="a">A</TabsContent>
        <TabsContent value="b" forceMount>
          B
        </TabsContent>
      </Tabs>,
    );
    expect(screen.getByRole('tab', { name: 'B' })).toHaveAttribute('aria-selected', 'true');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <Example variant="pill" />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

describe('Tabs in RTL', () => {
  it('swaps the horizontal arrow keys', async () => {
    render(
      <div dir="rtl">
        <Example />
      </div>,
    );
    const user = userEvent.setup();
    screen.getByRole('tab', { name: 'Overview' }).focus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: /Assignees/ })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveFocus();
  });

  it('keeps Up and Down for vertical tabs', async () => {
    render(
      <div dir="rtl">
        <Example orientation="vertical" />
      </div>,
    );
    const user = userEvent.setup();
    screen.getByRole('tab', { name: 'Overview' }).focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('tab', { name: /Assignees/ })).toHaveFocus();
  });
});

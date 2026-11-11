import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { Timeline, TimelineItem } from './Timeline';

function Example() {
  return (
    <Timeline aria-label="Deployment history" alternate>
      <TimelineItem
        title="Template published"
        time="09:12"
        dateTime="2026-11-11T09:12"
        tone="accent"
      />
      <TimelineItem
        title="Deployed to 48 mailboxes"
        time="09:20"
        tone="success"
        statusLabel="Succeeded"
        description="Exchange relay accepted all users."
      />
      <TimelineItem title="2 mailboxes failed" time="09:21" tone="danger" statusLabel="Failed" />
    </Timeline>
  );
}

describe('Timeline', () => {
  it('renders an ordered list of events with machine-readable times', () => {
    render(<Example />);
    const list = screen.getByRole('list', { name: 'Deployment history' });
    expect(list.tagName).toBe('OL');
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('09:12').tagName).toBe('TIME');
    expect(screen.getByText('09:12')).toHaveAttribute('datetime', '2026-11-11T09:12');
  });

  it('announces status in text, not colour alone', () => {
    render(<Example />);
    expect(screen.getByText(', Failed')).toHaveClass('st-sr-only');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <Example />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

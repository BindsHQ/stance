import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { Avatar } from '../avatar/Avatar';
import { AvatarGroup } from './AvatarGroup';

const people = [
  'Ada Lovelace',
  'Grace Hopper',
  'Alan Turing',
  'Katherine Johnson',
  'Margaret Hamilton',
];

describe('AvatarGroup', () => {
  it('renders a list and collapses overflow into +N', () => {
    render(
      <AvatarGroup aria-label="Template editors" max={3}>
        {people.map((p) => (
          <Avatar key={p} name={p} />
        ))}
      </AvatarGroup>,
    );
    const list = screen.getByRole('list', { name: 'Template editors' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByRole('img', { name: '2 more' })).toHaveTextContent('+2');
  });

  it('uses total for the overflow count', () => {
    render(
      <AvatarGroup aria-label="Members" total={48} overflowLabel={(n) => `and ${n} other members`}>
        {people.slice(0, 2).map((p) => (
          <Avatar key={p} name={p} />
        ))}
      </AvatarGroup>,
    );
    expect(screen.getByRole('img', { name: 'and 46 other members' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <AvatarGroup aria-label="Editors" max={2}>
        {people.map((p) => (
          <Avatar key={p} name={p} />
        ))}
      </AvatarGroup>,
    );
    await expectNoA11yViolations(container);
  });
});

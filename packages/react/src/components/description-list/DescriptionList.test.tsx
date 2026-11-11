import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { DescriptionList, DescriptionListItem } from './DescriptionList';

describe('DescriptionList', () => {
  it('renders terms and definitions from children', () => {
    render(
      <DescriptionList>
        <DescriptionListItem term="Organisation">Binds Ltd</DescriptionListItem>
        <DescriptionListItem term="Plan">Business</DescriptionListItem>
      </DescriptionList>,
    );
    expect(screen.getAllByRole('term')).toHaveLength(2);
    expect(screen.getAllByRole('definition')).toHaveLength(2);
    expect(screen.getByText('Binds Ltd').tagName).toBe('DD');
  });

  it('renders from items with grid layout', () => {
    const { container } = render(
      <DescriptionList
        layout="grid"
        columns={3}
        items={[
          { term: 'Signed', details: '12 Nov 2026' },
          { term: 'Parties', details: '2' },
        ]}
      />,
    );
    expect(container.firstChild).toHaveAttribute('data-layout', 'grid');
    expect(screen.getByText('Parties').tagName).toBe('DT');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <DescriptionList
          items={[
            { term: 'Relay', details: 'smtp.binds.si' },
            { term: 'Status', details: 'Connected' },
          ]}
        />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

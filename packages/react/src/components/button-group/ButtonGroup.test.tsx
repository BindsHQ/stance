import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { Button } from '../button/Button';
import { ButtonGroup } from './ButtonGroup';

describe('ButtonGroup', () => {
  it('renders a labelled group', () => {
    render(
      <ButtonGroup label="Export">
        <Button variant="outline">PDF</Button>
        <Button variant="outline">HTML</Button>
      </ButtonGroup>,
    );
    const g = screen.getByRole('group', { name: 'Export' });
    expect(g).toHaveAttribute('data-variant', 'attached');
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });
  it.each(THEMES)('axe clean in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <ButtonGroup label="View" orientation="vertical" variant="spaced">
          <Button>A</Button>
          <Button>B</Button>
        </ButtonGroup>
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

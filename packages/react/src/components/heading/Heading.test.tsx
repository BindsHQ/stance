import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { Heading } from './Heading';

describe('Heading', () => {
  it('renders the semantic level with a default size', () => {
    render(<Heading level={1}>Templates</Heading>);
    const h = screen.getByRole('heading', { level: 1, name: 'Templates' });
    expect(h).toHaveAttribute('data-size', '3xl');
  });
  it('decouples visual size from level', () => {
    render(
      <Heading level={3} size="display">
        Contracts
      </Heading>,
    );
    expect(screen.getByRole('heading', { level: 3 })).toHaveAttribute('data-size', 'display');
  });
  it('can render a non-heading element', () => {
    render(<Heading as="p">Eyebrow</Heading>);
    expect(screen.queryByRole('heading')).toBeNull();
  });
  it('has no axe violations', async () => {
    const { container } = render(
      <>
        <Heading level={1}>A</Heading>
        <Heading level={2}>B</Heading>
      </>,
    );
    await expectNoA11yViolations(container);
  });
});

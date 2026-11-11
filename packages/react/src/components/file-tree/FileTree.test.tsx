import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { FileTree } from './FileTree';

const files = [
  {
    id: 'brand',
    label: 'brand',
    children: [
      { id: 'logo', label: 'logo.svg' },
      { id: 'guide', label: 'guidelines.pdf' },
    ],
  },
  { id: 'readme', label: 'README.md' },
];

describe('FileTree', () => {
  it('uses folder and file icons and toggles folder state', async () => {
    const { container } = render(<FileTree items={files} />);
    expect(screen.getByRole('tree', { name: 'Files' })).toBeInTheDocument();
    expect(container.querySelector('[data-icon="folder"]')).toBeInTheDocument();
    expect(container.querySelector('[data-icon="file-text"]')).toBeInTheDocument();
    await userEvent.click(screen.getByText('brand'));
    expect(container.querySelector('[data-icon="folder-open"]')).toBeInTheDocument();
    expect(container.querySelector('[data-icon="image"]')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<FileTree items={files} defaultExpanded={['brand']} />);
    await expectNoA11yViolations(container);
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { CodeBlock } from './CodeBlock';
import { tokenize } from './highlight';

const sample = `import { Button } from '@bindshq/stance-react';\n\n// Primary action\nexport const Save = () => <Button>Save</Button>;\n`;

describe('CodeBlock', () => {
  it('renders a labelled, focusable scroll region with all lines', () => {
    render(
      <CodeBlock
        code={sample}
        language="tsx"
        title="Save.tsx"
        showLineNumbers
        highlightLines={[4]}
      />,
    );
    const region = screen.getByRole('region', { name: 'Save.tsx' });
    expect(region).toHaveAttribute('tabindex', '0');
    const lines = region.querySelectorAll('.st-code-block__line');
    expect(lines).toHaveLength(4);
    expect(lines[3]).toHaveAttribute('data-highlighted');
    expect(region.textContent).toContain("from '@bindshq/stance-react'");
  });
  it('never interprets code as HTML', () => {
    const { container } = render(
      <CodeBlock code={'<img src=x onerror="alert(1)">'} language="html" />,
    );
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('<img src=x onerror="alert(1)">');
  });
  it('copies the code', async () => {
    const user = userEvent.setup();
    render(<CodeBlock code={'npm test\n'} language="bash" />);
    await user.click(screen.getByRole('button', { name: 'Copy code' }));
    expect(await navigator.clipboard.readText()).toBe('npm test');
  });
  it('tokenizes known languages and passes unknown ones through', () => {
    expect(tokenize("const a = 'x'", 'ts').map((t) => t.type)).toContain('string');
    expect(tokenize('anything', 'cobol')).toEqual([{ type: 'plain', value: 'anything' }]);
  });
  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <CodeBlock code={sample} language="tsx" title="Example" />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

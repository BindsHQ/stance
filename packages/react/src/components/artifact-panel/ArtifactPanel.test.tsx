import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { ArtifactPanel, type ArtifactPanelProps } from './ArtifactPanel';

const versions = [
  { id: 'v1', label: 'Version 1' },
  { id: 'v2', label: 'Version 2' },
  { id: 'v3', label: 'Version 3' },
];

function Harness(props: Partial<ArtifactPanelProps>) {
  const [open, setOpen] = React.useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Open artifact
      </button>
      {open && (
        <ArtifactPanel title="Launch plan" onClose={() => setOpen(false)} {...props}>
          <button type="button">Inside</button>
        </ArtifactPanel>
      )}
    </div>
  );
}

describe('ArtifactPanel', () => {
  it('is a complementary region named by its title', () => {
    render(
      <ArtifactPanel title="Launch plan" kind="Document">
        <p>Preview content</p>
      </ArtifactPanel>,
    );
    const panel = screen.getByRole('complementary', { name: 'Launch plan' });
    expect(within(panel).getByRole('heading', { level: 2, name: 'Launch plan' })).toBeVisible();
    expect(panel).toHaveTextContent('Document');
    expect(panel).toHaveTextContent('Preview content');
    expect(panel).toHaveAttribute('data-status', 'complete');
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
  });

  it('shows preview and code tabs when code is given, uncontrolled', async () => {
    const user = userEvent.setup();
    const onViewChange = vi.fn();
    render(
      <ArtifactPanel title="Page" code={<pre>source</pre>} onViewChange={onViewChange}>
        <p>Rendered</p>
      </ArtifactPanel>,
    );
    const list = screen.getByRole('tablist', { name: 'View' });
    const preview = within(list).getByRole('tab', { name: 'Preview' });
    const code = within(list).getByRole('tab', { name: 'Code' });
    expect(preview).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'Preview' })).toHaveTextContent('Rendered');
    await user.click(code);
    expect(onViewChange).toHaveBeenCalledWith('code');
    expect(code).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'Code' })).toHaveTextContent('source');
    expect(screen.queryByRole('tabpanel', { name: 'Preview' })).toBeNull();
    expect(screen.getByRole('complementary')).toHaveAttribute('data-view', 'code');
  });

  it('moves between tabs with the arrow keys', async () => {
    const user = userEvent.setup();
    render(
      <ArtifactPanel title="Page" code="source">
        Rendered
      </ArtifactPanel>,
    );
    screen.getByRole('tab', { name: 'Preview' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Code' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Code' })).toHaveAttribute('aria-selected', 'true');
  });

  it('respects a controlled view and defaultView', async () => {
    const onViewChange = vi.fn();
    const { rerender } = render(
      <ArtifactPanel title="Page" code="source" view="preview" onViewChange={onViewChange}>
        Rendered
      </ArtifactPanel>,
    );
    await userEvent.click(screen.getByRole('tab', { name: 'Code' }));
    expect(onViewChange).toHaveBeenCalledWith('code');
    expect(screen.getByRole('tab', { name: 'Preview' })).toHaveAttribute('aria-selected', 'true');
    rerender(
      <ArtifactPanel key="2" title="Page" code="source" defaultView="code">
        Rendered
      </ArtifactPanel>,
    );
    expect(screen.getByRole('tab', { name: 'Code' })).toHaveAttribute('aria-selected', 'true');
  });

  it('switches versions, uncontrolled from the latest', async () => {
    const onVersionChange = vi.fn();
    render(<ArtifactPanel title="Page" versions={versions} onVersionChange={onVersionChange} />);
    const select = screen.getByRole('combobox', { name: 'Version' });
    expect(select).toHaveValue('v3');
    await userEvent.selectOptions(select, 'v1');
    expect(onVersionChange).toHaveBeenCalledWith('v1');
    expect(select).toHaveValue('v1');
  });

  it('respects a controlled version and hides the switcher for one version', async () => {
    const onVersionChange = vi.fn();
    const { rerender } = render(
      <ArtifactPanel
        title="Page"
        versions={versions}
        versionId="v2"
        onVersionChange={onVersionChange}
      />,
    );
    const select = screen.getByRole('combobox', { name: 'Version' });
    await userEvent.selectOptions(select, 'v3');
    expect(onVersionChange).toHaveBeenCalledWith('v3');
    expect(select).toHaveValue('v2');
    rerender(<ArtifactPanel title="Page" versions={versions.slice(0, 1)} />);
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.getByText('Version 1')).toBeInTheDocument();
  });

  it('returns focus to what opened it when closed', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const opener = screen.getByRole('button', { name: 'Open artifact' });
    await user.click(opener);
    expect(opener).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('complementary')).toBeNull();
    expect(opener).toHaveFocus();
  });

  it('returns focus when it unmounts while focus is inside', async () => {
    const user = userEvent.setup();
    function Outer() {
      const [open, setOpen] = React.useState(false);
      return (
        <div>
          <button type="button" onClick={() => setOpen(true)}>
            Open
          </button>
          {open && (
            <ArtifactPanel title="Plan">
              <button type="button" onClick={() => setOpen(false)}>
                Done
              </button>
            </ArtifactPanel>
          )}
        </div>
      );
    }
    render(<Outer />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus();
  });

  it('prefers returnFocusRef', async () => {
    const user = userEvent.setup();
    const target = React.createRef<HTMLButtonElement>();
    render(
      <div>
        <button ref={target} type="button">
          Message action
        </button>
        <Harness returnFocusRef={target} />
      </div>,
    );
    await user.click(screen.getByRole('button', { name: 'Open artifact' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(target.current).toHaveFocus();
  });

  it('reports the generation status', () => {
    const { rerender } = render(
      <ArtifactPanel title="Page" status="streaming">
        Draft
      </ArtifactPanel>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Generating');
    expect(screen.getByText('Draft')).toHaveAttribute('aria-busy', 'true');
    rerender(<ArtifactPanel title="Page" status="error" />);
    expect(screen.getByRole('status')).toHaveTextContent('Something went wrong');
    rerender(<ArtifactPanel title="Page" status="stopped" />);
    expect(screen.getByRole('status')).toHaveTextContent('Stopped');
    rerender(<ArtifactPanel title="Page" />);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('renders actions, a heading level and translated labels', () => {
    render(
      <ArtifactPanel
        title="Sida"
        code="källa"
        versions={versions}
        headingLevel={3}
        onClose={() => {}}
        actions={<button type="button">Publish</button>}
        labels={{ close: 'Stäng', version: 'Version av sidan', preview: 'Förhandsvisning' }}
      />,
    );
    expect(screen.getByRole('heading', { level: 3, name: 'Sida' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publish' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stäng' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Version av sidan' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Förhandsvisning' })).toBeInTheDocument();
  });

  it('forwards the ref, className and props', () => {
    const ref = React.createRef<HTMLElement>();
    render(<ArtifactPanel ref={ref} title="Page" className="mine" id="artifact" />);
    expect(ref.current).toHaveClass('st-artifact-panel', 'mine');
    expect(ref.current).toHaveAttribute('id', 'artifact');
    expect(ref.current?.tagName).toBe('ASIDE');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <ArtifactPanel
          title="Launch plan"
          kind="Document"
          versions={versions}
          code={<pre>source</pre>}
          onClose={() => {}}
          status="streaming"
        >
          <p>Preview</p>
        </ArtifactPanel>
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { ModelPicker, type ModelOption } from './ModelPicker';

const models: ModelOption[] = [
  { id: 'swift', name: 'Swift', description: 'Quick answers for everyday work', badges: ['Fast'] },
  {
    id: 'depth',
    name: 'Depth',
    description: 'Careful reasoning for long documents',
    badges: ['Reasoning', 'Vision'],
  },
  { id: 'lab', name: 'Lab', description: 'Not available on this plan', disabled: true },
];

describe('ModelPicker', () => {
  it('is a combobox named by its label, showing the selected model', () => {
    render(<ModelPicker models={models} defaultValue="swift" />);
    const trigger = screen.getByRole('combobox', { name: 'Model' });
    expect(trigger).toHaveTextContent('Swift');
    expect(trigger).toHaveAttribute('data-size', 'sm');
    expect(screen.getByText('Model')).toHaveClass('st-sr-only');
  });

  it('shows a placeholder when nothing is selected', () => {
    render(<ModelPicker models={models} placeholder="Pick one" />);
    expect(screen.getByRole('combobox')).toHaveTextContent('Pick one');
  });

  it('can show its label, which still names the control', () => {
    render(<ModelPicker models={models} label="Answer with" hideLabel={false} />);
    expect(screen.getByText('Answer with')).not.toHaveClass('st-sr-only');
    expect(screen.getByRole('combobox', { name: 'Answer with' })).toBeInTheDocument();
  });

  it('lists each model with its description and badges', async () => {
    render(<ModelPicker models={models} defaultValue="swift" />);
    await userEvent.click(screen.getByRole('combobox'));
    const listbox = screen.getByRole('listbox', { name: 'Model' });
    const options = within(listbox).getAllByRole('option');
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(options[1]).toHaveTextContent('Depth');
    expect(options[1]).toHaveTextContent('Careful reasoning for long documents');
    expect(options[1]).toHaveTextContent('Reasoning');
    expect(options[1]).toHaveTextContent('Vision');
    expect(options[2]).toHaveAttribute('aria-disabled', 'true');
  });

  it('selects with the pointer when uncontrolled', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<ModelPicker models={models} defaultValue="swift" onValueChange={onValueChange} />);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: /Depth/ }));
    expect(onValueChange).toHaveBeenCalledWith('depth');
    expect(screen.getByRole('combobox')).toHaveTextContent('Depth');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('selects with the keyboard and skips disabled models', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<ModelPicker models={models} defaultValue="swift" onValueChange={onValueChange} />);
    screen.getByRole('combobox').focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).not.toHaveBeenCalledWith('lab');
    expect(screen.getByRole('combobox')).toHaveFocus();
  });

  it('does not select a disabled model on click', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<ModelPicker models={models} defaultValue="swift" onValueChange={onValueChange} />);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: /Lab/ }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('follows a controlled value', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = React.useState('depth');
      return (
        <>
          <ModelPicker models={models} value={value} onValueChange={setValue} />
          <output>{value}</output>
        </>
      );
    }
    render(<Controlled />);
    expect(screen.getByRole('combobox')).toHaveTextContent('Depth');
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: /Swift/ }));
    expect(screen.getByRole('status')).toHaveTextContent('swift');
    expect(screen.getByRole('combobox')).toHaveTextContent('Swift');
  });

  it('stays put when a controlled value is not updated', async () => {
    const user = userEvent.setup();
    render(<ModelPicker models={models} value="swift" />);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: /Depth/ }));
    expect(screen.getByRole('combobox')).toHaveTextContent('Swift');
  });

  it('passes size, className, ref and disabled through', () => {
    const ref = React.createRef<HTMLButtonElement>();
    const { container } = render(
      <ModelPicker ref={ref} models={models} size="lg" className="mine" disabled />,
    );
    expect(container.firstElementChild).toHaveClass('st-model-picker', 'mine');
    expect(ref.current).toBe(screen.getByRole('combobox'));
    expect(ref.current).toHaveAttribute('data-size', 'lg');
    expect(ref.current).toBeDisabled();
  });

  it.each(THEMES)('has no axe violations in %s (closed and open)', async (theme) => {
    const { baseElement } = render(
      <div data-theme={theme}>
        <ModelPicker models={models} defaultValue="swift" />
      </div>,
    );
    await expectNoA11yViolations(baseElement);
    await userEvent.click(screen.getByRole('combobox'));
    await expectNoA11yViolations(baseElement);
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { RangeSlider } from './RangeSlider';

describe('RangeSlider', () => {
  it('renders two labelled thumbs', () => {
    render(<RangeSlider defaultValue={[20, 80]} />);
    expect(screen.getByRole('slider', { name: 'Minimum' })).toHaveAttribute('aria-valuenow', '20');
    expect(screen.getByRole('slider', { name: 'Maximum' })).toHaveAttribute('aria-valuenow', '80');
  });

  it('prevents thumbs from crossing, honouring minStepsBetween', async () => {
    const onChange = vi.fn();
    render(
      <RangeSlider defaultValue={[40, 50]} step={5} minStepsBetween={1} onValueChange={onChange} />,
    );
    const minThumb = screen.getByRole('slider', { name: 'Minimum' });
    minThumb.focus();
    const user = userEvent.setup();
    await user.keyboard('{End}');
    expect(minThumb).toHaveAttribute('aria-valuenow', '45');
    const maxThumb = screen.getByRole('slider', { name: 'Maximum' });
    maxThumb.focus();
    await user.keyboard('{Home}');
    expect(maxThumb).toHaveAttribute('aria-valuenow', '50');
    expect(onChange).toHaveBeenLastCalledWith([45, 50]);
  });

  it('submits both values with indexed names', () => {
    const { container } = render(
      <RangeSlider defaultValue={[1, 9]} min={0} max={10} name="price" />,
    );
    expect((container.querySelector('input[name="price[0]"]') as HTMLInputElement).value).toBe('1');
    expect((container.querySelector('input[name="price[1]"]') as HTMLInputElement).value).toBe('9');
  });

  it.each(THEMES)('axe clean in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <RangeSlider defaultValue={[10, 30]} thumbLabels={['Minimum price', 'Maximum price']} />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

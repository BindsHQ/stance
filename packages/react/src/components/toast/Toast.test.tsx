import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { Toaster } from './Toast';
import { toast } from './toast-store';

const list = () => within(document.querySelector<HTMLElement>('.st-toaster__list')!);

describe('Toast', () => {
  afterEach(() => {
    act(() => toast.dismiss());
    vi.useRealTimers();
  });

  it('shows a toast and announces it politely', () => {
    render(<Toaster />);
    act(() => {
      toast.success('Template published', { description: 'Live for 32 people.' });
    });
    expect(list().getByText('Template published')).toBeInTheDocument();
    const polite = document.querySelector('[aria-live="polite"]')!;
    expect(polite).toHaveTextContent('Template published. Live for 32 people.');
    expect(screen.getByRole('region', { name: /Notifications/ })).toBeInTheDocument();
  });

  it('announces errors assertively', () => {
    render(<Toaster />);
    act(() => {
      toast.error('Could not reach Exchange');
    });
    expect(document.querySelector('[aria-live="assertive"]')).toHaveTextContent(
      'Could not reach Exchange',
    );
  });

  it('auto-dismisses after the duration and pauses on hover', () => {
    vi.useFakeTimers();
    render(<Toaster />);
    act(() => {
      toast('Saved', { duration: 1000 });
    });
    const region = document.querySelector('.st-toaster__list')!;
    act(() => vi.advanceTimersByTime(500));
    fireEvent.pointerEnter(region);
    act(() => vi.advanceTimersByTime(5000));
    expect(list().getByText('Saved')).toBeInTheDocument();
    fireEvent.pointerLeave(region);
    act(() => vi.advanceTimersByTime(499));
    expect(list().getByText('Saved')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(2));
    expect(list().queryByText('Saved')).toBeNull();
  });

  it('runs actions and dismisses via the close button', async () => {
    const undo = vi.fn();
    render(<Toaster />);
    act(() => {
      toast('User removed', { action: { label: 'Undo', onClick: undo } });
      toast('Another');
    });
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(undo).toHaveBeenCalledOnce();
    expect(list().queryByText('User removed')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    expect(list().queryByText('Another')).toBeNull();
  });

  it('limits visible toasts and queues the rest', () => {
    render(<Toaster visibleToasts={2} />);
    act(() => {
      toast('One');
      toast('Two');
      toast('Three');
    });
    expect(list().queryByText('One')).toBeNull();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    act(() => toast.dismiss());
  });

  it('tracks promises from loading to success', async () => {
    render(<Toaster />);
    let resolve!: (v: number) => void;
    const p = new Promise<number>((r) => (resolve = r));
    act(() => {
      void toast.promise(p, {
        loading: 'Uploading 120 users…',
        success: (n) => `${n} users imported`,
        error: 'Upload failed',
      });
    });
    expect(list().getByText('Uploading 120 users…')).toBeInTheDocument();
    await act(async () => {
      resolve(120);
      await p;
    });
    expect(list().getByText('120 users imported')).toBeInTheDocument();
  });

  it('focuses the toast list with F8', async () => {
    render(<Toaster />);
    act(() => {
      toast('Hello');
    });
    await userEvent.keyboard('{F8}');
    expect(document.querySelector('.st-toaster__list')).toHaveFocus();
  });

  it('has no axe violations', async () => {
    render(<Toaster />);
    act(() => {
      toast.info('Sync scheduled', { action: { label: 'View', onClick: () => {} } });
    });
    await expectNoA11yViolations(document.body);
  });
});

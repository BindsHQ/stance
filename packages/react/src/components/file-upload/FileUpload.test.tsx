import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { FormField } from '../form-field/FormField';
import { FileUpload, formatBytes } from './FileUpload';

const pdf = (name = 'contract.pdf', size = 2048) =>
  new File([new Uint8Array(size)], name, { type: 'application/pdf' });
const png = () => new File([new Uint8Array(10)], 'logo.png', { type: 'image/png' });
const fileInput = (c: HTMLElement) => c.querySelector('input[type="file"]') as HTMLInputElement;

describe('FileUpload', () => {
  it('adds files via the input and lists them with remove buttons', async () => {
    const onFiles = vi.fn();
    const { container } = render(
      <FileUpload multiple onFilesChange={onFiles} hint="PDF up to 10 MB" />,
    );
    await userEvent.upload(fileInput(container), [pdf('a.pdf'), pdf('b.pdf')]);
    expect(onFiles).toHaveBeenLastCalledWith([expect.any(File), expect.any(File)]);
    expect(screen.getByRole('list', { name: 'Selected files' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('2 files added. 2 selected.');
    await userEvent.click(screen.getByRole('button', { name: 'Remove a.pdf' }));
    expect(screen.queryByText('a.pdf')).toBeNull();
    expect(screen.getByText('b.pdf')).toBeInTheDocument();
  });

  it('validates type and size and reports rejections', async () => {
    const onReject = vi.fn();
    const { container } = render(
      <FileUpload accept=".pdf" maxSize={1000} multiple onReject={onReject} />,
    );
    await userEvent.upload(fileInput(container), [pdf('big.pdf', 5000)], { applyAccept: false });
    expect(screen.getByRole('alert')).toHaveTextContent('big.pdf is larger than 1000 B');
    fireEvent.drop(container.querySelector('.st-file-upload__dropzone')!, {
      dataTransfer: { files: [png()] },
    });
    expect(onReject).toHaveBeenLastCalledWith([
      expect.objectContaining({ reason: 'file-invalid-type' }),
    ]);
  });

  it('enforces maxFiles and single-file replacement', async () => {
    const { container, unmount } = render(<FileUpload multiple maxFiles={1} />);
    await userEvent.upload(fileInput(container), [pdf('one.pdf'), pdf('two.pdf')]);
    expect(screen.getByText('one.pdf')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/two\.pdf was not added/);
    unmount();
    const r = render(<FileUpload />);
    await userEvent.upload(fileInput(r.container), pdf('first.pdf'));
    await userEvent.upload(fileInput(r.container), pdf('second.pdf'));
    expect(screen.queryByText('first.pdf')).toBeNull();
    expect(screen.getByText('second.pdf')).toBeInTheDocument();
  });

  it('accepts dropped files and marks the drag state', () => {
    const onFiles = vi.fn();
    const { container } = render(<FileUpload onFilesChange={onFiles} />);
    const zone = container.querySelector('.st-file-upload__dropzone')!;
    fireEvent.dragEnter(zone, { dataTransfer: { files: [] } });
    expect(zone).toHaveAttribute('data-dragging');
    fireEvent.drop(zone, { dataTransfer: { files: [pdf()] } });
    expect(onFiles).toHaveBeenCalledWith([expect.any(File)]);
    expect(zone).not.toHaveAttribute('data-dragging');
  });

  it('keyboard: browse button is the focusable control and FormField labels it', async () => {
    render(
      <FormField label="Signed contract" description="Upload the countersigned copy" required>
        <FileUpload hint="PDF only" />
      </FormField>,
    );
    const button = screen.getByRole('button', { name: /Signed contract/ });
    expect(button).toHaveAccessibleDescription('Upload the countersigned copy PDF only');
    // Buttons do not support aria-required; FormField's label carries "required" into the name.
    expect(button).toHaveAccessibleName(/required/);
    expect(button).not.toHaveAttribute('aria-required');
    await userEvent.tab();
    expect(button).toHaveFocus();
  });

  it('formats bytes', () => {
    expect(formatBytes(500)).toBe('500 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(10 * 1024 * 1024)).toBe('10 MB');
  });

  it.each(THEMES)('axe clean in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <FormField label="Attachments">
          <FileUpload multiple defaultValue={[pdf()]} hint="Up to 5 files" />
        </FormField>
        <FileUpload variant="compact" aria-label="Logo" />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

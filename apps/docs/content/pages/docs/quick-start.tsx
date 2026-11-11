import { Code } from '../../../components/code';

export default function QuickStart() {
  return (
    <>
      <h2 id="provider">1. Add the theme provider</h2>
      <p>
        <code>ThemeScript</code> applies the saved theme before first paint.{' '}
        <code>ThemeProvider</code> keeps it in sync with the user’s choice and the operating system.
      </p>
      <Code
        title="app/layout.tsx"
        code={`import { ThemeProvider, ThemeScript } from '@bindshq/stance-react';
import '@bindshq/stance-tokens/css';
import '@bindshq/stance-react/styles.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}`}
      />
      <h2 id="first-form">2. Build with components</h2>
      <Code
        code={`'use client';
import { Button, FormField, Input, Dialog, DialogTrigger, DialogContent,
  DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogClose } from '@bindshq/stance-react';

export function RenameTemplate() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Rename template</Button>
      </DialogTrigger>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Rename template</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <FormField label="Template name" description="Visible to everyone in your organisation.">
            <Input defaultValue="Standard signature" />
          </FormField>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
          <Button>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}`}
      />
      <h2 id="theme-toggle">3. Let people choose a theme</h2>
      <Code
        code={`import { ThemeSwitcher } from '@bindshq/stance-react';\n\n<ThemeSwitcher /> // Light · Dark · High contrast · System`}
      />
      <h2 id="tokens-in-css">4. Use tokens in your own CSS</h2>
      <Code
        language="css"
        code={`.contract-summary {
  padding: var(--st-space-6);
  background: var(--st-color-bg-surface);
  border: 1px solid var(--st-color-border-default);
  border-radius: var(--st-radius-lg);
  color: var(--st-color-fg-default);
}`}
      />
    </>
  );
}

// Consumer fixture: type-checks the *built* declarations exactly as an application would,
// with full library checking. CI runs it against both @types/react 18 and 19.
import * as Stance from '@bindshq/stance-react';
import * as Tokens from '@bindshq/stance-tokens';
import preset from '@bindshq/stance-tokens/tailwind';

export const brand: string = Tokens.brand.indigo;
export const tailwind = preset.theme.extend;

export function App() {
  return (
    <Stance.ThemeProvider storageKey="theme" legacyStorageKeys={['theme']}>
      <Stance.FormField label="Template name" required>
        <Stance.Input defaultValue="Sales team" />
      </Stance.FormField>
      <Stance.Button variant="danger" loading>
        Delete
      </Stance.Button>
      <Stance.ErrorBoundary fallback={<p>Something went wrong</p>}>
        <Stance.Badge tone="success">Live</Stance.Badge>
      </Stance.ErrorBoundary>
    </Stance.ThemeProvider>
  );
}

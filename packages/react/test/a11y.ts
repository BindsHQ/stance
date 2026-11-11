import axe from 'axe-core';
import { expect } from 'vitest';

/**
 * Runs axe-core against a container and fails with a readable list of violations.
 * Colour contrast is verified by the token contrast tests (jsdom has no layout).
 */
export async function expectNoA11yViolations(container: Element = document.body) {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  });
  const messages = results.violations.map(
    (v) => `${v.id}: ${v.help}\n  ${v.nodes.map((n) => n.target.join(' ')).join('\n  ')}`,
  );
  expect(messages, messages.join('\n\n')).toEqual([]);
}

/** Renders the same UI under each theme attribute; returns themes for iteration. */
export const THEMES = ['light', 'dark', 'high-contrast'] as const;

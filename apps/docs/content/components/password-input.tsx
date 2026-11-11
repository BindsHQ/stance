import { FormField, PasswordInput } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'password-input',
  name: 'PasswordInput',
  category: 'forms',
  summary: 'Password entry with a show/hide toggle and an optional strength meter.',
  description:
    'Use PasswordInput for sign-in and password creation. The visibility toggle lets people check what they typed, which reduces errors more than a confirm-password field. Enable strength on sign-up and password change; supply your own scorer to match your password policy.',
  imports: ['PasswordInput', 'estimatePasswordStrength'],
  status: 'stable',
  examples: [
    { name: 'SignIn', title: 'Sign in', layout: 'start' },
    { name: 'Strength', title: 'With strength meter', layout: 'start' },
    { name: 'CustomScore', title: 'Custom scoring', layout: 'start' },
  ],
  props: [
    {
      component: 'PasswordInput',
      name: 'strength',
      type: 'boolean | ((password: string) => PasswordStrength)',
      description: 'Show a strength meter, optionally with your own scorer.',
    },
    {
      component: 'PasswordInput',
      name: 'visible',
      type: 'boolean',
      description: 'Controlled visibility.',
    },
    {
      component: 'PasswordInput',
      name: 'onVisibleChange',
      type: '(visible: boolean) => void',
      description: 'Called when the toggle is pressed.',
    },
    {
      component: 'PasswordInput',
      name: 'showLabel / hideLabel',
      type: 'string',
      default: "'Show password' / 'Hide password'",
      description: 'Toggle labels.',
    },
    {
      component: 'PasswordInput',
      name: 'autoComplete',
      type: 'string',
      default: "'current-password'",
      description: 'Use "new-password" on sign-up.',
    },
    {
      component: 'PasswordInput',
      name: '...props',
      type: 'InputProps',
      description: 'All Input props except type and suffix.',
    },
    {
      component: 'estimatePasswordStrength',
      name: '(password) => PasswordStrength',
      type: 'function',
      description: 'The default length-and-variety heuristic, score 0–4.',
    },
  ],
  accessibility: [
    'The toggle is a real button with aria-pressed and a label that states the action ("Show password").',
    'Strength text is linked to the input with aria-describedby and updates in a polite live region.',
    'Strength is shown as both bars and words, never colour alone.',
    'Spell-check and auto-capitalisation are turned off so the password is not leaked to dictionaries.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves from the field to the visibility toggle.' },
    { keys: ['Space', 'Enter'], description: 'On the toggle: shows or hides the password.' },
  ],
  related: ['input', 'form-field'],
};

export function SignIn() {
  return (
    <div style={{ width: '100%', maxWidth: 360 }}>
      <FormField label="Password" required>
        <PasswordInput />
      </FormField>
    </div>
  );
}

export function Strength() {
  return (
    <div style={{ width: '100%', maxWidth: 360 }}>
      <FormField label="Create a password" description="At least 12 characters.">
        <PasswordInput strength autoComplete="new-password" defaultValue="Signed2026" />
      </FormField>
    </div>
  );
}

export function CustomScore() {
  return (
    <div style={{ width: '100%', maxWidth: 360 }}>
      <FormField label="Admin password" description="Admins need 16 characters or more.">
        <PasswordInput
          autoComplete="new-password"
          strength={(pw) =>
            pw.length >= 16
              ? { score: 4, label: 'Meets admin policy' }
              : { score: 1, label: `${16 - pw.length} more characters needed` }
          }
        />
      </FormField>
    </div>
  );
}

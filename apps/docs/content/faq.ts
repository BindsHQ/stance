/** Answer-first FAQ, rendered visibly on the home page and mirrored as FAQPage JSON-LD. */
export const faq: { q: string; a: string }[] = [
  {
    q: 'What is Stance?',
    a: 'Stance is the official open-source design system of Binds. It provides design tokens, light, dark and high-contrast themes, and accessible React components that Binds products such as binds.si and eSignify are built with.',
  },
  {
    q: 'Is Stance free to use?',
    a: 'Yes. The code is released under the Apache License 2.0, so you can use, modify and distribute it in personal and commercial projects. The Binds and Stance names and logos are trademarks and are not part of the licence.',
  },
  {
    q: 'How do I install Stance?',
    a: 'Run npm install @bindshq/stance-tokens @bindshq/stance-react, import @bindshq/stance-tokens/css and @bindshq/stance-react/styles.css once, and wrap your app in ThemeProvider.',
  },
  {
    q: 'Does Stance depend on Radix, shadcn/ui or Tailwind?',
    a: 'No. Stance has zero runtime dependencies besides React. Focus management, positioning, menus, date maths and virtualisation are implemented in Stance itself. Tailwind is optional; Stance ships presets for Tailwind v3 and v4.',
  },
  {
    q: 'Which React versions does Stance support?',
    a: 'React 18.2 and later, including React 19. Components work in Next.js server component trees because client code is marked with use client only where needed.',
  },
  {
    q: 'Is Stance accessible?',
    a: 'Stance targets WCAG 2.2 AA. Every theme passes automated contrast checks, every interactive component is tested with axe-core in light, dark and high contrast, and keyboard behaviour follows the WAI-ARIA Authoring Practices.',
  },
  {
    q: 'What are the Binds brand colours?',
    a: 'Binds has two official colours: ivory #FCF6EB and indigo #140C2E. Every neutral in Stance is interpolated between them.',
  },
  {
    q: 'Does Stance support dark mode and high contrast?',
    a: 'Yes. Stance has three complete themes: light, dark and high contrast. It follows the operating system preference, remembers the user’s choice and applies it before first paint to avoid a flash.',
  },
];

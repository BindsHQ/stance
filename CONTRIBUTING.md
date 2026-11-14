# Contributing to Stance

Thank you for helping improve Stance. This guide explains how the repository works and what we expect from changes.

## Ground rules

- **Zero runtime dependencies.** Stance packages must not add third-party runtime dependencies. Accessibility primitives (focus scope, layers, positioning, roving focus) live in `packages/react/src/internal`.
- **Tokens only.** Component CSS uses `--st-*` variables, never raw colour values.
- **Accessible by definition.** A component is not done until it has keyboard support, correct roles and states, and passes axe in all three themes.
- **Composition over configuration.** Prefer compound parts and `asChild` to large prop surfaces.
- **No product layouts.** Stance provides primitives; Binds and eSignify own their page structures.

## Setup

```bash
npm install
npm run build
npm test
npm run dev:docs
```

## Adding or changing a component

1. Open an issue describing the need and which products need it.
2. Create `packages/react/src/components/<name>/` containing:
   - `<Name>.tsx`: the component, using `forwardRef` and native props, with `st-<name>` classes and `data-*` state
   - `<name>.css`: styles that use tokens only, including a `forced-colors` block where boundaries matter
   - `<Name>.test.tsx`: roles, keyboard behaviour, controlled and uncontrolled use, and `expectNoA11yViolations` in each theme
   - `index.ts`: the public exports
3. Run `node scripts/generate-index.mjs` to register the component.
4. Document it in `apps/docs/content/components/<name>.tsx`, following `lib/docs-types.ts`.
5. Run `npx changeset` and describe the change for users.

## Checks

Pull requests must pass:

```bash
npm run build && npm run typecheck && npm test && npm run lint && npm run check:exports && npm run build:docs
```

## Commits and releases

- Use conventional commit prefixes (`feat:`, `fix:`, `docs:`, `chore:`).
- Every user-facing change needs a changeset. Maintainers version and publish with Changesets.
- Breaking changes must be called out in the changeset with migration notes.

## Licensing of contributions

Stance is licensed under the [Apache License, Version 2.0](./LICENSE). By submitting a contribution you agree that it is licensed under the same terms, as Section 5 of the License describes, and that you have the right to submit it.

- Do not add code, assets or fonts under a licence that is incompatible with Apache 2.0. Third party material that is allowed must be listed in [NOTICE](./NOTICE).
- Do not change the [LICENSE](./LICENSE) or [NOTICE](./NOTICE) files, or the brand artwork in [`brand/`](./brand), without approval from a maintainer.
- Contributions do not transfer any rights in the Stance or Binds trademarks. See [TRADEMARK.md](./TRADEMARK.md).

## Code of conduct

This project follows our [Code of Conduct](./CODE_OF_CONDUCT.md).

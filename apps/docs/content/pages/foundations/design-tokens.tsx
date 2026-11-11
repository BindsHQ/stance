import { Code } from '../../../components/code';

export default function DesignTokens() {
  return (
    <>
      <p>
        Every value in Stance is written once, in a platform-independent source that follows the W3C
        Design Tokens format. A generator validates the source and produces the files each platform
        consumes.
      </p>
      <h2 id="pipeline">Pipeline</h2>
      <Code
        language="text"
        code={`packages/tokens/source/**/*.json      the only place values are written
        │  validate → resolve aliases → generate
        ├── CSS custom properties           @bindshq/stance-tokens/css
        ├── TypeScript constants            @bindshq/stance-tokens
        ├── Tailwind v3 preset / v4 theme   @bindshq/stance-tokens/tailwind
        ├── Swift constants                 StanceTokens (Swift Package)
        ├── Kotlin constants                com.bindshq.stance.tokens
        └── Resolved JSON                   for any other tool`}
      />
      <h2 id="source">Source format</h2>
      <p>
        Themes reference primitives by alias, so a role always traces back to a brand-derived value.
      </p>
      <Code
        language="json"
        code={`// source/semantic/light.json
{
  "color": {
    "$type": "color",
    "bg-canvas":  { "$value": "{color.brand.ivory}" },
    "fg-default": { "$value": "{color.brand.indigo}" },
    "fg-muted":   { "$value": "{color.ink.600}" }
  }
}`}
      />
      <h2 id="outputs">The same role on each platform</h2>
      <Code language="css" code={`/* Web */\ncolor: var(--st-color-fg-muted);`} />
      <Code
        language="swift"
        code={`// iOS\nStanceTokens.light.colors.fgMuted   // StanceRGBA(hex: 0x555169)`}
      />
      <Code
        language="kotlin"
        code={`// Android\nStanceTokens.light.colors.fgMuted   // 0xFF555169`}
      />
      <p>
        Dimensions are generated in each platform’s unit: rem on the web, points on iOS, dp and sp
        on Android (1rem = 16).
      </p>
      <h2 id="guarantees">Guarantees</h2>
      <ul>
        <li>
          <strong>Validated.</strong> Every token has a type, every alias resolves, and all three
          themes define exactly the same roles.
        </li>
        <li>
          <strong>Reproducible.</strong> Generated files are committed, and CI fails if they differ
          from what the source produces.
        </li>
        <li>
          <strong>In parity.</strong> Tests compare the Swift and Kotlin values with the source for
          every role in every theme.
        </li>
        <li>
          <strong>Accessible.</strong> Contrast for every text and boundary pair is tested in light,
          dark and high contrast.
        </li>
        <li>
          <strong>Brand-locked.</strong> The build fails if the two brand colours are ever changed.
        </li>
      </ul>
      <h2 id="changing">Changing a token</h2>
      <Code
        language="bash"
        code={`# 1. edit packages/tokens/source/...\nnpm run tokens        # regenerate CSS, TypeScript, Swift, Kotlin\nnpm test              # contrast and cross-platform parity`}
      />
    </>
  );
}

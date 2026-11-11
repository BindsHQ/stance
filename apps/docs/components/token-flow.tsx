import { light } from '@bindshq/stance-tokens';
import { Code } from './code';

/** One token edit, shown arriving in every platform's generated code. */
export function TokenFlow() {
  const value = light.colors['fg-muted'];
  return (
    <div className="token-flow">
      <div className="token-flow__source">
        <span className="token-flow__label">You change one token</span>
        <Code
          title="packages/tokens/source/semantic/light.json"
          language="json"
          code={`"fg-muted": { "$value": "{color.ink.600}" }`}
        />
        <span className="token-flow__swatch" aria-hidden="true">
          <i style={{ background: value }} />
          {value}
        </span>
      </div>
      <div className="token-flow__arrow" aria-hidden="true">
        <svg
          viewBox="0 0 120 24"
          width="120"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M2 12h110M104 5l8 7-8 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="token-flow__outputs">
        <span className="token-flow__label">Every platform follows</span>
        <Code
          title="Web · CSS"
          language="css"
          code={`color: var(--st-color-fg-muted);  /* ${value} */`}
        />
        <Code title="iOS · Swift" language="swift" code={`theme.colors.fgMuted  // ${value}`} />
        <Code
          title="Android · Kotlin"
          language="kotlin"
          code={`StanceTheme.colors.fgMuted  // ${value}`}
        />
      </div>
    </div>
  );
}

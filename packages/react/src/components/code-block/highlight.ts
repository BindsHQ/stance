/**
 * A deliberately tiny, safe tokenizer for docs-grade highlighting.
 * Produces plain token objects that are rendered as text nodes, never HTML.
 */
export type TokenType =
  'comment' | 'string' | 'keyword' | 'number' | 'tag' | 'attr' | 'punct' | 'fn' | 'prop' | 'plain';
export interface Token {
  type: TokenType;
  value: string;
}

const JS_KEYWORDS =
  'import|from|export|default|const|let|var|function|return|if|else|for|while|of|in|new|class|extends|type|interface|async|await|true|false|null|undefined|as|typeof|this|try|catch|throw|switch|case|break|void';

type Rule = [TokenType, RegExp];

const rules: Record<string, Rule[]> = {
  js: [
    ['comment', /^(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/],
    ['string', /^(`(?:\\.|[^`\\])*`|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*")/],
    ['tag', /^<\/?[A-Za-z][\w.]*/],
    ['keyword', new RegExp(`^\\b(?:${JS_KEYWORDS})\\b`)],
    ['number', /^\b\d[\d_.]*\b/],
    ['fn', /^[A-Za-z_$][\w$]*(?=\s*\()/],
    ['attr', /^[A-Za-z_-][\w-]*(?==)/],
    ['plain', /^[A-Za-z_$][\w$]*/],
    ['punct', /^[{}()[\];,.<>/=+\-*!?:&|]+/],
  ],
  css: [
    ['comment', /^\/\*[\s\S]*?\*\//],
    ['string', /^('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")/],
    ['prop', /^--?[a-z][\w-]*(?=\s*:)/i],
    ['keyword', /^@[a-z-]+/],
    ['fn', /^[a-z-]+(?=\()/i],
    ['number', /^-?\d[\d.]*(?:px|rem|em|%|ms|s|vh|vw|dvh|fr)?/],
    ['tag', /^[.#]?[a-z][\w-]*/i],
    ['punct', /^[{}():;,>+~*[\]=]+/],
  ],
  bash: [
    ['comment', /^#[^\n]*/],
    ['string', /^('(?:[^'])*'|"(?:\\.|[^"\\])*")/],
    ['keyword', /^\b(?:npm|npx|pnpm|yarn|git|cd|export|echo|node|install|run|add)\b/],
    ['attr', /^--?[\w-]+/],
    ['plain', /^[^\s'"#]+/],
  ],
  json: [
    ['prop', /^"(?:\\.|[^"\\])*"(?=\s*:)/],
    ['string', /^"(?:\\.|[^"\\])*"/],
    ['number', /^-?\d[\d.eE+-]*/],
    ['keyword', /^\b(?:true|false|null)\b/],
    ['punct', /^[{}[\]:,]/],
  ],
};
rules.ts = rules.js!;
rules.tsx = rules.js!;
rules.jsx = rules.js!;
rules.html = rules.js!;
rules.sh = rules.bash!;
rules.shell = rules.bash!;

export function tokenize(code: string, language: string | undefined): Token[] {
  const set = language ? rules[language.toLowerCase()] : undefined;
  if (!set) return [{ type: 'plain', value: code }];
  const tokens: Token[] = [];
  let rest = code;
  const push = (type: TokenType, value: string) => {
    const last = tokens[tokens.length - 1];
    if (last && last.type === type && type === 'plain') last.value += value;
    else tokens.push({ type, value });
  };
  while (rest.length) {
    const ws = /^\s+/.exec(rest);
    if (ws) {
      push('plain', ws[0]);
      rest = rest.slice(ws[0].length);
      continue;
    }
    let matched = false;
    for (const [type, re] of set) {
      const m = re.exec(rest);
      if (m && m[0].length) {
        push(type, m[0]);
        rest = rest.slice(m[0].length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      push('plain', rest[0]!);
      rest = rest.slice(1);
    }
  }
  return tokens;
}

/** Splits tokens into lines, cutting tokens that span newlines. */
export function toLines(tokens: Token[]): Token[][] {
  const lines: Token[][] = [[]];
  for (const token of tokens) {
    const parts = token.value.split('\n');
    parts.forEach((part, i) => {
      if (i > 0) lines.push([]);
      if (part) lines[lines.length - 1]!.push({ type: token.type, value: part });
    });
  }
  return lines;
}

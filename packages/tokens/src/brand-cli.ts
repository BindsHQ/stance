/**
 * The `stance-brand` command: writes a brand stylesheet at build time.
 * Kept free of Node APIs so it can be tested directly; bin/stance-brand.mjs supplies the I/O.
 */
import { createBrandTheme, formatBrandReport, type Brand } from './brand.js';

export interface BrandCliIO {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
  writeFile: (path: string, text: string) => void;
}

export const brandCliUsage = `Usage: stance-brand --light <hex> --dark <hex> [options]

Writes a stylesheet that themes Stance with your brand colours.

Options:
  --light <hex>    Your lightest brand colour (light canvas, text on dark surfaces)
  --dark <hex>     Your darkest brand colour (text, default accent, dark canvas)
  --accent <hex>   Optional colour for primary actions, selection, links and focus
  --accent-dark <hex>  Optional separate accent for the dark theme
  --name <text>    Brand name used in the CSS comment and messages (default "Brand")
  --out <file>     Write the CSS to a file instead of standard output
  --check          Exit with status 1 when any contrast check fails
  --help           Show this message

Example:
  npx stance-brand --light '#F7F5F0' --dark '#1D2A3A' --name Acme > brand.css

Docs: https://www.stanceui.com/docs/theming#your-brand
`;

const FLAGS = new Set(['light', 'dark', 'accent', 'accent-dark', 'name', 'out']);

/** Runs the CLI with arguments (without `node` and the script path). Returns the exit code. */
export function runBrandCli(argv: readonly string[], io: BrandCliIO): number {
  const values: Record<string, string> = {};
  let check = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] ?? '';
    if (arg === '--help' || arg === '-h') {
      io.stdout(brandCliUsage);
      return 0;
    }
    if (arg === '--check') {
      check = true;
      continue;
    }
    const match = /^--([a-z-]+)(?:=(.*))?$/.exec(arg);
    const key = match?.[1];
    if (!match || !key || !FLAGS.has(key)) {
      io.stderr(`stance-brand: unknown argument ${arg}\n\n${brandCliUsage}`);
      return 2;
    }
    const value = match[2] ?? argv[++i];
    if (value === undefined || value === '') {
      io.stderr(`stance-brand: --${key} needs a value\n`);
      return 2;
    }
    values[key] = value;
  }
  if (values['accent-dark'] && !values.accent) {
    io.stderr('stance-brand: --accent-dark needs --accent for the light themes\n');
    return 2;
  }
  if (!values.light || !values.dark) {
    io.stderr(`stance-brand: --light and --dark are required\n\n${brandCliUsage}`);
    return 2;
  }

  const brand: Brand = {
    name: values.name ?? 'Brand',
    light: values.light,
    dark: values.dark,
    ...(values['accent-dark']
      ? { accent: { light: values.accent ?? values.dark, dark: values['accent-dark'] } }
      : values.accent
        ? { accent: values.accent }
        : {}),
  };
  let result;
  try {
    result = createBrandTheme(brand);
  } catch (error) {
    io.stderr(`stance-brand: ${(error as Error).message}\n`);
    return 2;
  }

  if (values.out) {
    io.writeFile(values.out, result.css);
    io.stderr(`stance-brand: wrote ${values.out}\n`);
  } else {
    io.stdout(result.css);
  }

  if (result.report.length === 0) {
    io.stderr('stance-brand: every contrast check passes.\n');
    return 0;
  }
  io.stderr(
    `stance-brand: ${result.report.length} contrast ${result.report.length === 1 ? 'check fails' : 'checks fail'}:\n` +
      formatBrandReport(result.report)
        .map((line) => `  ${line}\n`)
        .join(''),
  );
  return check ? 1 : 0;
}

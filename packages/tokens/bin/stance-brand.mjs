#!/usr/bin/env node
// stance-brand: writes a stylesheet that themes Stance with your brand colours.
// Run `npx stance-brand --help` for options.
import { writeFileSync } from 'node:fs';
import { runBrandCli } from '../dist/brand-cli.js';

process.exitCode = runBrandCli(process.argv.slice(2), {
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
  writeFile: (path, text) => writeFileSync(path, text),
});

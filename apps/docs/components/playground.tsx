'use client';
import * as React from 'react';
import type { ComponentDoc, ControlDoc } from '../lib/docs-types';
import { Code } from './code';

function toJsx(
  name: string,
  values: Record<string, unknown>,
  controls: Record<string, ControlDoc>,
) {
  const attrs: string[] = [];
  let children: string | null = null;
  for (const [key, control] of Object.entries(controls)) {
    const v = values[key];
    if (key === 'children') {
      children = String(v);
      continue;
    }
    if (v === control.default) continue;
    if (typeof v === 'boolean') attrs.push(v ? key : `${key}={false}`);
    else if (typeof v === 'number') attrs.push(`${key}={${v}}`);
    else attrs.push(`${key}="${String(v)}"`);
  }
  const open = `<${name}${attrs.length ? ' ' + attrs.join(' ') : ''}`;
  return children != null ? `${open}>${children}</${name}>` : `${open} />`;
}

export function Playground({ doc }: { doc: ComponentDoc }) {
  const pg = doc.playground!;
  const initial = Object.fromEntries(Object.entries(pg.controls).map(([k, c]) => [k, c.default]));
  const [values, setValues] = React.useState<Record<string, unknown>>(initial);
  const set = (k: string, v: unknown) => setValues((prev) => ({ ...prev, [k]: v }));
  const uid = React.useId();
  return (
    <div className="playground">
      <div className="playground__canvas">{pg.render(values)}</div>
      <form
        className="playground__controls"
        aria-label={`${doc.name} properties`}
        onSubmit={(e) => e.preventDefault()}
      >
        {Object.entries(pg.controls).map(([key, control]) => {
          const id = `${uid}-${key}`;
          return (
            <div key={key} className="playground__control">
              <label htmlFor={id}>{key}</label>
              {control.type === 'select' && (
                <select
                  id={id}
                  value={String(values[key])}
                  onChange={(e) => set(key, e.target.value)}
                >
                  {control.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              )}
              {control.type === 'boolean' && (
                <input
                  id={id}
                  type="checkbox"
                  checked={Boolean(values[key])}
                  onChange={(e) => set(key, e.target.checked)}
                />
              )}
              {control.type === 'text' && (
                <input
                  id={id}
                  type="text"
                  value={String(values[key])}
                  onChange={(e) => set(key, e.target.value)}
                />
              )}
              {control.type === 'number' && (
                <input
                  id={id}
                  type="number"
                  value={Number(values[key])}
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  onChange={(e) => set(key, Number(e.target.value))}
                />
              )}
            </div>
          );
        })}
        <button type="button" className="playground__reset" onClick={() => setValues(initial)}>
          Reset
        </button>
      </form>
      <div className="playground__code">
        <Code code={toJsx(doc.imports[0] ?? doc.name, values, pg.controls)} />
      </div>
    </div>
  );
}

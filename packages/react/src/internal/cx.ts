export type ClassValue = string | number | false | null | undefined | ClassValue[];

/** Joins truthy class names. Tiny, dependency-free. */
export function cx(...values: ClassValue[]): string {
  let out = '';
  for (const v of values) {
    if (!v) continue;
    const s = Array.isArray(v) ? cx(...v) : String(v);
    if (s) out = out ? `${out} ${s}` : s;
  }
  return out;
}

// Links between native inventories and web components. Kept free of imports so the
// registry generator can compile and run it in Node to validate inventories.

/** One native component may cover one web component, several, or none. */
export type WebEquivalent = string | string[] | null | undefined;

/** Every web slug a native component covers, whatever form the inventory uses. */
export function webSlugs(value: WebEquivalent): string[] {
  if (value == null) return [];
  return (Array.isArray(value) ? value : [value]).filter((s) => typeof s === 'string' && s !== '');
}

/** True when the native component covers the web component `slug`. */
export function coversWeb(value: WebEquivalent, slug: string): boolean {
  return webSlugs(value).includes(slug);
}

/** True when two native components cover at least one web component in common. */
export function sharesWeb(a: WebEquivalent, b: WebEquivalent): boolean {
  const other = webSlugs(b);
  return webSlugs(a).some((s) => other.includes(s));
}

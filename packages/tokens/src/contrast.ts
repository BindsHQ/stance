/** WCAG 2.x relative-luminance contrast utilities (sRGB hex only). */

export { hexToRgb, luminance, contrastRatio } from './brand-engine.js';
import { hexToRgb } from './brand-engine.js';

/** Convert hex to an `H S% L%` triplet (handy when bridging HSL-variable stylesheets). */
export function hexToHslTriplet(hex: string): string {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  const f = (x: number) => Math.round(x * 10) / 10;
  return `${f(h)} ${f(s * 100)}% ${f(l * 100)}%`;
}

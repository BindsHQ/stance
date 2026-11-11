/** Formats a date relative to now ("5 minutes ago", "yesterday") with Intl. */
export function formatRelativeTime(date: Date, now: Date = new Date(), locale?: string): string {
  const diff = (date.getTime() - now.getTime()) / 1000;
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (abs < 45) return rtf.format(0, 'second');
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['minute', 60],
    ['hour', 3600],
    ['day', 86400],
    ['week', 604800],
    ['month', 2629800],
    ['year', 31557600],
  ];
  let unit: Intl.RelativeTimeFormatUnit = 'minute';
  let size = 60;
  for (const [u, s] of units) {
    if (abs >= s * 0.9) {
      unit = u;
      size = s;
    }
  }
  return rtf.format(Math.round(diff / size), unit);
}

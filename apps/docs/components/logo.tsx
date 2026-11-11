/** The Stance mark: two counterweighted blocks on a shared axis — a balanced stance. */
export function StanceMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="8" fill="var(--st-color-accent-bg)" />
      <path d="M8 8h16v6H13a5 5 0 0 1-5-5z" fill="var(--st-color-accent-fg)" />
      <path d="M8 18h11a5 5 0 0 1 5 5v1H8z" fill="var(--st-color-accent-fg)" />
    </svg>
  );
}

export function StanceWordmark() {
  return (
    <span className="site-wordmark">
      <StanceMark />
      <span className="site-wordmark__text">Stance</span>
    </span>
  );
}

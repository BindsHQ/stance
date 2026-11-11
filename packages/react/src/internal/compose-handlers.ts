/** Calls the user handler first; skips ours if the user called preventDefault(). */
export function composeHandlers<E extends { defaultPrevented: boolean }>(
  theirs: ((event: E) => void) | undefined,
  ours: (event: E) => void,
): (event: E) => void {
  return (event) => {
    theirs?.(event);
    if (!event.defaultPrevented) ours(event);
  };
}

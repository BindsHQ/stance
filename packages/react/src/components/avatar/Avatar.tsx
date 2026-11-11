'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarStatus = 'online' | 'away' | 'busy' | 'offline';

export interface AvatarProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Person or organisation name. Used for initials, tint and the accessible name. */
  name: string;
  /** Image URL. Falls back to initials while loading or on error. */
  src?: string;
  /** xs 20, sm 28, md 36, lg 48, xl 64. Default `md`. */
  size?: AvatarSize;
  /** `square` suits organisations and workspaces. Default `circle`. */
  shape?: 'circle' | 'square';
  /** Presence indicator. */
  status?: AvatarStatus;
  /** Override the announced status text. Defaults to the status name. */
  statusLabel?: string;
  /** Mark decorative when the name is already visible next to the avatar. */
  decorative?: boolean;
}

/** Up to two initials from a name: "Ada Lovelace" → "AL", "binds" → "B". */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const first = words[0]![0] ?? '';
  const last = words.length > 1 ? (words[words.length - 1]![0] ?? '') : '';
  return (first + last).toUpperCase();
}

/** Deterministic tint index (1–5) from a name, so a person keeps the same colour everywhere. */
export function getAvatarTint(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return (Math.abs(hash) % 5) + 1;
}

/** A person or organisation represented by an image or initials. */
export const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  {
    name,
    src,
    size = 'md',
    shape = 'circle',
    status,
    statusLabel,
    decorative,
    className,
    ...props
  },
  ref,
) {
  const [failed, setFailed] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  React.useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [src]);
  const showImage = src && !failed;
  const statusText = status ? (statusLabel ?? status) : undefined;
  const label = statusText ? `${name} (${statusText})` : name;
  return (
    <span
      ref={ref}
      className={cx('st-avatar', className)}
      data-size={size}
      data-shape={shape}
      data-tint={getAvatarTint(name)}
      {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label })}
      {...props}
    >
      {(!showImage || !loaded) && (
        <span className="st-avatar__initials" aria-hidden="true">
          {getInitials(name)}
        </span>
      )}
      {showImage && (
        <img
          className="st-avatar__image"
          src={src}
          alt=""
          data-loaded={loaded ? '' : undefined}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
      {status && <span className="st-avatar__status" data-status={status} aria-hidden="true" />}
    </span>
  );
});

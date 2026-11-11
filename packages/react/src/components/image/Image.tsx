'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { Icon } from '../../icons/Icon.js';

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Required. Use `alt=""` for purely decorative images. */
  alt: string;
  /** Corner radius. Default `md`. */
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** object-fit when width and height are constrained. Default `cover`. */
  fit?: 'cover' | 'contain' | 'fill' | 'none';
  /** Width ÷ height; reserves space to avoid layout shift. */
  ratio?: number;
  /** Rendered if the image fails to load. Defaults to a neutral placeholder. */
  fallback?: React.ReactNode;
  /** Draw a subtle border (useful for screenshots on matching backgrounds). */
  bordered?: boolean;
}

/** An image with lazy loading, a reserved aspect ratio and a graceful failure state. */
export const Image = React.forwardRef<HTMLImageElement, ImageProps>(function Image(
  {
    alt,
    radius = 'md',
    fit = 'cover',
    ratio,
    fallback,
    bordered,
    className,
    style,
    onError,
    loading = 'lazy',
    decoding = 'async',
    src,
    ...props
  },
  ref,
) {
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => setFailed(false), [src]);
  const shared = {
    'data-radius': radius,
    'data-bordered': bordered ? '' : undefined,
    style: { ...(ratio && { aspectRatio: String(ratio) }), ...style },
  };
  if (failed || !src) {
    return (
      <span
        className={cx('st-image', 'st-image--fallback', className)}
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        {...shared}
      >
        {fallback ?? <Icon name="image" size="lg" />}
      </span>
    );
  }
  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      loading={loading}
      decoding={decoding}
      className={cx('st-image', className)}
      data-fit={fit}
      onError={(e) => {
        setFailed(true);
        onError?.(e);
      }}
      {...shared}
      {...props}
    />
  );
});

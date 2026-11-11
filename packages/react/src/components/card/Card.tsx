import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { Slot } from '../../internal/slot.js';

export type CardVariant = 'outline' | 'elevated' | 'filled';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Default `outline`. */
  variant?: CardVariant;
  /** Inner padding. Default `md`. */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /**
   * Make the whole card a click target. Put a `<CardLink>` (or any element with
   * `data-card-link`) inside the title; its hit area stretches across the card,
   * so the card stays one focusable link without nesting interactive content.
   */
  interactive?: boolean;
  /** Render as the child element (e.g. `<article>` or `<section>`). */
  asChild?: boolean;
}

/** A contained surface that groups related content and actions. */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'outline', padding = 'md', interactive, asChild, className, ...props },
  ref,
) {
  const Comp = asChild ? Slot : 'div';
  return (
    <Comp
      ref={ref as React.Ref<HTMLDivElement & HTMLElement>}
      className={cx('st-card', className)}
      data-variant={variant}
      data-padding={padding}
      data-interactive={interactive ? '' : undefined}
      {...props}
    />
  );
});

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { actions?: React.ReactNode }
>(function CardHeader({ actions, className, children, ...props }, ref) {
  return (
    <div ref={ref} className={cx('st-card__header', className)} {...props}>
      <div className="st-card__heading">{children}</div>
      {actions != null && <div className="st-card__header-actions">{actions}</div>}
    </div>
  );
});

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Heading level. Default 3. */
  level?: 2 | 3 | 4 | 5 | 6;
}

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(function CardTitle(
  { level = 3, className, ...props },
  ref,
) {
  const Tag = `h${level}` as 'h3';
  return <Tag ref={ref} className={cx('st-card__title', className)} {...props} />;
});

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(function CardDescription({ className, ...props }, ref) {
  return <p ref={ref} className={cx('st-card__description', className)} {...props} />;
});

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardContent({ className, ...props }, ref) {
    return <div ref={ref} className={cx('st-card__content', className)} {...props} />;
  },
);

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { align?: 'start' | 'end' | 'between' }
>(function CardFooter({ align = 'end', className, ...props }, ref) {
  return (
    <div ref={ref} className={cx('st-card__footer', className)} data-align={align} {...props} />
  );
});

export interface CardMediaProps extends React.HTMLAttributes<HTMLDivElement> {
  /** CSS aspect ratio, e.g. `16 / 9`. Default `16 / 9`. */
  ratio?: number | string;
}

/** Full-bleed media area at the top of a card. */
export const CardMedia = React.forwardRef<HTMLDivElement, CardMediaProps>(function CardMedia(
  { ratio = '16 / 9', className, style, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx('st-card__media', className)}
      style={{ aspectRatio: String(ratio), ...style }}
      {...props}
    />
  );
});

/** The primary link of an interactive card; its hit area covers the whole card. */
export const CardLink = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement> & { asChild?: boolean }
>(function CardLink({ asChild, className, ...props }, ref) {
  const Comp = asChild ? Slot : 'a';
  return (
    <Comp
      ref={ref as React.Ref<HTMLAnchorElement & HTMLElement>}
      className={cx('st-card__link', className)}
      data-card-link=""
      {...props}
    />
  );
});

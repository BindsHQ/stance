'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  type DialogContentProps,
  type DialogProps,
} from '../dialog/Dialog.js';

export type DrawerProps = DialogProps;
export type DrawerSide = 'left' | 'right' | 'top' | 'bottom';

/** A modal panel that slides in from an edge — for detail views, filters and secondary tasks. */
export function Drawer(props: DrawerProps) {
  return <Dialog {...props} />;
}

export const DrawerTrigger = DialogTrigger;
export const DrawerHeader = DialogHeader;
export const DrawerTitle = DialogTitle;
export const DrawerDescription = DialogDescription;
export const DrawerBody = DialogBody;
export const DrawerFooter = DialogFooter;
export const DrawerClose = DialogClose;

export interface DrawerContentProps extends Omit<
  DialogContentProps,
  'placement' | 'size' | 'role'
> {
  /** Edge the drawer slides from. Default `right`. */
  side?: DrawerSide;
  /** Width (left/right) or height (top/bottom): sm 320, md 416, lg 640. Default `md`. */
  size?: 'sm' | 'md' | 'lg';
}

/** The drawer surface. Same focus, Escape and scroll-lock behaviour as Dialog. */
export const DrawerContent = React.forwardRef<HTMLDivElement, DrawerContentProps>(
  function DrawerContent({ side = 'right', size = 'md', className, ...props }, ref) {
    return (
      <DialogContent
        ref={ref}
        placement={side}
        size={size}
        className={cx('st-drawer', className)}
        {...props}
      />
    );
  },
);

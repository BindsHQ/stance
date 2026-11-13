'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { defaultRiskLabels, type RiskLabels, type RiskLevel } from '../../internal/step-status.js';
import { Badge } from '../badge/Badge.js';
import { Button } from '../button/Button.js';
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '../sheet/Sheet.js';
import { Switch } from '../switch/Switch.js';

/** One thing an agent or connector may access. */
export interface PermissionSheetPermission {
  id: string;
  /** What is accessed, for example "Read your calendar". */
  title: string;
  /** The scope in plain words, for example "Events from the last 30 days". */
  description?: string;
  /** Whether access is granted. */
  granted: boolean;
  /** The agent cannot work without it. The switch is on, disabled and explained. */
  required?: boolean;
  /** How much is at stake. Medium and high show a risk label. */
  risk?: RiskLevel;
}

export interface PermissionSheetLabels {
  /** The save button. Default "Save". */
  save: string;
  /** The cancel button. Default "Cancel". */
  cancel: string;
  /** Accessible name of the close button. Default "Close". */
  close: string;
  /** Explains a required permission. Default "Required. This cannot be turned off." */
  required: string;
  /** The words for each risk level. */
  risk: RiskLabels;
}

/** Translations for PermissionSheet. Risk words can be overridden one by one. */
export type PermissionSheetLabelOverrides = Partial<Omit<PermissionSheetLabels, 'risk'>> & {
  risk?: Partial<RiskLabels>;
};

export interface PermissionSheetProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'title' | 'role'
> {
  /** Controlled open state. */
  open?: boolean;
  /** Open on first render when uncontrolled. Default false. */
  defaultOpen?: boolean;
  /** Called when the sheet opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** Who is asking, for example "Calendar connector permissions". */
  title: React.ReactNode;
  /** One or two sentences on what the permissions are for. */
  description?: React.ReactNode;
  /** The permissions, each with a switch. */
  permissions: PermissionSheetPermission[];
  /** Called with the next permissions when a switch changes. */
  onPermissionsChange?: (permissions: PermissionSheetPermission[]) => void;
  /** Called with the permissions when Save is pressed. The sheet then closes. Shows the footer. */
  onSave?: (permissions: PermissionSheetPermission[]) => void;
  /** Sheet height. Default `auto`. */
  height?: 'auto' | 'half' | 'full';
  /** Extra content under the list, such as a link to a privacy policy. */
  children?: React.ReactNode;
  /** Translations for the built in strings. */
  labels?: PermissionSheetLabelOverrides;
}

/**
 * A sheet listing what an agent or connector may access, with a switch for each
 * permission. Required permissions stay on and say why.
 */
export const PermissionSheet = React.forwardRef<HTMLDivElement, PermissionSheetProps>(
  function PermissionSheet(
    {
      open,
      defaultOpen,
      onOpenChange,
      title,
      description,
      permissions,
      onPermissionsChange,
      onSave,
      height = 'auto',
      children,
      labels: labelsProp,
      className,
      ...props
    },
    ref,
  ) {
    const labels: PermissionSheetLabels = {
      save: 'Save',
      cancel: 'Cancel',
      close: 'Close',
      required: 'Required. This cannot be turned off.',
      ...labelsProp,
      risk: { ...defaultRiskLabels, ...labelsProp?.risk },
    };
    const titleId = React.useId();
    const toggle = (id: string, granted: boolean) =>
      onPermissionsChange?.(permissions.map((p) => (p.id === id ? { ...p, granted } : p)));

    return (
      <Sheet
        {...(open !== undefined && { open })}
        {...(defaultOpen !== undefined && { defaultOpen })}
        {...(onOpenChange && { onOpenChange })}
      >
        <SheetContent
          ref={ref}
          height={height}
          closeLabel={labels.close}
          className={cx('st-permission-sheet', className)}
          {...props}
        >
          <SheetHeader>
            <SheetTitle>
              <span id={titleId}>{title}</span>
            </SheetTitle>
            {description != null && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
          <SheetBody>
            <div className="st-permission-sheet__list" role="group" aria-labelledby={titleId}>
              {permissions.map((permission) => {
                const required = !!permission.required;
                const risky = permission.risk === 'medium' || permission.risk === 'high';
                return (
                  <div
                    key={permission.id}
                    className="st-permission-sheet__item"
                    data-risk={permission.risk}
                    data-required={required ? '' : undefined}
                  >
                    <Switch
                      className="st-permission-sheet__switch"
                      labelPosition="start"
                      checked={required || permission.granted}
                      disabled={required}
                      onCheckedChange={(granted) => toggle(permission.id, granted)}
                      label={
                        <span className="st-permission-sheet__title">
                          {permission.title}
                          {risky && ' '}
                          {risky && (
                            <Badge
                              size="sm"
                              tone={permission.risk === 'high' ? 'danger' : 'warning'}
                            >
                              {labels.risk[permission.risk!]}
                            </Badge>
                          )}
                        </span>
                      }
                      description={
                        permission.description || required ? (
                          <>
                            {permission.description}
                            {required && permission.description ? ' ' : null}
                            {required && (
                              <span className="st-permission-sheet__required">
                                {labels.required}
                              </span>
                            )}
                          </>
                        ) : undefined
                      }
                    />
                  </div>
                );
              })}
            </div>
            {children}
          </SheetBody>
          {onSave && (
            <SheetFooter>
              <SheetClose asChild>
                <Button variant="outline">{labels.cancel}</Button>
              </SheetClose>
              <SheetClose asChild>
                <Button onClick={() => onSave(permissions)}>{labels.save}</Button>
              </SheetClose>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    );
  },
);

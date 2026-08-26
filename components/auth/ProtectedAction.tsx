"use client";

import {
  cloneElement,
  isValidElement,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { canPerformAction, type PermissionAction } from "@/lib/permissions";
import { useGuestGuard } from "@/contexts/GuestGuard";

interface ProtectedActionProps {
  action: PermissionAction;
  children: ReactNode;
  message?: string;
  /** Send the visitor to this specific destination after auth instead of
   * back to the current page — see GuestGuardValue.requestAuth. */
  nextPathOverride?: string;
}

export default function ProtectedAction({ action, children, message, nextPathOverride }: ProtectedActionProps) {
  const { user, requestAuth } = useGuestGuard();
  const allowed = canPerformAction(action, user).allowed;

  const intercept = (event: MouseEvent<HTMLElement>) => {
    if (allowed) return false;
    event.preventDefault();
    event.stopPropagation();
    requestAuth(action, message, nextPathOverride);
    return true;
  };

  if (isValidElement(children)) {
    const child = children as ReactElement<{ onClick?: (event: MouseEvent<HTMLElement>) => void }>;
    return cloneElement(child, {
      onClick: (event: MouseEvent<HTMLElement>) => {
        if (intercept(event)) return;
        child.props.onClick?.(event);
      },
    });
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={intercept}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          requestAuth(action, message, nextPathOverride);
        }
      }}
    >
      {children}
    </span>
  );
}

import React from "react";

import { cn } from "../variants";

export type SlotProps = React.HTMLAttributes<HTMLElement> & { children: React.ReactNode };

type AnyProps = Record<string, unknown>;

/** Compose two event handlers so both fire in order. */
function composeHandlers<E>(
  slotHandler: ((event: E) => void) | undefined,
  childHandler: ((event: E) => void) | undefined,
): ((event: E) => void) | undefined {
  if (!slotHandler) return childHandler;
  if (!childHandler) return slotHandler;
  return (event: E) => {
    slotHandler(event);
    childHandler(event);
  };
}

/** Known React event handler prop names. */
const EVENT_HANDLER_RE = /^on[A-Z]/;

/**
 * Slot merges its props (className, style, event handlers, etc.)
 * into its single React child element.
 * Used with the `asChild` pattern to allow render delegation.
 *
 * Event handlers are composed — both Slot and child handlers fire.
 */
export const Slot = React.forwardRef<unknown, SlotProps>(function Slot(
  { children, ...slotProps },
  forwardedRef,
) {
  const child = React.Children.only(children);
  if (!React.isValidElement(child)) return null;

  const childProps = child.props as AnyProps;
  const mergedProps: AnyProps = { ...slotProps };

  // Compose event handlers instead of overwriting
  for (const key of Object.keys(childProps)) {
    if (
      EVENT_HANDLER_RE.test(key) &&
      typeof slotProps[key as keyof typeof slotProps] === "function"
    ) {
      mergedProps[key] = composeHandlers(
        slotProps[key as keyof typeof slotProps] as (event: unknown) => void,
        childProps[key] as (event: unknown) => void,
      );
    } else {
      mergedProps[key] = childProps[key];
    }
  }

  mergedProps.ref = forwardedRef;
  mergedProps.className = cn(slotProps.className, childProps.className as string | undefined);
  mergedProps.style = {
    ...slotProps.style,
    ...(childProps.style as React.CSSProperties | undefined),
  };

  return React.cloneElement(child as React.ReactElement<AnyProps>, mergedProps);
});

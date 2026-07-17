import { ComponentType, createElement, ReactElement, ReactNode } from "react";
import { SlotPropsOf } from "../types";

/**
 * Resolve `slotProps` for a slot — supports static objects and ownerState callbacks.
 */
export function resolveSlotProps<P extends object>(
  slotProps: SlotPropsOf<P> | undefined,
  ownerState: P
): Partial<P> {
  if (!slotProps) {
    return {};
  }
  if (typeof slotProps === "function") {
    return slotProps(ownerState) ?? {};
  }
  return slotProps;
}

type RenderSlotOptions<P extends object> = {
  /** Custom slot component from `slots` */
  slot?: ComponentType<P> | undefined;
  /** Props from `slotProps` */
  slotProps?: SlotPropsOf<P> | undefined;
  /** Owner state merged into the slot (and used for callback slotProps) */
  ownerState: P;
  /** Default element when no custom slot is provided */
  defaultElement: ReactElement | null;
};

/**
 * Render a slot: custom component + merged slotProps, or the default element.
 */
export function renderSlot<P extends object>({
  slot,
  slotProps,
  ownerState,
  defaultElement,
}: RenderSlotOptions<P>): ReactNode {
  if (!slot) {
    return defaultElement;
  }
  const resolved = resolveSlotProps(slotProps, ownerState);
  return createElement(slot, { ...ownerState, ...resolved });
}

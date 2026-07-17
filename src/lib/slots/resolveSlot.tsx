import { ComponentType, createElement, ReactElement, ReactNode } from "react";
import {
  EventRendererProps,
  FieldProps,
  ProcessedEvent,
  SchedulerSlots,
  SchedulerSlotProps,
  SlotPropsOf,
} from "../types";

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

type LegacySlotSources = {
  eventRenderer?: (props: EventRendererProps) => ReactNode | null;
  customViewer?: (event: ProcessedEvent, close: () => void) => ReactNode;
  viewerTitleComponent?: (event: ProcessedEvent) => ReactNode;
  viewerSubtitleComponent?: (event: ProcessedEvent) => ReactNode;
  viewerExtraComponent?: ReactNode | ((fields: FieldProps[], event: ProcessedEvent) => ReactNode);
  loadingComponent?: ReactNode;
};

/**
 * Merge explicit `slots`/`slotProps` with legacy renderer props.
 * Explicit slots always win over legacy bridges.
 */
export function mergeLegacySlots(
  slots: SchedulerSlots | undefined,
  slotProps: SchedulerSlotProps | undefined,
  legacy: LegacySlotSources
): { slots: SchedulerSlots; slotProps: SchedulerSlotProps } {
  const nextSlots: SchedulerSlots = { ...slots };
  const nextSlotProps: SchedulerSlotProps = { ...slotProps };

  // eventRenderer is intentionally not bridged into slots.event: a `null` return
  // must fall back to the default event UI (handled in EventItem / AgendaEventsList).

  if (!nextSlots.eventViewer && typeof legacy.customViewer === "function") {
    const viewer = legacy.customViewer;
    nextSlots.eventViewer = function LegacyEventViewerSlot({ event, close }) {
      return <>{viewer(event, close)}</>;
    };
  }

  if (!nextSlots.eventViewerTitle && typeof legacy.viewerTitleComponent === "function") {
    const title = legacy.viewerTitleComponent;
    nextSlots.eventViewerTitle = function LegacyEventViewerTitleSlot({ event }) {
      return <>{title(event)}</>;
    };
  }

  if (!nextSlots.eventViewerSubtitle && typeof legacy.viewerSubtitleComponent === "function") {
    const subtitle = legacy.viewerSubtitleComponent;
    nextSlots.eventViewerSubtitle = function LegacyEventViewerSubtitleSlot({ event }) {
      return <>{subtitle(event)}</>;
    };
  }

  if (!nextSlots.eventViewerExtra && legacy.viewerExtraComponent != null) {
    const extra = legacy.viewerExtraComponent;
    nextSlots.eventViewerExtra = function LegacyEventViewerExtraSlot({ event, fields }) {
      return <>{typeof extra === "function" ? extra(fields, event) : extra}</>;
    };
  }

  if (!nextSlots.loadingOverlay && legacy.loadingComponent != null) {
    const loading = legacy.loadingComponent;
    nextSlots.loadingOverlay = function LegacyLoadingOverlaySlot() {
      return <>{loading}</>;
    };
  }

  return { slots: nextSlots, slotProps: nextSlotProps };
}

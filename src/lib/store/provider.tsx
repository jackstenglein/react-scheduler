import { useEffect, useRef } from "react";
import { mergeLegacySlots } from "../slots/resolveSlot";
import { SchedulerProps } from "../types";
import { StoreContext } from "./context";
import { createSchedulerStore } from "./createSchedulerStore";
import { StoreApi } from "./createStore";
import { Store } from "./types";

type Props = {
  children: React.ReactNode;
  initial: Partial<SchedulerProps>;
};

/** Parent props that re-sync into the store when their references/values change. */
const CONTROLLED_KEYS = [
  "events",
  "onEventDrop",
  "customEditor",
  "loading",
  "loadingComponent",
  "resources",
  "resourceFields",
  "resourceViewMode",
  "locale",
  "translations",
  "height",
  "hourFormat",
  "timeZone",
  "direction",
  "editable",
  "deletable",
  "draggable",
  "onConfirm",
  "onDelete",
  "onEventClick",
  "onEventEdit",
  "onCellClick",
  "onSelectedDateChange",
  "onViewChange",
  "onClickMore",
  "onResourceChange",
  "getRemoteEvents",
  "eventRenderer",
  "fields",
  "month",
  "week",
  "day",
  "agenda",
  "alwaysShowAgendaDays",
  "stickyNavigation",
  "navigation",
  "disableViewNavigator",
  "dialogMaxWidth",
  "viewerExtraComponent",
  "viewerTitleComponent",
  "viewerSubtitleComponent",
  "customViewer",
  "disableViewer",
  "resourceHeaderComponent",
  "navigationPickerProps",
  "slots",
  "slotProps",
] as const satisfies readonly (keyof SchedulerProps)[];

const LEGACY_SLOT_KEYS = [
  "slots",
  "slotProps",
  "eventRenderer",
  "customViewer",
  "viewerTitleComponent",
  "viewerSubtitleComponent",
  "viewerExtraComponent",
  "loadingComponent",
] as const;

function applySlotsFromProps(store: StoreApi, props: Partial<SchedulerProps>) {
  const { slots, slotProps } = mergeLegacySlots(props.slots, props.slotProps, {
    eventRenderer: props.eventRenderer,
    customViewer: props.customViewer,
    viewerTitleComponent: props.viewerTitleComponent,
    viewerSubtitleComponent: props.viewerSubtitleComponent,
    viewerExtraComponent: props.viewerExtraComponent,
    loadingComponent: props.loadingComponent,
  });
  store.setState({
    slots,
    slotProps,
    // Keep legacy props on the store for ref.scheduler and eventRenderer null-fallback.
    ...(Object.prototype.hasOwnProperty.call(props, "eventRenderer")
      ? { eventRenderer: props.eventRenderer }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(props, "customViewer")
      ? { customViewer: props.customViewer }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(props, "viewerTitleComponent")
      ? { viewerTitleComponent: props.viewerTitleComponent }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(props, "viewerSubtitleComponent")
      ? { viewerSubtitleComponent: props.viewerSubtitleComponent }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(props, "viewerExtraComponent")
      ? { viewerExtraComponent: props.viewerExtraComponent }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(props, "loadingComponent")
      ? { loadingComponent: props.loadingComponent }
      : {}),
  });
}

export const StoreProvider = ({ children, initial }: Props) => {
  const initialRef = useRef(initial);
  initialRef.current = initial;

  const storeRef = useRef<StoreApi | null>(null);
  if (!storeRef.current) {
    storeRef.current = createSchedulerStore(initial, () => initialRef.current.loading);
    applySlotsFromProps(storeRef.current, initial);
  }
  const store = storeRef.current;

  useEffect(() => {
    const prev = store.getState();
    const patch: Partial<Store> = {};
    let slotsDirty = false;

    for (const key of CONTROLLED_KEYS) {
      if (!Object.prototype.hasOwnProperty.call(initial, key)) {
        continue;
      }
      if ((LEGACY_SLOT_KEYS as readonly string[]).includes(key)) {
        slotsDirty = true;
        continue;
      }
      const value = key === "events" ? initial.events || [] : initial[key as keyof SchedulerProps];
      if (!Object.is(value, prev[key as keyof Store])) {
        Object.assign(patch, { [key]: value });
      }
    }

    if (Object.keys(patch).length > 0) {
      store.setState(patch);
    }
    if (slotsDirty) {
      applySlotsFromProps(store, initial);
    }
  });

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
};

import { useEffect, useRef } from "react";
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
  "loading",
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
  "fields",
  "month",
  "week",
  "day",
  "agenda",
  "alwaysShowAgendaDays",
  "navigation",
  "disableViewNavigator",
  "dialogMaxWidth",
  "disableViewer",
  "navigationPickerProps",
  "slots",
  "slotProps",
] as const satisfies readonly (keyof SchedulerProps)[];

export const StoreProvider = ({ children, initial }: Props) => {
  const initialRef = useRef(initial);
  initialRef.current = initial;

  const storeRef = useRef<StoreApi | null>(null);
  if (!storeRef.current) {
    storeRef.current = createSchedulerStore(initial, () => initialRef.current.loading);
  }
  const store = storeRef.current;

  useEffect(() => {
    const prev = store.getState();
    const patch: Partial<Store> = {};

    for (const key of CONTROLLED_KEYS) {
      if (!Object.prototype.hasOwnProperty.call(initial, key)) {
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
  });

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
};

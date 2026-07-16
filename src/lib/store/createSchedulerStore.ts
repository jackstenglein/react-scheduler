import { DragEvent } from "react";
import { EventActions, ProcessedEvent, SchedulerProps } from "../types";
import { defaultProps, initialStore } from "./default";
import { Store } from "./types";
import { arraytizeFieldVal, getAvailableViews } from "../helpers/generals";
import { addMinutes, differenceInMinutes, isEqual } from "date-fns";
import { View } from "../components/nav/Navigation";
import { createStoreApi, StoreApi } from "./createStore";

export function createSchedulerStore(
  initial: Partial<SchedulerProps>,
  getLoadingProp: () => boolean | undefined = () => initial.loading
): StoreApi {
  const api = createStoreApi({
    ...initialStore,
    ...defaultProps(initial),
  } as Store);

  const get = api.getState;
  const set = api.setState;

  const handleState: Store["handleState"] = (value, name) => {
    set({ [name]: value } as Partial<Store>);
  };

  const getViews: Store["getViews"] = () => getAvailableViews(get());

  const toggleAgenda: Store["toggleAgenda"] = () => {
    const prev = get();
    const newStatus = !prev.agenda;
    if (typeof prev.onViewChange === "function") {
      prev.onViewChange(prev.view, newStatus);
    }
    set({ agenda: newStatus });
  };

  const triggerDialog: Store["triggerDialog"] = (status, selected) => {
    const isEvent = selected as ProcessedEvent;
    const { resourceFields } = get();

    set({
      dialog: status,
      selectedRange: isEvent?.event_id
        ? undefined
        : isEvent || {
            start: new Date(),
            end: new Date(Date.now() + 60 * 60 * 1000),
          },
      selectedEvent: isEvent?.event_id ? isEvent : undefined,
      selectedResource: isEvent?.[resourceFields?.idField],
    });
  };

  const triggerLoading: Store["triggerLoading"] = (status) => {
    if (typeof getLoadingProp() === "undefined") {
      set({ loading: status });
    }
  };

  const handleGotoDay: Store["handleGotoDay"] = (day) => {
    const state = get();
    const currentViews = getAvailableViews(state);
    let view: View | undefined;

    if (currentViews.includes("day")) {
      view = "day";
      set({ view: "day", selectedDate: day });
    } else if (currentViews.includes("week")) {
      view = "week";
      set({ view: "week", selectedDate: day });
    } else {
      console.warn("No Day/Week views available");
    }

    if (view && typeof state.onViewChange === "function") {
      state.onViewChange(view, state.agenda);
    }
    if (view && typeof state.onSelectedDateChange === "function") {
      state.onSelectedDateChange(day);
    }
  };

  const confirmEvent: Store["confirmEvent"] = (event, action: EventActions) => {
    const { events } = get();
    let updatedEvents: ProcessedEvent[];

    if (action === "edit") {
      if (Array.isArray(event)) {
        updatedEvents = events.map((e) => {
          const exist = event.find((ex) => ex.event_id === e.event_id);
          return exist ? { ...e, ...exist } : e;
        });
      } else {
        updatedEvents = events.map((e) => (e.event_id === event.event_id ? { ...e, ...event } : e));
      }
    } else {
      updatedEvents = events.concat(event);
    }

    set({ events: updatedEvents });
  };

  const setCurrentDragged: Store["setCurrentDragged"] = (event) => {
    set({ currentDragged: event });
  };

  const onDrop: Store["onDrop"] = async (
    event: DragEvent<HTMLButtonElement>,
    eventId: string,
    startTime: Date,
    resKey?: string,
    resVal?: string | number
  ) => {
    const state = get();
    const droppedEvent = state.events.find((e) => {
      if (typeof e.event_id === "number") {
        return e.event_id === +eventId;
      }
      return e.event_id === eventId;
    }) as ProcessedEvent;

    const resField = state.fields.find((f) => f.name === resKey);
    const isMultiple = !!resField?.config?.multiple;
    let newResource = resVal as string | number | string[] | number[];

    if (resField) {
      const eResource = droppedEvent[resKey as string];
      const currentRes = arraytizeFieldVal(resField, eResource, droppedEvent).value;
      if (isMultiple) {
        if (currentRes.includes(resVal)) {
          if (isEqual(droppedEvent.start, startTime)) {
            return;
          }
          newResource = currentRes;
        } else {
          newResource = currentRes.length > 1 ? [...currentRes, resVal] : [resVal];
        }
      }
    }

    if (isEqual(droppedEvent.start, startTime)) {
      if (!newResource || (!isMultiple && newResource === droppedEvent[resKey as string])) {
        return;
      }
    }

    const diff = differenceInMinutes(droppedEvent.end, droppedEvent.start);
    const updatedEvent: ProcessedEvent = {
      ...droppedEvent,
      start: startTime,
      end: addMinutes(startTime, diff),
      recurring: undefined,
      [resKey as string]: newResource || "",
    };

    if (!state.onEventDrop || typeof state.onEventDrop !== "function") {
      return confirmEvent(updatedEvent, "edit");
    }

    try {
      triggerLoading(true);
      const remoteEvent = await state.onEventDrop(event, startTime, updatedEvent, droppedEvent);
      if (remoteEvent) {
        confirmEvent(remoteEvent, "edit");
      }
    } finally {
      triggerLoading(false);
    }
  };

  // Attach stable action identities once; preserved across setState spreads.
  set({
    handleState,
    getViews,
    toggleAgenda,
    triggerDialog,
    triggerLoading,
    handleGotoDay,
    confirmEvent,
    setCurrentDragged,
    onDrop,
  });

  return api;
}

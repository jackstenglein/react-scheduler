import { useEffect, useState } from "react";
import { addWeeks, endOfMonth, startOfMonth, subWeeks } from "date-fns";
import { PositionManagerState, PositionContext } from "./context";
import useStore, { shallowEqual } from "../hooks/useStore";
import { computeRenderedSlots } from "../layout/eventLayout";

type Props = {
  children: React.ReactNode;
};

const monthVisibleRange = (selectedDate: Date) => ({
  start: subWeeks(startOfMonth(selectedDate), 1),
  end: addWeeks(endOfMonth(selectedDate), 1),
});

export const PositionProvider = ({ children }: Props) => {
  const { events, resources, resourceFields, fields, view, selectedDate } = useStore(
    (s) => ({
      events: s.events,
      resources: s.resources,
      resourceFields: s.resourceFields,
      fields: s.fields,
      view: s.view,
      selectedDate: s.selectedDate,
    }),
    shallowEqual
  );
  const [state, set] = useState<PositionManagerState>(() => ({
    renderedSlots: computeRenderedSlots(
      events,
      resources,
      resourceFields,
      fields,
      view,
      view === "month" ? monthVisibleRange(selectedDate) : undefined
    ),
  }));

  useEffect(() => {
    set({
      renderedSlots: computeRenderedSlots(
        events,
        resources,
        resourceFields,
        fields,
        view,
        view === "month" ? monthVisibleRange(selectedDate) : undefined
      ),
    });
  }, [events, fields, resourceFields, resources, view, selectedDate]);

  return <PositionContext.Provider value={state}>{children}</PositionContext.Provider>;
};

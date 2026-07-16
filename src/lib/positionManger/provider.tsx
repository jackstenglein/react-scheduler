import { useEffect, useState } from "react";
import { PositionManagerState, PositionContext } from "./context";
import useStore, { shallowEqual } from "../hooks/useStore";
import { computeRenderedSlots } from "../layout/eventLayout";

type Props = {
  children: React.ReactNode;
};

export const PositionProvider = ({ children }: Props) => {
  const { events, resources, resourceFields, fields, view } = useStore(
    (s) => ({
      events: s.events,
      resources: s.resources,
      resourceFields: s.resourceFields,
      fields: s.fields,
      view: s.view,
    }),
    shallowEqual
  );
  const [state, set] = useState<PositionManagerState>({
    renderedSlots: computeRenderedSlots(events, resources, resourceFields, fields, view),
  });

  useEffect(() => {
    set((prev) => ({
      ...prev,
      renderedSlots: computeRenderedSlots(events, resources, resourceFields, fields, view),
    }));
  }, [events, fields, resourceFields, resources, view]);

  const setRenderedSlot = (day: string, eventId: string, position: number, resourceId?: string) => {
    set((prev) => ({
      ...prev,
      renderedSlots: {
        ...prev.renderedSlots,
        [resourceId || "all"]: {
          ...prev.renderedSlots?.[resourceId || "all"],
          [day]: prev.renderedSlots?.[resourceId || "all"]?.[day]
            ? {
                ...prev.renderedSlots?.[resourceId || "all"]?.[day],
                [eventId]: position,
              }
            : { [eventId]: position },
        },
      },
    }));
  };

  return (
    <PositionContext.Provider
      value={{
        ...state,
        setRenderedSlot,
      }}
    >
      {children}
    </PositionContext.Provider>
  );
};

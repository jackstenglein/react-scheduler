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
    set({
      renderedSlots: computeRenderedSlots(events, resources, resourceFields, fields, view),
    });
  }, [events, fields, resourceFields, resources, view]);

  return <PositionContext.Provider value={state}>{children}</PositionContext.Provider>;
};

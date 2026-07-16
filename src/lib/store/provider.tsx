import { useEffect, useRef } from "react";
import { SchedulerProps } from "../types";
import { StoreContext } from "./context";
import { createSchedulerStore } from "./createSchedulerStore";
import { StoreApi } from "./createStore";

type Props = {
  children: React.ReactNode;
  initial: Partial<SchedulerProps>;
};

export const StoreProvider = ({ children, initial }: Props) => {
  const initialRef = useRef(initial);
  initialRef.current = initial;

  const storeRef = useRef<StoreApi | null>(null);
  if (!storeRef.current) {
    storeRef.current = createSchedulerStore(initial, () => initialRef.current.loading);
  }
  const store = storeRef.current;

  useEffect(() => {
    store.setState({
      onEventDrop: initial.onEventDrop,
      customEditor: initial.customEditor,
      events: initial.events || [],
    });
  }, [initial.onEventDrop, initial.customEditor, initial.events, store]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
};

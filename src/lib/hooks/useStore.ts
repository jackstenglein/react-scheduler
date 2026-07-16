import { useCallback, useContext, useRef, useSyncExternalStore } from "react";
import { StoreContext } from "../store/context";
import { shallowEqual, StoreApi } from "../store/createStore";
import { Store } from "../store/types";

function useStoreApi(): StoreApi {
  const api = useContext(StoreContext);
  if (!api) {
    throw new Error("useStore must be used within StoreProvider");
  }
  return api;
}

function useStore(): Store;
function useStore<T>(selector: (state: Store) => T, equalityFn?: (a: T, b: T) => boolean): T;
function useStore<T>(
  selector?: (state: Store) => T,
  equalityFn: (a: T, b: T) => boolean = Object.is
): Store | T {
  const api = useStoreApi();
  const selectorRef = useRef(selector);
  selectorRef.current = selector;
  const equalityRef = useRef(equalityFn);
  equalityRef.current = equalityFn;

  const getSelection = useCallback(() => {
    const state = api.getState();
    return (selectorRef.current ? selectorRef.current(state) : state) as T;
  }, [api]);

  const cached = useRef<T>(getSelection());

  const getSnapshot = useCallback(() => {
    const next = getSelection();
    if (equalityRef.current(cached.current, next)) {
      return cached.current;
    }
    cached.current = next;
    return next;
  }, [getSelection]);

  return useSyncExternalStore(api.subscribe, getSnapshot, getSnapshot);
}

export { shallowEqual, useStoreApi };
export default useStore;

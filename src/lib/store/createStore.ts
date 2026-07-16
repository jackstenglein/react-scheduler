import { Store } from "./types";

export type StoreListener = () => void;

export type StoreApi = {
  getState: () => Store;
  setState: (partial: Partial<Store> | ((prev: Store) => Partial<Store>)) => void;
  subscribe: (listener: StoreListener) => () => void;
};

export function createStoreApi(initialState: Store): StoreApi {
  let state = initialState;
  const listeners = new Set<StoreListener>();

  const getState = () => state;

  const setState: StoreApi["setState"] = (partial) => {
    const nextPartial = typeof partial === "function" ? partial(state) : partial;
    state = { ...state, ...nextPartial };
    listeners.forEach((listener) => listener());
  };

  const subscribe: StoreApi["subscribe"] = (listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  return { getState, setState, subscribe };
}

/** Shallow-compare plain objects/arrays for multi-field selectors. */
export function shallowEqual<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) {
    return true;
  }
  if (typeof a !== "object" || typeof b !== "object" || !a || !b) {
    return false;
  }

  const aKeys = Object.keys(a) as (keyof T)[];
  const bKeys = Object.keys(b) as (keyof T)[];
  if (aKeys.length !== bKeys.length) {
    return false;
  }

  return aKeys.every((key) => Object.is(a[key], b[key]));
}

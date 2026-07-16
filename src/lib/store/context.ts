import { createContext } from "react";
import { StoreApi } from "./createStore";

export const StoreContext = createContext<StoreApi | null>(null);

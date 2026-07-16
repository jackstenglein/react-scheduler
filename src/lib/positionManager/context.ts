import { createContext } from "react";

export type PositionManagerState = {
  renderedSlots: { [resourceId: string]: { [day: string]: { [eventId: string]: number } } };
};

export const PositionContext = createContext<PositionManagerState>({
  renderedSlots: {},
});

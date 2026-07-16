import { DragEvent } from "react";
import { alpha, useTheme } from "@mui/material";
import useStore, { shallowEqual, useStoreApi } from "./useStore";
import { revertTimeZonedDate } from "../helpers/generals";

interface Props {
  start: Date;
  end: Date;
  resourceKey: string;
  resourceVal: string | number;
}
export const useCellAttributes = ({ start, end, resourceKey, resourceVal }: Props) => {
  const storeApi = useStoreApi();
  const { triggerDialog, onCellClick, onDrop, setCurrentDragged, editable, timeZone } = useStore(
    (s) => ({
      triggerDialog: s.triggerDialog,
      onCellClick: s.onCellClick,
      onDrop: s.onDrop,
      setCurrentDragged: s.setCurrentDragged,
      editable: s.editable,
      timeZone: s.timeZone,
    }),
    shallowEqual
  );
  const theme = useTheme();

  return {
    tabIndex: editable ? 0 : -1,
    disableRipple: !editable,
    onClick: () => {
      if (editable) {
        triggerDialog(true, {
          start,
          end,
          [resourceKey]: resourceVal,
        });
      }

      if (onCellClick && typeof onCellClick === "function") {
        onCellClick(start, end, resourceKey, resourceVal);
      }
    },
    onDragOver: (e: DragEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (storeApi.getState().currentDragged) {
        e.currentTarget.style.backgroundColor = alpha(theme.palette.secondary.main, 0.3);
      }
    },
    onDragEnter: (e: DragEvent<HTMLButtonElement>) => {
      if (storeApi.getState().currentDragged) {
        e.currentTarget.style.backgroundColor = alpha(theme.palette.secondary.main, 0.3);
      }
    },
    onDragLeave: (e: DragEvent<HTMLButtonElement>) => {
      if (storeApi.getState().currentDragged) {
        e.currentTarget.style.backgroundColor = "";
      }
    },
    onDrop: (e: DragEvent<HTMLButtonElement>) => {
      const currentDragged = storeApi.getState().currentDragged;
      if (currentDragged && currentDragged.event_id) {
        e.preventDefault();
        e.currentTarget.style.backgroundColor = "";
        const zonedStart = revertTimeZonedDate(start, timeZone);
        onDrop(e, currentDragged.event_id.toString(), zonedStart, resourceKey, resourceVal);
        setCurrentDragged();
      }
    },
    [resourceKey]: resourceVal,
  };
};

import { DragEvent, useRef } from "react";
import { ProcessedEvent } from "../types";
import { useTheme } from "@mui/material";
import useStore from "./useStore";

const useDragAttributes = (event: ProcessedEvent) => {
  const { setCurrentDragged } = useStore();
  const theme = useTheme();
  const oldBackground = useRef<string>(null);

  return {
    draggable: true,
    onDragStart: (e: DragEvent<HTMLElement>) => {
      e.stopPropagation();
      setCurrentDragged(event);
      oldBackground.current = e.currentTarget.style.backgroundColor;
      e.currentTarget.style.backgroundColor = (theme.vars || theme).palette.error.main;
    },
    onDragEnd: (e: DragEvent<HTMLElement>) => {
      setCurrentDragged();
      e.currentTarget.style.backgroundColor = oldBackground.current || "";
      oldBackground.current = null;
    },
    onDragOver: (e: DragEvent<HTMLElement>) => {
      e.stopPropagation();
      e.preventDefault();
    },
    onDragEnter: (e: DragEvent<HTMLElement>) => {
      e.stopPropagation();
      e.preventDefault();
    },
  };
};

export default useDragAttributes;

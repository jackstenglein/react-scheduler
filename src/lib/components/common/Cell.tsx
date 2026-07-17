import { Button, alpha } from "@mui/material";
import useStore, { shallowEqual } from "../../hooks/useStore";
import { useCellAttributes } from "../../hooks/useCellAttributes";
import { renderSlot } from "../../slots/resolveSlot";
import { CellSlotProps } from "../../types";

interface CellProps {
  day: Date;
  start: Date;
  height: number;
  end: Date;
  resourceKey: string;
  resourceVal: string | number | null;
  children?: React.ReactNode;
}

const Cell = ({ day, start, end, resourceKey, resourceVal, height, children }: CellProps) => {
  const { slots, slotProps } = useStore(
    (s) => ({
      slots: s.slots,
      slotProps: s.slotProps,
    }),
    shallowEqual
  );
  const cellAttrs = useCellAttributes({ start, end, resourceKey, resourceVal: resourceVal ?? "" });

  const ownerState: CellSlotProps = {
    day,
    start,
    end,
    height,
    resourceKey,
    resourceVal,
    onClick: cellAttrs.onClick,
    onDragOver: cellAttrs.onDragOver,
    onDragEnter: cellAttrs.onDragEnter,
    onDragLeave: cellAttrs.onDragLeave,
    onDrop: cellAttrs.onDrop,
  };

  if (slots?.cell) {
    return (
      <>
        {renderSlot({
          slot: slots.cell,
          slotProps: slotProps?.cell,
          ownerState,
          defaultElement: null,
        })}
      </>
    );
  }

  return (
    <Button
      fullWidth
      aria-label={`${start.toLocaleString("en", {
        dateStyle: "full",
        timeStyle: "long",
      })} - ${end.toLocaleString("en", { dateStyle: "full", timeStyle: "long" })}`}
      sx={{
        width: "100%",
        height: "100%",
        borderRadius: 0,
        cursor: "pointer",
        "&:hover": {
          background: (theme) => alpha(theme.palette.primary.main, 0.1),
        },
      }}
      {...cellAttrs}
    >
      {children}
    </Button>
  );
};

export default Cell;

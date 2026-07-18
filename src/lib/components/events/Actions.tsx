import DeleteRounded from "@mui/icons-material/DeleteRounded";
import EditRounded from "@mui/icons-material/EditRounded";
import { Box, Button, Grow, IconButton, Slide } from "@mui/material";
import { useState } from "react";
import { ProcessedEvent } from "../../types";
import useStore, { shallowEqual } from "../../hooks/useStore";
import useEventPermissions from "../../hooks/useEventPermissions";
import { renderSlot } from "../../slots/resolveSlot";

interface Props {
  event: ProcessedEvent;
  onDelete(): void;
  onEdit(): void;
}

const EventActions = ({ event, onDelete, onEdit }: Props) => {
  const { translations, direction, slots, slotProps } = useStore(
    (s) => ({
      translations: s.translations,
      direction: s.direction,
      slots: s.slots,
      slotProps: s.slotProps,
    }),
    shallowEqual
  );
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handleDelete = () => {
    if (!deleteConfirm) {
      return setDeleteConfirm(true);
    }
    onDelete();
  };

  const { canEdit, canDelete } = useEventPermissions(event);

  return (
    <Box sx={{ display: "inherit" }}>
      <Grow in={!deleteConfirm} exit={false} timeout={400} unmountOnExit>
        <div>
          {canEdit && (
            <IconButton size="small" onClick={onEdit} color="inherit">
              <EditRounded />
            </IconButton>
          )}
          {canDelete && (
            <IconButton size="small" onClick={handleDelete} color="inherit">
              <DeleteRounded />
            </IconButton>
          )}
          {renderSlot({
            slot: slots?.eventViewerActionsExtra,
            slotProps: slotProps?.eventViewerActionsExtra,
            ownerState: { event },
            defaultElement: null,
          })}
        </div>
      </Grow>
      <Slide
        in={deleteConfirm}
        direction={direction === "rtl" ? "right" : "left"}
        unmountOnExit
        timeout={400}
        exit={false}
      >
        <div>
          <Button className="delete" size="small" onClick={handleDelete} color="error">
            {translations.form.delete.toUpperCase()}
          </Button>
          <Button
            className="cancel"
            size="small"
            onClick={() => setDeleteConfirm(false)}
            color="inherit"
          >
            {translations.form.cancel.toUpperCase()}
          </Button>
        </div>
      </Slide>
    </Box>
  );
};

export default EventActions;

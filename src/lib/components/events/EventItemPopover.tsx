import { MouseEvent, useState } from "react";
import { Box, IconButton, Popover, Typography, useTheme } from "@mui/material";
import useStore from "../../hooks/useStore";
import { ProcessedEvent, RecurringEditMode } from "../../types";
import { PopperInner } from "../../styles/styles";
import EventActions from "./Actions";
import {
  applyRecurringDelete,
  differenceInDaysOmitTime,
  getHourFormat,
} from "../../helpers/generals";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import SupervisorAccountRoundedIcon from "@mui/icons-material/SupervisorAccountRounded";
import { format } from "date-fns";
import RecurringEditDialog from "./RecurringEditDialog";

type Props = {
  event: ProcessedEvent;
  anchorEl: Element | null;
  onTriggerViewer: (el?: MouseEvent<Element>) => void;
};

const EventItemPopover = ({ anchorEl, event, onTriggerViewer }: Props) => {
  const {
    triggerDialog,
    onDelete,
    events,
    handleState,
    triggerLoading,
    customViewer,
    viewerExtraComponent,
    fields,
    resources,
    resourceFields,
    locale,
    viewerTitleComponent,
    viewerSubtitleComponent,
    hourFormat,
    translations,
    onEventEdit,
  } = useStore();
  const theme = useTheme();
  const hideDates = differenceInDaysOmitTime(event.start, event.end) <= 0 && event.allDay;
  const hFormat = getHourFormat(hourFormat);
  const idKey = resourceFields.idField;
  const hasResource = resources.filter((res) =>
    Array.isArray(event[idKey]) ? event[idKey].includes(res[idKey]) : res[idKey] === event[idKey]
  );

  // ── Recurring scope dialog state ──────────────────────────────────────────
  const [recurringDialog, setRecurringDialog] = useState<"edit" | "delete" | null>(null);

  const isRecurringInstance = !!event._recurringMeta;

  const handleDeleteRequest = () => {
    if (isRecurringInstance) {
      setRecurringDialog("delete");
    } else {
      executeDelete(event.event_id);
    }
  };

  const handleEditRequest = () => {
    if (isRecurringInstance) {
      setRecurringDialog("edit");
    } else {
      onTriggerViewer();
      triggerDialog(true, event);
      if (onEventEdit && typeof onEventEdit === "function") {
        onEventEdit(event);
      }
    }
  };

  const handleRecurringDialogConfirm = async (mode: RecurringEditMode) => {
    setRecurringDialog(null);

    if (recurringDialog === "delete") {
      const updatedEvents = applyRecurringDelete(events, event, mode);
      // For remote — call onDelete with the parent series id (or the event id
      // for standalone overrides), then apply locally regardless of the result.
      if (onDelete) {
        try {
          triggerLoading(true);
          const idToDelete = event._recurringMeta
            ? mode === "all"
              ? event._recurringMeta.seriesId
              : event.event_id
            : event.event_id;
          await onDelete(idToDelete);
        } catch (error) {
          console.error(error);
          return;
        } finally {
          triggerLoading(false);
        }
      }
      onTriggerViewer();
      handleState(updatedEvents, "events");
    } else {
      // "edit" — open the editor and pass the scope via the event so Editor can use it
      onTriggerViewer();
      triggerDialog(true, { ...event, _pendingRecurringMode: mode });
      if (onEventEdit && typeof onEventEdit === "function") {
        onEventEdit(event);
      }
    }
  };

  const executeDelete = async (deletedId: string | number) => {
    try {
      triggerLoading(true);
      let resolvedId = deletedId;
      if (onDelete) {
        const remoteId = await onDelete(deletedId);
        if (remoteId) {
          resolvedId = remoteId;
        } else {
          resolvedId = "";
        }
      }
      if (resolvedId) {
        onTriggerViewer();
        const updatedEvents = events.filter((e) => e.event_id !== resolvedId);
        handleState(updatedEvents, "events");
      }
    } catch (error) {
      console.error(error);
    } finally {
      triggerLoading(false);
    }
  };

  return (
    <>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => {
          onTriggerViewer();
        }}
        anchorOrigin={{
          vertical: "center",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {typeof customViewer === "function" ? (
          customViewer(event, () => onTriggerViewer())
        ) : (
          <PopperInner>
            <Box
              sx={{
                bgcolor: event.color || theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
              }}
            >
              <div className="rs__popper_actions">
                <div>
                  <IconButton
                    size="small"
                    onClick={() => {
                      onTriggerViewer();
                    }}
                  >
                    <ClearRoundedIcon color="disabled" />
                  </IconButton>
                </div>
                <EventActions
                  event={event}
                  onDelete={handleDeleteRequest}
                  onEdit={handleEditRequest}
                />
              </div>
              {viewerTitleComponent instanceof Function ? (
                viewerTitleComponent(event)
              ) : (
                <Typography style={{ padding: "5px 0" }} noWrap>
                  {event.title}
                </Typography>
              )}
            </Box>
            <div style={{ padding: "5px 10px" }}>
              <Typography
                style={{ display: "flex", alignItems: "center", gap: 8 }}
                color="textSecondary"
                variant="caption"
                noWrap
              >
                <EventNoteRoundedIcon />
                {hideDates
                  ? translations.event.allDay
                  : `${format(event.start, `dd MMMM yyyy ${hFormat}`, {
                      locale: locale,
                    })} - ${format(event.end, `dd MMMM yyyy ${hFormat}`, {
                      locale: locale,
                    })}`}
              </Typography>
              {viewerSubtitleComponent instanceof Function ? (
                viewerSubtitleComponent(event)
              ) : (
                <Typography variant="body2" style={{ padding: "5px 0" }}>
                  {event.subtitle}
                </Typography>
              )}
              {hasResource.length > 0 && (
                <Typography
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                  color="textSecondary"
                  variant="caption"
                  noWrap
                >
                  <SupervisorAccountRoundedIcon />
                  {hasResource.map((res) => res[resourceFields.textField]).join(", ")}
                </Typography>
              )}
              {viewerExtraComponent instanceof Function
                ? viewerExtraComponent(fields, event)
                : viewerExtraComponent}
            </div>
          </PopperInner>
        )}
      </Popover>

      {/* Recurring scope dialog — only mounted when needed */}
      {isRecurringInstance && recurringDialog !== null && (
        <RecurringEditDialog
          open={recurringDialog !== null}
          action={recurringDialog}
          onConfirm={handleRecurringDialogConfirm}
          onCancel={() => setRecurringDialog(null)}
        />
      )}
    </>
  );
};

export default EventItemPopover;

import { MouseEvent } from "react";
import { Box, IconButton, Popover, Typography, useTheme } from "@mui/material";
import useStore, { shallowEqual } from "../../hooks/useStore";
import { EventViewerSlotProps, ProcessedEvent } from "../../types";
import EventActions from "./Actions";
import { differenceInDaysOmitTime, getHourFormat } from "../../helpers/generals";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import SupervisorAccountRoundedIcon from "@mui/icons-material/SupervisorAccountRounded";
import { format } from "date-fns";
import { renderSlot } from "../../slots/resolveSlot";

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
    fields,
    resources,
    resourceFields,
    locale,
    hourFormat,
    translations,
    onEventEdit,
    slots,
    slotProps,
  } = useStore(
    (s) => ({
      triggerDialog: s.triggerDialog,
      onDelete: s.onDelete,
      events: s.events,
      handleState: s.handleState,
      triggerLoading: s.triggerLoading,
      fields: s.fields,
      resources: s.resources,
      resourceFields: s.resourceFields,
      locale: s.locale,
      hourFormat: s.hourFormat,
      translations: s.translations,
      onEventEdit: s.onEventEdit,
      slots: s.slots,
      slotProps: s.slotProps,
    }),
    shallowEqual
  );
  const theme = useTheme();
  const hideDates = differenceInDaysOmitTime(event.start, event.end) <= 0 && event.allDay;
  const hFormat = getHourFormat(hourFormat);
  const idKey = resourceFields.idField;
  const hasResource = resources.filter((res) =>
    Array.isArray(event[idKey]) ? event[idKey].includes(res[idKey]) : res[idKey] === event[idKey]
  );

  const handleDelete = async () => {
    try {
      triggerLoading(true);
      let deletedId = event.event_id;
      // Trigger custom/remote when provided
      if (onDelete) {
        const remoteId = await onDelete(deletedId);
        if (remoteId) {
          deletedId = remoteId;
        } else {
          deletedId = "";
        }
      }
      if (deletedId) {
        onTriggerViewer();
        const updatedEvents = events.filter((e) => e.event_id !== deletedId);
        handleState(updatedEvents, "events");
      }
    } catch (error) {
      console.error(error);
    } finally {
      triggerLoading(false);
    }
  };

  const close = () => onTriggerViewer();
  const viewerOwnerState: EventViewerSlotProps = { event, close };

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={close}
      anchorOrigin={{
        vertical: "center",
        horizontal: "left",
      }}
      transformOrigin={{
        vertical: "center",
        horizontal: "right",
      }}
      slotProps={{
        paper: {
          sx: { transform: `translateX(-4px) !important` },
        },
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {slots?.eventViewer ? (
        renderSlot({
          slot: slots.eventViewer,
          slotProps: slotProps?.eventViewer,
          ownerState: viewerOwnerState,
          defaultElement: null,
        })
      ) : (
        <Box sx={{ maxWidth: "100%", width: 400 }}>
          <Box
            sx={{
              padding: "5px 10px",
              bgcolor: event.color || (theme.vars || theme).palette.primary.main,
              color: theme.palette.getContrastText(
                event.color || (theme.vars || theme).palette.primary.main
              ),
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <IconButton size="small" onClick={close} color="inherit">
                <ClearRoundedIcon />
              </IconButton>
              <EventActions
                event={event}
                onDelete={handleDelete}
                onEdit={() => {
                  onTriggerViewer();
                  triggerDialog(true, event);

                  if (onEventEdit && typeof onEventEdit === "function") {
                    onEventEdit(event);
                  }
                }}
              />
            </Box>
            {renderSlot({
              slot: slots?.eventViewerTitle,
              slotProps: slotProps?.eventViewerTitle,
              ownerState: { event },
              defaultElement: (
                <Typography style={{ padding: "5px 0" }} noWrap>
                  {event.title}
                </Typography>
              ),
            })}
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
            {renderSlot({
              slot: slots?.eventViewerSubtitle,
              slotProps: slotProps?.eventViewerSubtitle,
              ownerState: { event },
              defaultElement: (
                <Typography variant="body2" style={{ padding: "5px 0" }}>
                  {event.subtitle}
                </Typography>
              ),
            })}
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
            {renderSlot({
              slot: slots?.eventViewerExtra,
              slotProps: slotProps?.eventViewerExtra,
              ownerState: { event, fields },
              defaultElement: null,
            })}
          </div>
        </Box>
      )}
    </Popover>
  );
};

export default EventItemPopover;

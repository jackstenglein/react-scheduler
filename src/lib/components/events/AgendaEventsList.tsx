import { Fragment, MouseEvent, useState } from "react";
import {
  useTheme,
  List,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
} from "@mui/material";
import { format } from "date-fns";
import { EventSlotProps, ProcessedEvent } from "../../types";
import { getHourFormat, isTimeZonedToday } from "../../helpers/generals";
import useStore, { shallowEqual } from "../../hooks/useStore";
import EventItemPopover from "./EventItemPopover";
import { renderSlot, resolveSlotProps } from "../../slots/resolveSlot";

interface AgendaEventsListProps {
  day: Date;
  events: ProcessedEvent[];
}

const AgendaEventsList = ({ day, events }: AgendaEventsListProps) => {
  const [anchorEl, setAnchorEl] = useState<Element | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ProcessedEvent>();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const {
    locale,
    hourFormat,
    eventRenderer,
    onEventClick,
    timeZone,
    disableViewer,
    slots,
    slotProps,
  } = useStore(
    (s) => ({
      locale: s.locale,
      hourFormat: s.hourFormat,
      eventRenderer: s.eventRenderer,
      onEventClick: s.onEventClick,
      timeZone: s.timeZone,
      disableViewer: s.disableViewer,
      slots: s.slots,
      slotProps: s.slotProps,
    }),
    shallowEqual
  );
  const theme = useTheme();
  const hFormat = getHourFormat(hourFormat);

  const triggerViewer = (el?: MouseEvent<Element>) => {
    if (!el?.currentTarget && deleteConfirm) {
      setDeleteConfirm(false);
    }
    setAnchorEl(el?.currentTarget || null);
  };

  return (
    <Fragment>
      <List>
        {events.map((event) => {
          const startIsToday = isTimeZonedToday({
            dateLeft: event.start,
            dateRight: day,
            timeZone,
          });
          const startFormat = startIsToday ? hFormat : `MMM d, ${hFormat}`;
          const startDate = format(event.start, startFormat, {
            locale,
          });
          const endIsToday = isTimeZonedToday({ dateLeft: event.end, dateRight: day, timeZone });

          const endFormat = endIsToday ? hFormat : `MMM d, ${hFormat}`;
          const endDate = format(event.end, endFormat, {
            locale,
          });

          const ownerState: EventSlotProps = {
            event,
            onClick: (e) => {
              setSelectedEvent(event);
              triggerViewer(e);
            },
          };

          if (slots?.event) {
            return (
              <Fragment key={`${event.start.getTime()}_${event.end.getTime()}_${event.event_id}`}>
                {renderSlot({
                  slot: slots.event,
                  slotProps: slotProps?.event,
                  ownerState,
                  defaultElement: null,
                })}
              </Fragment>
            );
          }

          if (typeof eventRenderer === "function") {
            const resolved = resolveSlotProps(slotProps?.event, ownerState);
            const custom = eventRenderer({ ...ownerState, ...resolved });
            if (custom !== null && custom !== undefined) {
              return (
                <Fragment key={`${event.start.getTime()}_${event.end.getTime()}_${event.event_id}`}>
                  {custom}
                </Fragment>
              );
            }
          }

          return (
            <ListItemButton
              key={`${event.start.getTime()}_${event.end.getTime()}_${event.event_id}`}
              focusRipple
              disableRipple={disableViewer}
              tabIndex={disableViewer ? -1 : 0}
              disabled={event.disabled}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!disableViewer) {
                  triggerViewer(e);
                }
                setSelectedEvent(event);
                if (typeof onEventClick === "function") {
                  onEventClick(event);
                }
              }}
            >
              <ListItemAvatar>
                <Avatar
                  sx={{
                    bgcolor: event.disabled
                      ? "#d0d0d0"
                      : event.color || (theme.vars || theme).palette.primary.main,
                    color: event.disabled
                      ? "#808080"
                      : event.textColor || (theme.vars || theme).palette.primary.contrastText,
                  }}
                >
                  {event.agendaAvatar || " "}
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={event.title} secondary={`${startDate} - ${endDate}`} />
            </ListItemButton>
          );
        })}
      </List>

      {/* Viewer */}
      {selectedEvent && (
        <EventItemPopover
          anchorEl={anchorEl}
          event={selectedEvent}
          onTriggerViewer={triggerViewer}
        />
      )}
    </Fragment>
  );
};

export default AgendaEventsList;

import { Fragment, memo, MouseEvent, useCallback, useState } from "react";
import { Typography, ButtonBase, useTheme, Box, alpha, SxProps } from "@mui/material";
import { format } from "date-fns";
import { EventSlotProps, ProcessedEvent } from "../../types";
import { EventItemPaper } from "../../styles/styles";
import { differenceInDaysOmitTime, getHourFormat } from "../../helpers/generals";
import useStore, { shallowEqual } from "../../hooks/useStore";
import useDragAttributes from "../../hooks/useDragAttributes";
import EventItemPopover from "./EventItemPopover";
import useEventPermissions from "../../hooks/useEventPermissions";
import { renderSlot } from "../../slots/resolveSlot";

interface EventItemProps {
  event: ProcessedEvent;
  multiday?: boolean;
  hasPrev?: boolean;
  hasNext?: boolean;
  hideDates?: boolean;
  variant?: "paper" | "text";
  sx?: SxProps;
}

const EventItem = (props: EventItemProps) => {
  const [anchorEl, setAnchorEl] = useState<Element | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const { slots, slotProps, hideDates } = useStore(
    (s) => ({
      slots: s.slots,
      slotProps: s.slotProps,
      hideDates: s.hideDates,
    }),
    shallowEqual
  );

  const triggerViewer = useCallback(
    (el?: MouseEvent<Element>) => {
      if (!el?.currentTarget && deleteConfirm) {
        setDeleteConfirm(false);
      }
      setAnchorEl(el?.currentTarget || null);
    },
    [deleteConfirm]
  );

  const dragProps = useDragAttributes(props.event);
  const { canDrag } = useEventPermissions(props.event);
  const onEventClick = useStore((s) => s.onEventClick);
  const disableViewer = useStore((s) => s.disableViewer);

  if (slots?.event) {
    const ownerState: EventSlotProps = {
      event: props.event,
      ...dragProps,
      draggable: !!canDrag,
      onClick: (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disableViewer) {
          triggerViewer(e);
        }
        if (typeof onEventClick === "function") {
          onEventClick(props.event);
        }
      },
    };

    return (
      <Fragment>
        {renderSlot({
          slot: slots.event,
          slotProps: slotProps?.event,
          ownerState,
          defaultElement: null,
        })}
        <EventItemPopover anchorEl={anchorEl} event={props.event} onTriggerViewer={triggerViewer} />
      </Fragment>
    );
  }

  return (
    <Fragment>
      {props.variant === "text" && !props.multiday ? (
        <EventText {...props} triggerViewer={triggerViewer} hideDates={hideDates} />
      ) : (
        <EventPaper
          {...props}
          triggerViewer={triggerViewer}
          selected={Boolean(anchorEl)}
          hideDates={hideDates}
        />
      )}

      {/* Viewer */}
      <EventItemPopover anchorEl={anchorEl} event={props.event} onTriggerViewer={triggerViewer} />
    </Fragment>
  );
};

export default memo(EventItem);

function EventText(props: EventItemProps & { triggerViewer: (el?: MouseEvent<Element>) => void }) {
  const { event, triggerViewer } = props;
  const theme = useTheme();
  const { onEventClick, disableViewer, locale, hourFormat } = useStore(
    (s) => ({
      onEventClick: s.onEventClick,
      disableViewer: s.disableViewer,
      locale: s.locale,
      hourFormat: s.hourFormat,
    }),
    shallowEqual
  );
  const hFormat = getHourFormat(hourFormat);
  const dragProps = useDragAttributes(props.event);
  const { canDrag } = useEventPermissions(props.event);

  return (
    <ButtonBase
      component="div"
      sx={{
        display: "flex",
        flexDirection: "row",
        gap: 0.5,
        flexWrap: "nowrap",
        px: 0.25,
        justifyContent: "flex-start",
        borderRadius: "4px",
        mx: 0.25,
        ":hover": {
          background: (theme) => alpha(theme.palette.primary.main, 0.1),
        },
      }}
      focusRipple
      tabIndex={disableViewer ? -1 : 0}
      disableRipple={disableViewer}
      disabled={event.disabled}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disableViewer) {
          triggerViewer(e);
        }
        if (typeof onEventClick === "function") {
          onEventClick(event);
        }
      }}
      {...dragProps}
      draggable={canDrag}
    >
      <Box
        component="span"
        sx={{
          minWidth: "0.5rem",
          minHeight: "0.5rem",
          borderRadius: "50%",
          bgcolor: event.disabled
            ? "#d0d0d0"
            : event.color || (theme.vars || theme).palette.primary.main,
        }}
      />

      {!props.hideDates && (
        <Typography color="textSecondary" sx={{ textWrap: "nowrap", fontSize: "0.75rem" }}>
          {format(event.start, hFormat, { locale })}
        </Typography>
      )}

      <Typography
        sx={{
          textWrap: "nowrap",
          textOverflow: "ellipsis",
          overflow: "hidden",
          fontSize: "0.75rem",
        }}
      >
        {event.title}
      </Typography>
    </ButtonBase>
  );
}

function EventPaper(
  props: EventItemProps & { selected?: boolean; triggerViewer: (el?: MouseEvent<Element>) => void }
) {
  const { event, triggerViewer, hasPrev, hasNext, selected } = props;
  const theme = useTheme();
  const { onEventClick, disableViewer } = useStore(
    (s) => ({
      onEventClick: s.onEventClick,
      disableViewer: s.disableViewer,
    }),
    shallowEqual
  );
  const dragProps = useDragAttributes(props.event);
  const { canDrag } = useEventPermissions(props.event);

  return (
    <EventItemPaper
      key={`${event.start.getTime()}_${event.end.getTime()}_${event.event_id}`}
      disabled={event.disabled}
      sx={{
        bgcolor: event.disabled
          ? "#d0d0d0"
          : event.color || (theme.vars || theme).palette.primary.main,
        color: event.disabled
          ? "#808080"
          : theme.palette.getContrastText(
              event.color || (theme.vars || theme).palette.primary.main
            ),
        mx: 0.25,
        clipPath:
          hasPrev && hasNext
            ? `polygon(8px 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0 50%)`
            : hasPrev
              ? `polygon(8px 0, 100% 0, 100% 100%, 8px 100%, 0 50%)`
              : hasNext
                ? `polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)`
                : undefined,
        ...(event.sx || {}),
        ...(props.sx || {}),
        // Above overlapping events, but below sticky headers (z-index 99)
        ...(selected ? { zIndex: 90 } : {}),
      }}
      {...dragProps}
      draggable={canDrag}
    >
      <ButtonBase
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disableViewer) {
            triggerViewer(e);
          }
          if (typeof onEventClick === "function") {
            onEventClick(event);
          }
        }}
        focusRipple
        tabIndex={disableViewer ? -1 : 0}
        disableRipple={disableViewer}
        disabled={event.disabled}
      >
        <EventDetails {...props} />
      </ButtonBase>
    </EventItemPaper>
  );
}

function EventDetails({ event, multiday, hideDates, hasPrev, hasNext }: EventItemProps) {
  const { locale, hourFormat } = useStore(
    (s) => ({
      locale: s.locale,
      hourFormat: s.hourFormat,
    }),
    shallowEqual
  );
  const hFormat = getHourFormat(hourFormat);
  const allDayEvent = differenceInDaysOmitTime(event.start, event.end) <= 0 && event.allDay;

  if (multiday) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: "2px",
          paddingRight: "2px",
        }}
      >
        <Typography sx={{ fontSize: 11 }} noWrap>
          {!hasPrev && !allDayEvent && !hideDates && format(event.start, hFormat, { locale })}
        </Typography>
        <Typography variant="subtitle2" align="center" sx={{ fontSize: 12 }} noWrap>
          {event.title}
        </Typography>
        <Typography sx={{ fontSize: 11 }} noWrap>
          {!hasNext && !allDayEvent && !hideDates && format(event.end, hFormat, { locale })}
        </Typography>
      </div>
    );
  }

  return (
    <div style={{ padding: "2px 6px" }}>
      <Typography variant="subtitle2" style={{ fontSize: 12 }} noWrap>
        {event.title}
      </Typography>
      {event.subtitle && (
        <Typography variant="body2" style={{ fontSize: 11 }} noWrap>
          {event.subtitle}
        </Typography>
      )}
      {!hideDates && (
        <Typography style={{ fontSize: 11 }} noWrap>
          {`${format(event.start, hFormat, {
            locale,
          })} - ${format(event.end, hFormat, { locale })}`}
        </Typography>
      )}
    </div>
  );
}

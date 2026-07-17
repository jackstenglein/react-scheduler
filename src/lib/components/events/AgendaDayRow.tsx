import { Typography } from "@mui/material";
import { format, isToday } from "date-fns";
import { DefaultResource, ProcessedEvent } from "../../types";
import AgendaEventsList from "../events/AgendaEventsList";
import useStore, { shallowEqual } from "../../hooks/useStore";
import { isTimeZonedToday } from "../../helpers/generals";
import { renderSlot } from "../../slots/resolveSlot";

type Props = {
  day: Date;
  dayEvents: ProcessedEvent[];
  /** Full event list passed to dayHeader (matches prior agenda behavior) */
  events: ProcessedEvent[];
  resource?: DefaultResource;
  disableGoToDay?: boolean;
  onGotoDay?: (day: Date) => void;
};

/** Shared agenda day header + event list row. */
export const AgendaDayRow = ({
  day,
  dayEvents,
  events,
  resource,
  disableGoToDay,
  onGotoDay,
}: Props) => {
  const { handleGotoDay, locale, timeZone, translations, slots, slotProps } = useStore(
    (s) => ({
      handleGotoDay: s.handleGotoDay,
      locale: s.locale,
      timeZone: s.timeZone,
      translations: s.translations,
      slots: s.slots,
      slotProps: s.slotProps,
    }),
    shallowEqual
  );
  const today = isTimeZonedToday({ dateLeft: day, timeZone });
  const goToDay = onGotoDay ?? handleGotoDay;

  const defaultHeader = (
    <Typography
      sx={{ fontWeight: today ? "bold" : "inherit" }}
      color={today ? "primary" : "inherit"}
      variant="body2"
      className={!disableGoToDay ? "rs__hover__op" : ""}
      onClick={(e) => {
        e.stopPropagation();
        if (!disableGoToDay) {
          goToDay(day);
        }
      }}
    >
      {format(day, "dd E", { locale })}
    </Typography>
  );

  return (
    <div className={`rs__agenda_row ${isToday(day) ? "rs__today_cell" : ""}`}>
      <div className="rs__cell rs__agenda__cell">
        {slots?.dayHeader ? (
          <div>
            {renderSlot({
              slot: slots.dayHeader,
              slotProps: slotProps?.dayHeader,
              ownerState: { day, events, resource },
              defaultElement: null,
            })}
          </div>
        ) : (
          defaultHeader
        )}
      </div>
      <div className="rs__cell rs__agenda_items">
        {dayEvents.length > 0 ? (
          <AgendaEventsList day={day} events={dayEvents} />
        ) : (
          <Typography sx={{ padding: 1 }}>{translations.noDataToDisplay}</Typography>
        )}
      </div>
    </div>
  );
};

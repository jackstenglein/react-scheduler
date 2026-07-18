import { Fragment, useMemo } from "react";
import {
  closestTo,
  isBefore,
  startOfWeek,
  differenceInDays,
  differenceInCalendarWeeks,
  format,
} from "date-fns";
import { RecurrenceEvent } from "../../types";
import { Typography, useTheme } from "@mui/material";
import EventItem from "./EventItem";
import { MONTH_NUMBER_HEIGHT, MULTI_DAY_EVENT_HEIGHT } from "../../helpers/constants";
import {
  convertEventTimeZone,
  differenceInDaysOmitTime,
  getEventOccurrenceKey,
} from "../../helpers/generals";
import useStore from "../../hooks/useStore";
import usePosition from "../../positionManager/usePosition";

interface MonthEventProps {
  events: RecurrenceEvent[];
  resourceId?: string;
  today: Date;
  eachWeekStart: Date[];
  eachFirstDayInCalcRow: Date | null;
  daysList: Date[];
  onViewMore(day: Date): void;
  cellHeight: number;
}

const MonthEvents = ({
  events,
  resourceId,
  today,
  eachWeekStart,
  eachFirstDayInCalcRow,
  daysList,
  onViewMore,
  cellHeight,
}: MonthEventProps) => {
  const LIMIT = Math.round((cellHeight - MONTH_NUMBER_HEIGHT) / MULTI_DAY_EVENT_HEIGHT - 1);
  const { translations, month, locale, timeZone } = useStore();
  const { renderedSlots } = usePosition();
  const theme = useTheme();

  const renderEvents = useMemo(() => {
    const elements: React.ReactNode[] = [];

    for (let i = 0; i < Math.min(events.length, LIMIT + 1); i++) {
      const event = convertEventTimeZone(events[i], timeZone);
      const fromPrevWeek = !!eachFirstDayInCalcRow && isBefore(event.start, eachFirstDayInCalcRow);
      const start = fromPrevWeek && eachFirstDayInCalcRow ? eachFirstDayInCalcRow : event.start;
      let eventLength = differenceInDaysOmitTime(start, event.end) + 1;

      const toNextWeek =
        differenceInCalendarWeeks(event.end, start, {
          weekStartsOn: month?.weekStartOn,
          locale,
        }) > 0;

      if (toNextWeek) {
        // Rethink it
        const NotAccurateWeekStart = startOfWeek(event.start, {
          weekStartsOn: month?.weekStartOn,
          locale,
        });
        const closestStart = closestTo(NotAccurateWeekStart, eachWeekStart);
        if (closestStart) {
          eventLength =
            daysList.length -
            (!eachFirstDayInCalcRow ? differenceInDays(event.start, closestStart) : 0);
        }
      }

      const day = format(today, "yyyy-MM-dd");
      const rendered = renderedSlots?.[resourceId || "all"]?.[day];
      const position = rendered?.[getEventOccurrenceKey(event)] ?? 0;

      if (position >= LIMIT) {
        elements.push(
          <Typography
            key={i}
            sx={{
              position: "absolute",
              zIndex: "1",
              top: `calc(${MULTI_DAY_EVENT_HEIGHT}px * ${position} + ${MONTH_NUMBER_HEIGHT}px + ${theme.spacing(position * 0.25)})`,
              fontSize: 11,
              paddingLeft: 0.25,
              width: 1,
              ":hover": {
                opacity: 0.7,
                textDecoration: "underline",
                cursor: "pointer",
              },
            }}
            onClick={(e) => {
              e.stopPropagation();
              onViewMore(today);
            }}
          >
            {`${Math.abs(events.length - i)} ${translations.moreEvents}`}
          </Typography>
        );
        break;
      }

      elements.push(
        <div
          key={`${event.event_id}_${i}`}
          style={{
            position: "absolute",
            zIndex: "1",
            top: `calc(${MULTI_DAY_EVENT_HEIGHT}px * ${position} + ${MONTH_NUMBER_HEIGHT}px + ${theme.spacing(position * 0.25)})`,
            width: `calc(${100 * eventLength}% + ${eventLength - 1}px)`,
            height: `${MULTI_DAY_EVENT_HEIGHT}px`,
            paddingRight: theme.spacing(0.25),
          }}
        >
          <EventItem
            variant="text"
            event={event}
            showDate={false}
            multiday={differenceInDaysOmitTime(event.start, event.end) > 0}
            hasPrev={fromPrevWeek}
            hasNext={toNextWeek}
          />
        </div>
      );
    }

    return elements;
  }, [
    resourceId,
    renderedSlots,
    events,
    LIMIT,
    eachFirstDayInCalcRow,
    month?.weekStartOn,
    locale,
    today,
    eachWeekStart,
    daysList.length,
    translations.moreEvents,
    onViewMore,
    timeZone,
    theme,
  ]);

  return <Fragment>{renderEvents}</Fragment>;
};

export default MonthEvents;

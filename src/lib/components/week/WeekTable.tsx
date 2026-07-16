import { Fragment, useMemo } from "react";
import useStore, { shallowEqual } from "../../hooks/useStore";
import { TableGrid } from "../../styles/styles";
import {
  convertEventTimeZone,
  differenceInDaysOmitTime,
  filterTodayEvents,
  getHourFormat,
} from "../../helpers/generals";
import { DefaultResource, ProcessedEvent } from "../../types";
import useSyncScroll from "../../hooks/useSyncScroll";
import {
  addMinutes,
  endOfDay,
  format,
  isBefore,
  isToday,
  isWithinInterval,
  startOfDay,
} from "date-fns";
import EventItem from "../events/EventItem";
import { Box, Stack, Typography } from "@mui/material";
import TodayEvents from "../events/TodayEvents";
import Cell from "../common/Cell";
import { DateButton } from "../common/DateButton";

type Props = {
  daysList: Date[];
  hours: Date[];
  cellHeight: number;
  minutesHeight: number;
  resource?: DefaultResource;
  resourcedEvents: ProcessedEvent[];
};

const WeekTable = ({
  daysList,
  hours,
  cellHeight,
  minutesHeight,
  resourcedEvents,
  resource,
}: Props) => {
  const {
    week,
    events,
    handleGotoDay,
    resourceFields,
    locale,
    hourFormat,
    stickyNavigation,
    translations,
    timeZone,
    direction,
  } = useStore(
    (s) => ({
      week: s.week,
      events: s.events,
      handleGotoDay: s.handleGotoDay,
      resourceFields: s.resourceFields,
      locale: s.locale,
      hourFormat: s.hourFormat,
      stickyNavigation: s.stickyNavigation,
      translations: s.translations,
      timeZone: s.timeZone,
      direction: s.direction,
    }),
    shallowEqual
  );
  const { startHour, endHour, step, cellRenderer, disableGoToDay } = week!;
  const { headersRef, bodyRef } = useSyncScroll();
  const hFormat = getHourFormat(hourFormat);

  const allDayEvents = useMemo(
    () => getAllDayEvents(events, daysList, timeZone),
    [events, daysList, timeZone]
  );

  const timedEventsByDay = useMemo(
    () => daysList.map((date) => filterTodayEvents(resourcedEvents, date, timeZone)),
    [daysList, resourcedEvents, timeZone]
  );

  return (
    <>
      {/* Header days */}
      <TableGrid
        days={daysList.length}
        ref={headersRef}
        sticky="1"
        stickyNavigation={stickyNavigation}
      >
        <Box></Box>
        {daysList.map((date, i) => (
          <DateButton
            key={i}
            date={date}
            onClick={!disableGoToDay ? handleGotoDay : undefined}
            locale={locale}
          />
        ))}

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            borderTop: "1px solid",
            borderRight: "1px solid",
            borderColor: "divider",
            minHeight: "34px",
          }}
        >
          <Typography
            component="p"
            variant="caption"
            color="textSecondary"
            sx={{ fontStyle: "italic" }}
          >
            {translations.event.allDay}
          </Typography>
        </Box>

        {daysList.map((date, i) => (
          <Box
            key={i}
            sx={{
              borderTop: "1px solid",
              borderLeft: i === 0 ? undefined : "1px solid",
              borderColor: "divider",
              paddingY: 0.5,
              paddingRight: 0.25,
              position: "relative",
            }}
          >
            <Box sx={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}>
              <Cell
                start={startOfDay(date)}
                end={endOfDay(date)}
                day={date}
                height={cellHeight}
                resourceKey={resourceFields.idField}
                resourceVal={resource ? resource[resourceFields.idField] : null}
                cellRenderer={cellRenderer}
              />
            </Box>

            <Stack sx={{ gap: 0.25 }}>
              {allDayEvents[i].map((event) => (
                <EventItem
                  key={event.event_id}
                  event={event}
                  multiday
                  hasPrev={isBefore(event.start, startOfDay(date))}
                  hasNext={isBefore(endOfDay(date), event.end)}
                  sx={{ width: "unset" }}
                />
              ))}
            </Stack>
          </Box>
        ))}
      </TableGrid>

      {/* Time Cells */}
      <TableGrid days={daysList.length} ref={bodyRef}>
        {hours.map((h, i) => (
          <Fragment key={i}>
            <Box
              sx={{
                height: cellHeight,
                display: "flex",
                flexDirection: "column",
                justifyContent: "start",
                alignItems: "center",
                borderRight: "1px solid",
                borderColor: "divider",
              }}
            >
              {i > 0 && (
                <span>
                  <Typography
                    component="p"
                    variant="caption"
                    color="textSecondary"
                    sx={{ position: "relative", top: "-50%" }}
                  >
                    {format(h, hFormat, { locale })}
                  </Typography>
                </span>
              )}
            </Box>

            {daysList.map((date, ii) => {
              const start = new Date(`${format(date, "yyyy/MM/dd")} ${format(h, hFormat)}`);
              const end = addMinutes(start, step);
              const field = resourceFields.idField;
              return (
                <span
                  key={ii}
                  className={`rs__cell ${isToday(date) ? "rs__today_cell" : ""} ${i === hours.length - 1 ? "rs__last_row" : ""}`}
                >
                  {/* Events of each day - run once on the top hour column */}
                  {i === 0 && (
                    <TodayEvents
                      todayEvents={timedEventsByDay[ii]}
                      today={date}
                      minuteHeight={minutesHeight}
                      startHour={startHour}
                      endHour={endHour}
                      step={step}
                      direction={direction}
                      timeZone={timeZone}
                    />
                  )}
                  <Cell
                    start={start}
                    end={end}
                    day={date}
                    height={cellHeight}
                    resourceKey={field}
                    resourceVal={resource ? resource[field] : null}
                    cellRenderer={cellRenderer}
                  />
                </span>
              );
            })}
          </Fragment>
        ))}
      </TableGrid>
    </>
  );
};

export default WeekTable;

/**
 * Returns a 2-dimensional list of ProcessedEvents that run all day. Events are
 * included only in the list corresponding to their start day.
 * @param events The events to check for all day events.
 * @param daysList The list of days to check.
 * @param timeZone The timeZone to convert events to.
 * @returns A 2D list of events, where the first dimensions corresponds to daysList.
 */
function getAllDayEvents(
  events: ProcessedEvent[],
  daysList: Date[],
  timeZone?: string
): ProcessedEvent[][] {
  const result: ProcessedEvent[][] = daysList.map(() => []);
  for (let event of events) {
    event = convertEventTimeZone(event, timeZone);
    const allDay = event.allDay || differenceInDaysOmitTime(event.start, event.end) > 0;
    if (!allDay) {
      continue;
    }

    for (let i = 0; i < daysList.length; i++) {
      const day = daysList[i];
      if (isWithinInterval(day, { start: startOfDay(event.start), end: endOfDay(event.end) })) {
        result[i].push(event);
        break;
      }
    }
  }
  return result;
}

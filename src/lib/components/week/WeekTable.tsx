import { Fragment, useMemo } from "react";
import useStore, { shallowEqual } from "../../hooks/useStore";
import { TableGrid } from "../../styles/styles";
import { getHourFormat } from "../../helpers/generals";
import { MULTI_DAY_EVENT_HEIGHT } from "../../helpers/constants";
import { DefaultResource, ProcessedEvent } from "../../types";
import useSyncScroll from "../../hooks/useSyncScroll";
import { addMinutes, endOfDay, format, isToday, startOfDay } from "date-fns";
import EventItem from "../events/EventItem";
import { Box, Typography } from "@mui/material";
import TodayEvents from "../events/TodayEvents";
import Cell from "../common/Cell";
import { DateButton } from "../common/DateButton";
import { computeWeekLayout } from "../../layout/eventLayout";
import { renderSlot } from "../../slots/resolveSlot";

type Props = {
  daysList: Date[];
  hours: Date[];
  cellHeight: number;
  minutesHeight: number;
  resource?: DefaultResource;
  resourcedEvents: ProcessedEvent[];
};

const ALL_DAY_ROW_PAD = 8;
const ALL_DAY_SLOT_GAP = 2;

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
    translations,
    timeZone,
    direction,
    slots,
    slotProps,
  } = useStore(
    (s) => ({
      week: s.week,
      events: s.events,
      handleGotoDay: s.handleGotoDay,
      resourceFields: s.resourceFields,
      locale: s.locale,
      hourFormat: s.hourFormat,
      translations: s.translations,
      timeZone: s.timeZone,
      direction: s.direction,
      slots: s.slots,
      slotProps: s.slotProps,
    }),
    shallowEqual
  );
  const { startHour, endHour, step, disableGoToDay } = week!;
  const { headersRef, bodyRef } = useSyncScroll();
  const hFormat = getHourFormat(hourFormat);

  const dayLayouts = useMemo(
    () =>
      computeWeekLayout({
        allDaySourceEvents: events,
        timedSourceEvents: resourcedEvents,
        daysList,
        timeZone,
        timedLayout: {
          startHour,
          endHour,
          minuteHeight: minutesHeight,
          direction,
        },
      }),
    [events, resourcedEvents, daysList, timeZone, startHour, endHour, minutesHeight, direction]
  );

  const allDayRowHeight = useMemo(() => {
    let maxSlots = 0;
    for (const day of dayLayouts) {
      for (const placement of day.allDay) {
        maxSlots = Math.max(maxSlots, placement.slot + 1);
      }
    }
    if (maxSlots === 0) {
      return 34;
    }
    return maxSlots * (MULTI_DAY_EVENT_HEIGHT + ALL_DAY_SLOT_GAP) + ALL_DAY_ROW_PAD;
  }, [dayLayouts]);

  return (
    <>
      {/* Header days */}
      <TableGrid days={daysList.length} ref={headersRef} sticky="1">
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
            minHeight: allDayRowHeight,
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

        {dayLayouts.map(({ date, allDay }, i) => (
          <Box
            key={i}
            data-testid="week-allday-cell"
            sx={{
              borderTop: "1px solid",
              borderLeft: i === 0 ? undefined : "1px solid",
              borderColor: "divider",
              position: "relative",
              minHeight: allDayRowHeight,
              overflow: "visible",
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
              />
            </Box>

            {allDay.map(({ event, span, hasPrev, hasNext, slot }) => (
              <div
                key={event.event_id}
                data-testid={`week-allday-event-${event.event_id}`}
                data-span={span}
                data-slot={slot}
                style={{
                  position: "absolute",
                  zIndex: 1,
                  top: slot * (MULTI_DAY_EVENT_HEIGHT + ALL_DAY_SLOT_GAP) + ALL_DAY_SLOT_GAP,
                  left: 0,
                  width: `${100 * span}%`,
                  height: MULTI_DAY_EVENT_HEIGHT,
                  overflow: "hidden",
                }}
              >
                <EventItem event={event} multiday hasPrev={hasPrev} hasNext={hasNext} />
              </div>
            ))}
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
                  {renderSlot({
                    slot: slots?.hourLabel,
                    slotProps: slotProps?.hourLabel,
                    ownerState: {
                      hour: format(h, hFormat, { locale }),
                      date: h,
                      hourFormat,
                    },
                    defaultElement: (
                      <Typography
                        component="p"
                        variant="caption"
                        color="textSecondary"
                        sx={{ position: "relative", top: "-50%" }}
                      >
                        {format(h, hFormat, { locale })}
                      </Typography>
                    ),
                  })}
                </span>
              )}
            </Box>

            {dayLayouts.map(({ date, timed, timedPlacements }, ii) => {
              const start = new Date(`${format(date, "yyyy/MM/dd")} ${format(h, hFormat)}`);
              const end = addMinutes(start, step);
              const field = resourceFields.idField;
              return (
                <span
                  key={ii}
                  className={`rs__cell ${isToday(date) ? "rs__today_cell" : ""} ${i === hours.length - 1 ? "rs__last_row" : ""}`}
                >
                  {i === 0 && (
                    <TodayEvents
                      todayEvents={timed}
                      placements={timedPlacements}
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

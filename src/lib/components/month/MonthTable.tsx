import { Button, Typography } from "@mui/material";
import {
  addDays,
  endOfDay,
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  setHours,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { Fragment, useCallback } from "react";
import {
  getHourFormat,
  getRecurrencesForDate,
  getResourcedEvents,
  isTimeZonedToday,
  sortEventsByTheEarliest,
} from "../../helpers/generals";
import useStore from "../../hooks/useStore";
import useSyncScroll from "../../hooks/useSyncScroll";
import { TableGrid } from "../../styles/styles";
import { DefaultResource } from "../../types";
import Cell from "../common/Cell";
import MonthEvents from "../events/MonthEvents";

type Props = {
  daysList: Date[];
  resource?: DefaultResource;
  eachWeekStart: Date[];
};

const MonthTable = ({ daysList, resource, eachWeekStart }: Props) => {
  const {
    height,
    month,
    selectedDate,
    events,
    handleGotoDay,
    resourceFields,
    fields,
    locale,
    hourFormat,
    stickyNavigation,
    timeZone,
    onClickMore,
  } = useStore();
  const { weekDays, startHour, endHour, cellRenderer, headRenderer, disableGoToDay } = month!;
  const { headersRef, bodyRef } = useSyncScroll();

  const monthStart = startOfMonth(selectedDate);
  const hFormat = getHourFormat(hourFormat);
  const CELL_HEIGHT = height / eachWeekStart.length;

  const renderCells = useCallback(
    (resource?: DefaultResource) => {
      let resourcedEvents = sortEventsByTheEarliest(events);
      if (resource) {
        resourcedEvents = getResourcedEvents(events, resource, resourceFields, fields);
      }
      const rows: React.ReactNode[] = [];

      for (const startDay of eachWeekStart) {
        const cells = weekDays.map((d) => {
          const today = addDays(startDay, d);
          const start = new Date(`${format(setHours(today, startHour), `yyyy/MM/dd ${hFormat}`)}`);
          const end = new Date(`${format(setHours(today, endHour), `yyyy/MM/dd ${hFormat}`)}`);
          const field = resourceFields.idField;
          const eachFirstDayInCalcRow = isSameDay(startDay, today) ? today : null;
          const todayEvents = resourcedEvents
            .flatMap((e) => getRecurrencesForDate(e, today))
            .filter((e) => {
              if (isSameDay(e.start, today)) return true;
              const dayInterval = { start: startOfDay(e.start), end: endOfDay(e.end) };
              if (eachFirstDayInCalcRow && isWithinInterval(eachFirstDayInCalcRow, dayInterval))
                return true;
              return false;
            });
          const isToday = isTimeZonedToday({ dateLeft: today, timeZone });
          return (
            <span style={{ height: CELL_HEIGHT }} key={d.toString()} className="rs__cell">
              <Cell
                start={start}
                end={end}
                day={selectedDate}
                height={CELL_HEIGHT}
                resourceKey={field}
                resourceVal={resource ? resource[field] : null}
                cellRenderer={cellRenderer}
              />
              <Fragment>
                {typeof headRenderer === "function" ? (
                  <div style={{ position: "absolute", top: 0 }}>
                    {headRenderer({ day: today, events: resourcedEvents, resource })}
                  </div>
                ) : (
                  <Button
                    data-test-id="month-date-button"
                    variant={isToday ? "contained" : "text"}
                    color={isToday ? "info" : "primary"}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!disableGoToDay) {
                        handleGotoDay(today);
                      }
                    }}
                    sx={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      borderRadius: "50%",
                      aspectRatio: "1 / 1",
                      minWidth: "1.5rem",
                      height: "1.5rem",
                      fontSize: "0.75rem",
                      padding: 0.75,
                      color: (theme) =>
                        isToday
                          ? theme.palette.primary.contrastText
                          : isSameMonth(today, monthStart)
                            ? theme.palette.text.primary
                            : theme.palette.text.secondary,
                    }}
                  >
                    {format(today, "d", { locale })}
                  </Button>
                )}

                <MonthEvents
                  events={todayEvents}
                  resourceId={resource?.[field]}
                  today={today}
                  eachWeekStart={eachWeekStart}
                  eachFirstDayInCalcRow={eachFirstDayInCalcRow}
                  daysList={daysList}
                  onViewMore={(e) => {
                    if (onClickMore && typeof onClickMore === "function") {
                      onClickMore(e, handleGotoDay);
                    } else {
                      handleGotoDay(e);
                    }
                  }}
                  cellHeight={CELL_HEIGHT}
                />
              </Fragment>
            </span>
          );
        });

        rows.push(<Fragment key={startDay.toString()}>{cells}</Fragment>);
      }
      return rows;
    },
    [
      CELL_HEIGHT,
      cellRenderer,
      daysList,
      disableGoToDay,
      eachWeekStart,
      endHour,
      events,
      fields,
      hFormat,
      handleGotoDay,
      headRenderer,
      monthStart,
      onClickMore,
      resourceFields,
      selectedDate,
      startHour,
      timeZone,
      weekDays,
      locale,
    ]
  );

  return (
    <>
      {/* Header Days */}
      <TableGrid
        days={daysList.length}
        ref={headersRef}
        indent="0"
        sticky="1"
        stickyNavigation={stickyNavigation}
      >
        {daysList.map((date, i) => (
          <Typography
            key={i}
            sx={{
              padding: 1,
              borderStyle: "solid",
              borderColor: "divider",
              borderWidth: 0,
              borderLeftWidth: i === 0 ? 0 : "1px",
            }}
            align="center"
            variant="body2"
          >
            {format(date, "EE", { locale })}
          </Typography>
        ))}
      </TableGrid>
      {/* Time Cells */}
      <TableGrid days={daysList.length} ref={bodyRef} indent="0">
        {renderCells(resource)}
      </TableGrid>
    </>
  );
};

export default MonthTable;

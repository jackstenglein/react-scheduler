import { Button, Typography } from "@mui/material";
import { addDays, format, isSameDay, isSameMonth, setHours, startOfMonth } from "date-fns";
import { Fragment, useMemo } from "react";
import { getHourFormat, isTimeZonedToday } from "../../helpers/generals";
import useStore, { shallowEqual } from "../../hooks/useStore";
import useSyncScroll from "../../hooks/useSyncScroll";
import { computeMonthGridEvents } from "../../layout/eventLayout";
import { renderSlot } from "../../slots/resolveSlot";
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
    slots,
    slotProps,
  } = useStore(
    (s) => ({
      height: s.height,
      month: s.month,
      selectedDate: s.selectedDate,
      events: s.events,
      handleGotoDay: s.handleGotoDay,
      resourceFields: s.resourceFields,
      fields: s.fields,
      locale: s.locale,
      hourFormat: s.hourFormat,
      stickyNavigation: s.stickyNavigation,
      timeZone: s.timeZone,
      onClickMore: s.onClickMore,
      slots: s.slots,
      slotProps: s.slotProps,
    }),
    shallowEqual
  );
  const { weekDays, startHour, endHour, disableGoToDay } = month!;
  const { headersRef, bodyRef } = useSyncScroll();

  const monthStart = startOfMonth(selectedDate);
  const hFormat = getHourFormat(hourFormat);
  const CELL_HEIGHT = height / eachWeekStart.length;

  const { byDay: eventsByDay, resourcedEvents } = useMemo(
    () =>
      computeMonthGridEvents({
        events,
        resource,
        resourceFields,
        fields,
        eachWeekStart,
        weekDays,
      }),
    [events, resource, resourceFields, fields, eachWeekStart, weekDays]
  );

  const rows = useMemo(() => {
    const result: React.ReactNode[] = [];
    const field = resourceFields.idField;

    for (const startDay of eachWeekStart) {
      const cells = weekDays.map((d) => {
        const today = addDays(startDay, d);
        const start = new Date(`${format(setHours(today, startHour), `yyyy/MM/dd ${hFormat}`)}`);
        const end = new Date(`${format(setHours(today, endHour), `yyyy/MM/dd ${hFormat}`)}`);
        const eachFirstDayInCalcRow = isSameDay(startDay, today) ? today : null;
        const dayKey = format(today, "yyyy-MM-dd");
        const todayEvents = eventsByDay[dayKey] || [];
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
            />
            <Fragment>
              {slots?.dayHeader ? (
                <div style={{ position: "absolute", top: 0 }}>
                  {renderSlot({
                    slot: slots.dayHeader,
                    slotProps: slotProps?.dayHeader,
                    ownerState: { day: today, events: resourcedEvents, resource },
                    defaultElement: null,
                  })}
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

      result.push(<Fragment key={startDay.toString()}>{cells}</Fragment>);
    }
    return result;
  }, [
    CELL_HEIGHT,
    daysList,
    disableGoToDay,
    eachWeekStart,
    endHour,
    eventsByDay,
    resourcedEvents,
    hFormat,
    handleGotoDay,
    locale,
    monthStart,
    onClickMore,
    resource,
    resourceFields.idField,
    selectedDate,
    slots,
    slotProps,
    startHour,
    timeZone,
    weekDays,
  ]);

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
        {rows}
      </TableGrid>
    </>
  );
};

export default MonthTable;

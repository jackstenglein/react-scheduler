import { useEffect, useCallback, useMemo } from "react";
import { startOfWeek, addDays, eachMinuteOfInterval, endOfDay, startOfDay, set } from "date-fns";
import { DefaultResource } from "../types";
import { calcCellHeight, calcMinuteHeight, getResourcedEvents } from "../helpers/generals";
import { WithResources } from "../components/common/WithResources";
import useStore from "../hooks/useStore";
import { WeekAgenda } from "./WeekAgenda";
import WeekTable from "../components/week/WeekTable";

/**
 * Renders the week (or day) view. The day view is treated the same
 * as the week view, except only a single day is included.
 */
export const Week = () => {
  const {
    view,
    day,
    week,
    selectedDate,
    height,
    events,
    getRemoteEvents,
    triggerLoading,
    handleState,
    resources,
    resourceFields,
    fields,
    agenda,
  } = useStore();

  const { weekStartOn, weekDays } = week!;
  let { startHour, endHour, step } = week!;
  if (view === "day") {
    startHour = day!.startHour;
    endHour = day!.endHour;
    step = day!.step;
  }

  const daysList = useMemo(() => {
    const weekStartDate = startOfWeek(selectedDate, { weekStartsOn: weekStartOn });
    return weekDays.map((d) => addDays(weekStartDate, d));
  }, [selectedDate, weekDays, weekStartOn]);

  const weekStart = useMemo(() => startOfDay(daysList[0]), [daysList]);
  const weekEnd = useMemo(() => endOfDay(daysList[daysList.length - 1]), [daysList]);

  const START_TIME = set(selectedDate, { hours: startHour, minutes: 0, seconds: 0 });
  const END_TIME = set(selectedDate, { hours: endHour, minutes: -step, seconds: 0 });
  const hours = eachMinuteOfInterval(
    {
      start: START_TIME,
      end: END_TIME,
    },
    { step }
  );
  const CELL_HEIGHT = calcCellHeight(height, hours.length);
  const MINUTE_HEIGHT = calcMinuteHeight(CELL_HEIGHT, step);

  const fetchEvents = useCallback(async () => {
    try {
      triggerLoading(true);

      const fetched = await getRemoteEvents?.({
        start: weekStart,
        end: weekEnd,
        view: "week",
      });
      if (Array.isArray(fetched)) {
        handleState(fetched, "events");
      }
    } catch (error) {
      throw error;
    } finally {
      triggerLoading(false);
    }
    // Omit handleState/triggerLoading: store recreates them each render.
    // weekStart/weekEnd are memoized from selectedDate so this stays stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getRemoteEvents, weekEnd, weekStart]);

  useEffect(() => {
    if (getRemoteEvents) {
      fetchEvents();
    }
  }, [fetchEvents, getRemoteEvents]);

  const renderTable = (resource?: DefaultResource) => {
    let resourcedEvents = events;
    if (resource) {
      resourcedEvents = getResourcedEvents(events, resource, resourceFields, fields);
    }

    if (agenda) {
      return <WeekAgenda daysList={daysList} resource={resource} events={resourcedEvents} />;
    }

    return (
      <WeekTable
        resourcedEvents={resourcedEvents}
        resource={resource}
        hours={hours}
        cellHeight={CELL_HEIGHT}
        minutesHeight={MINUTE_HEIGHT}
        daysList={view === "day" ? [selectedDate] : daysList}
      />
    );
  };

  return resources.length ? <WithResources renderChildren={renderTable} /> : renderTable();
};

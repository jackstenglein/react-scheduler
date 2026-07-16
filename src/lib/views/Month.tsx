import { useEffect, useCallback, useMemo } from "react";
import { addDays, eachWeekOfInterval, endOfMonth, startOfMonth } from "date-fns";
import { DefaultResource } from "../types";
import { getResourcedEvents, sortEventsByTheEarliest } from "../helpers/generals";
import { WithResources } from "../components/common/WithResources";
import useStore, { shallowEqual } from "../hooks/useStore";
import { MonthAgenda } from "./MonthAgenda";
import MonthTable from "../components/month/MonthTable";

const Month = () => {
  const {
    month,
    selectedDate,
    events,
    getRemoteEvents,
    triggerLoading,
    handleState,
    resources,
    resourceFields,
    fields,
    agenda,
  } = useStore(
    (s) => ({
      month: s.month,
      selectedDate: s.selectedDate,
      events: s.events,
      getRemoteEvents: s.getRemoteEvents,
      triggerLoading: s.triggerLoading,
      handleState: s.handleState,
      resources: s.resources,
      resourceFields: s.resourceFields,
      fields: s.fields,
      agenda: s.agenda,
    }),
    shallowEqual
  );

  const { weekStartOn, weekDays } = month!;
  const eachWeekStart = useMemo(() => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    return eachWeekOfInterval(
      {
        start: monthStart,
        end: monthEnd,
      },
      { weekStartsOn: weekStartOn }
    );
  }, [selectedDate, weekStartOn]);
  const daysList = useMemo(
    () => weekDays.map((d) => addDays(eachWeekStart[0], d)),
    [eachWeekStart, weekDays]
  );

  const fetchEvents = useCallback(async () => {
    try {
      triggerLoading(true);
      const start = eachWeekStart[0];
      const end = addDays(eachWeekStart[eachWeekStart.length - 1], daysList.length);
      const fetched = await getRemoteEvents!({
        start,
        end,
        view: "month",
      });
      if (fetched && fetched?.length) {
        handleState(fetched, "events");
      }
    } catch (error) {
      throw error;
    } finally {
      triggerLoading(false);
    }
  }, [daysList.length, eachWeekStart, getRemoteEvents, handleState, triggerLoading]);

  useEffect(() => {
    if (getRemoteEvents instanceof Function) {
      fetchEvents();
    }
  }, [fetchEvents, getRemoteEvents]);

  const renderTable = useCallback(
    (resource?: DefaultResource) => {
      if (agenda) {
        let resourcedEvents = sortEventsByTheEarliest(events);
        if (resource) {
          resourcedEvents = getResourcedEvents(events, resource, resourceFields, fields);
        }

        return <MonthAgenda resource={resource} events={resourcedEvents} />;
      }

      return <MonthTable daysList={daysList} eachWeekStart={eachWeekStart} resource={resource} />;
    },
    [agenda, daysList, eachWeekStart, events, fields, resourceFields]
  );

  return resources.length ? <WithResources renderChildren={renderTable} /> : renderTable();
};

export { Month };

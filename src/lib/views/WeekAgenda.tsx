import { useMemo } from "react";
import { AgendaDiv } from "../styles/styles";
import { DefaultResource, ProcessedEvent } from "../types";
import useStore, { shallowEqual } from "../hooks/useStore";
import { filterTodayAgendaEvents } from "../helpers/generals";
import EmptyAgenda from "../components/events/EmptyAgenda";
import { AgendaDayRow } from "../components/events/AgendaDayRow";

type Props = {
  daysList: Date[];
  resource?: DefaultResource;
  events: ProcessedEvent[];
};
const WeekAgenda = ({ daysList, resource, events }: Props) => {
  const { week, alwaysShowAgendaDays } = useStore(
    (s) => ({
      week: s.week,
      alwaysShowAgendaDays: s.alwaysShowAgendaDays,
    }),
    shallowEqual
  );
  const { disableGoToDay } = week!;

  const hasEvents = useMemo(() => {
    return daysList.some((day) => filterTodayAgendaEvents(events, day).length > 0);
  }, [daysList, events]);

  if (!alwaysShowAgendaDays && !hasEvents) {
    return <EmptyAgenda />;
  }

  return (
    <AgendaDiv>
      {daysList.map((day, i) => {
        const dayEvents = filterTodayAgendaEvents(events, day);
        if (!alwaysShowAgendaDays && !dayEvents.length) return null;

        return (
          <AgendaDayRow
            key={i}
            day={day}
            dayEvents={dayEvents}
            events={events}
            resource={resource}
            disableGoToDay={disableGoToDay}
          />
        );
      })}
    </AgendaDiv>
  );
};

export { WeekAgenda };

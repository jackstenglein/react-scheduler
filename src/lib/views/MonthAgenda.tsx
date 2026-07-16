import { useMemo } from "react";
import { isSameMonth, getDaysInMonth } from "date-fns";
import { AgendaDiv } from "../styles/styles";
import { DefaultResource, ProcessedEvent } from "../types";
import useStore, { shallowEqual } from "../hooks/useStore";
import { filterTodayAgendaEvents } from "../helpers/generals";
import EmptyAgenda from "../components/events/EmptyAgenda";
import { AgendaDayRow } from "../components/events/AgendaDayRow";

type Props = {
  events: ProcessedEvent[];
  resource?: DefaultResource;
};
const MonthAgenda = ({ events, resource }: Props) => {
  const { month, selectedDate, alwaysShowAgendaDays } = useStore(
    (s) => ({
      month: s.month,
      selectedDate: s.selectedDate,
      alwaysShowAgendaDays: s.alwaysShowAgendaDays,
    }),
    shallowEqual
  );
  const { disableGoToDay, headRenderer } = month!;
  const daysOfMonth = getDaysInMonth(selectedDate);
  const daysList = Array.from({ length: daysOfMonth }, (_, i) => i + 1);

  const monthEvents = useMemo(() => {
    return events.filter((event) => isSameMonth(event.start, selectedDate));
  }, [events, selectedDate]);

  if (!alwaysShowAgendaDays && !monthEvents.length) {
    return <EmptyAgenda />;
  }

  return (
    <AgendaDiv>
      {daysList.map((i) => {
        const day = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i);
        const dayEvents = filterTodayAgendaEvents(events, day);
        if (!alwaysShowAgendaDays && !dayEvents.length) return null;

        return (
          <AgendaDayRow
            key={i}
            day={day}
            dayEvents={dayEvents}
            events={events}
            resource={resource}
            headRenderer={headRenderer}
            disableGoToDay={disableGoToDay}
          />
        );
      })}
    </AgendaDiv>
  );
};

export { MonthAgenda };

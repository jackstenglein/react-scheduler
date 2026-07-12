import { differenceInMinutes } from "date-fns";
import { Fragment } from "react";
import { isTimeZonedToday, traversCrossingEvents } from "../../helpers/generals";
import { ProcessedEvent } from "../../types";
import CurrentTimeBar from "./CurrentTimeBar";
import EventItem from "./EventItem";

interface TodayEventsProps {
  todayEvents: ProcessedEvent[];
  today: Date;
  startHour: number;
  endHour: number;
  step: number;
  minuteHeight: number;
  direction: "rtl" | "ltr";
  timeZone?: string;
}
const TodayEvents = ({
  todayEvents,
  today,
  startHour,
  endHour,
  step,
  minuteHeight,
  direction,
  timeZone,
}: TodayEventsProps) => {
  const crossingIds: Array<number | string> = [];

  return (
    <Fragment>
      {isTimeZonedToday({ dateLeft: today, timeZone }) && (
        <CurrentTimeBar
          startHour={startHour}
          step={step}
          minuteHeight={minuteHeight}
          timeZone={timeZone}
          zIndex={2 * todayEvents.length + 1}
        />
      )}

      {todayEvents.map((event, i) => {
        const maxHeight = (endHour * 60 - startHour * 60) * minuteHeight;
        const eventHeight = differenceInMinutes(event.end, event.start) * minuteHeight;
        const height = Math.min(eventHeight, maxHeight);

        /** Calculate top space */
        const calendarStartInMins = startHour * 60;
        const eventStartInMins = event.start.getHours() * 60 + event.start.getMinutes();
        const minutesFromTop = Math.max(eventStartInMins - calendarStartInMins, 0);
        const top = minutesFromTop * minuteHeight;

        const crossingEvents = traversCrossingEvents(todayEvents, event);
        const alreadyRendered = crossingEvents.filter((e) => crossingIds.includes(e.event_id));
        crossingIds.push(event.event_id);

        return (
          <div
            key={`${event.event_id}/${event.recurrenceId || ""}`}
            style={{
              position: "absolute",
              height,
              top,
              width:
                alreadyRendered.length > 0
                  ? `calc(100% - ${100 - 98 / (alreadyRendered.length + 1)}%)`
                  : "98%", // Leave some space to click cell
              zIndex: todayEvents.length + i,
              [direction === "rtl" ? "right" : "left"]:
                alreadyRendered.length > 0
                  ? `${(100 / (crossingEvents.length + 1)) * alreadyRendered.length}%`
                  : "",
            }}
          >
            <EventItem event={event} />
          </div>
        );
      })}
    </Fragment>
  );
};

export default TodayEvents;

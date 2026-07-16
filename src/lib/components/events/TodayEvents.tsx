import { Fragment } from "react";
import { isTimeZonedToday } from "../../helpers/generals";
import { ProcessedEvent } from "../../types";
import { layoutTimedEvents, TimedEventPlacement } from "../../layout/eventLayout";
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
  /** Optional precomputed placements; computed from todayEvents when omitted */
  placements?: TimedEventPlacement[];
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
  placements: placementsProp,
}: TodayEventsProps) => {
  const placements =
    placementsProp ??
    layoutTimedEvents(todayEvents, { startHour, endHour, minuteHeight, direction });

  const insetKey = direction === "rtl" ? "right" : "left";

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

      {placements.map((placement) => (
        <div
          key={`${placement.event.event_id}/${placement.event.recurrenceId || ""}`}
          style={{
            position: "absolute",
            height: placement.height,
            top: placement.top,
            width: placement.width,
            zIndex: placement.zIndex,
            [insetKey]: placement.horizontalOffset,
          }}
        >
          <EventItem event={placement.event} />
        </div>
      ))}
    </Fragment>
  );
};

export default TodayEvents;

import {
  addDays,
  differenceInMinutes,
  eachDayOfInterval,
  endOfDay,
  format,
  isSameDay,
  isWithinInterval,
  startOfDay,
} from "date-fns";
import { View } from "../components/nav/Navigation";
import {
  convertEventTimeZone,
  differenceInDaysOmitTime,
  filterTodayEvents,
  getRecurrencesForDate,
  getResourcedEvents,
  sortEventsByTheEarliest,
  sortEventsByTheLengthest,
  traversCrossingEvents,
} from "../helpers/generals";
import { DefaultResource, FieldProps, ProcessedEvent, ResourceFields } from "../types";

/** day (yyyy-MM-dd) → eventId → vertical slot index */
export type DaySlots = Record<string, Record<string, number>>;

/** resourceId ("all" when none) → DaySlots */
export type RenderedSlots = Record<string, DaySlots>;

export type TimedEventPlacement = {
  event: ProcessedEvent;
  top: number;
  height: number;
  width: string;
  /** CSS `left` or `right` percentage/empty, depending on direction */
  horizontalOffset: string;
  zIndex: number;
};

export type WeekDayBucket = {
  date: Date;
  allDay: ProcessedEvent[];
  timed: ProcessedEvent[];
  timedPlacements: TimedEventPlacement[];
};

export type TimedLayoutOptions = {
  startHour: number;
  endHour: number;
  minuteHeight: number;
  direction: "rtl" | "ltr";
};

/**
 * Assigns non-colliding vertical slots for multi-day / stacked events.
 */
export function computeEventSlots(events: ProcessedEvent[]): DaySlots {
  const slots: DaySlots = {};
  for (let i = 0; i < events.length; i++) {
    let position = 0;
    const event = events[i];
    const eventLength = eachDayOfInterval({ start: event.start, end: event.end });
    for (let d = 0; d < eventLength.length; d++) {
      const day = format(eventLength[d], "yyyy-MM-dd");
      if (slots[day]) {
        const positions = Object.values(slots[day]);
        while (positions.includes(position)) {
          position += 1;
        }
        slots[day][event.event_id] = position;
      } else {
        slots[day] = { [event.event_id]: position };
      }
    }
  }
  return slots;
}

export function computeRenderedSlots(
  events: ProcessedEvent[],
  resources: DefaultResource[],
  resourceFields: ResourceFields,
  fields: FieldProps[],
  view: View
): RenderedSlots {
  const sorted =
    view === "month" ? sortEventsByTheLengthest(events) : sortEventsByTheEarliest(events);
  const slots: RenderedSlots = {};

  if (resources.length) {
    for (const resource of resources) {
      const resourcedEvents = getResourcedEvents(sorted, resource, resourceFields, fields);
      slots[resource[resourceFields.idField]] = computeEventSlots(resourcedEvents);
    }
  } else {
    slots.all = computeEventSlots(sorted);
  }
  return slots;
}

/**
 * Lays out same-day timed events with absolute top/height and horizontal overlap.
 */
export function layoutTimedEvents(
  todayEvents: ProcessedEvent[],
  { startHour, endHour, minuteHeight }: TimedLayoutOptions
): TimedEventPlacement[] {
  const crossingIds: Array<number | string> = [];
  const maxHeight = (endHour * 60 - startHour * 60) * minuteHeight;
  const calendarStartInMins = startHour * 60;

  return todayEvents.map((event, i) => {
    const eventHeight = differenceInMinutes(event.end, event.start) * minuteHeight;
    const height = Math.min(eventHeight, maxHeight);
    const eventStartInMins = event.start.getHours() * 60 + event.start.getMinutes();
    const minutesFromTop = Math.max(eventStartInMins - calendarStartInMins, 0);
    const top = minutesFromTop * minuteHeight;

    const crossingEvents = traversCrossingEvents(todayEvents, event);
    const alreadyRendered = crossingEvents.filter((e) => crossingIds.includes(e.event_id));
    crossingIds.push(event.event_id);

    const width =
      alreadyRendered.length > 0
        ? `calc(100% - ${100 - 98 / (alreadyRendered.length + 1)}%)`
        : "98%";
    const horizontalOffset =
      alreadyRendered.length > 0
        ? `${(100 / (crossingEvents.length + 1)) * alreadyRendered.length}%`
        : "";

    return {
      event,
      top,
      height,
      width,
      horizontalOffset,
      zIndex: todayEvents.length + i,
    };
  });
}

/**
 * All-day / multi-day events for a week grid, keyed by first visible day column.
 */
export function getAllDayEventsByDay(
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

/**
 * Full week layout model: all-day buckets, timed events, and placements per day.
 */
export function computeWeekLayout(options: {
  allDaySourceEvents: ProcessedEvent[];
  timedSourceEvents: ProcessedEvent[];
  daysList: Date[];
  timeZone?: string;
  timedLayout: TimedLayoutOptions;
}): WeekDayBucket[] {
  const { allDaySourceEvents, timedSourceEvents, daysList, timeZone, timedLayout } = options;
  const allDayByDay = getAllDayEventsByDay(allDaySourceEvents, daysList, timeZone);

  return daysList.map((date, i) => {
    const timed = filterTodayEvents(timedSourceEvents, date, timeZone);
    return {
      date,
      allDay: allDayByDay[i],
      timed,
      timedPlacements: layoutTimedEvents(timed, timedLayout),
    };
  });
}

/**
 * Events visible in a month cell for `today`, including multi-day bars that
 * continue onto the first day of a week row.
 */
export function getMonthCellEvents(
  resourcedEvents: ProcessedEvent[],
  today: Date,
  eachFirstDayInCalcRow: Date | null
): ProcessedEvent[] {
  return resourcedEvents
    .flatMap((e) => getRecurrencesForDate(e, today))
    .filter((e) => {
      if (isSameDay(e.start, today)) return true;
      const dayInterval = { start: startOfDay(e.start), end: endOfDay(e.end) };
      if (eachFirstDayInCalcRow && isWithinInterval(eachFirstDayInCalcRow, dayInterval)) {
        return true;
      }
      return false;
    });
}

/**
 * Precomputes month-grid cell events for every day in the visible weeks.
 * Key: `yyyy-MM-dd`.
 */
export function computeMonthGridEvents(options: {
  events: ProcessedEvent[];
  resource?: DefaultResource;
  resourceFields: ResourceFields;
  fields: FieldProps[];
  eachWeekStart: Date[];
  weekDays: number[];
}): { byDay: Record<string, ProcessedEvent[]>; resourcedEvents: ProcessedEvent[] } {
  const { events, resource, resourceFields, fields, eachWeekStart, weekDays } = options;

  let resourcedEvents = sortEventsByTheEarliest(events);
  if (resource) {
    resourcedEvents = getResourcedEvents(events, resource, resourceFields, fields);
  }

  const byDay: Record<string, ProcessedEvent[]> = {};
  for (const startDay of eachWeekStart) {
    for (const d of weekDays) {
      const today = addDays(startDay, d);
      const key = format(today, "yyyy-MM-dd");
      const eachFirstDayInCalcRow = isSameDay(startDay, today) ? today : null;
      byDay[key] = getMonthCellEvents(resourcedEvents, today, eachFirstDayInCalcRow);
    }
  }
  return { byDay, resourcedEvents };
}

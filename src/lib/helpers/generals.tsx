import {
  addDays,
  addMilliseconds,
  addMinutes,
  addSeconds,
  differenceInDays,
  differenceInMilliseconds,
  endOfDay,
  format,
  isSameDay,
  isWithinInterval,
  startOfDay,
  subMinutes,
} from "date-fns";
import { RRule, RRuleSet } from "rrule";
import { View } from "../components/nav/Navigation";
import {
  DefaultResource,
  FieldProps,
  ProcessedEvent,
  RecurringEditMode,
  ResourceFields,
  SchedulerProps,
} from "../types";
import { StateEvent } from "../views/Editor";

// ─── RRuleSet helpers ────────────────────────────────────────────────────────

/** Wraps an RRule in an RRuleSet if it isn't one already. */
const toRRuleSet = (rule: RRule | RRuleSet): RRuleSet => {
  if (rule instanceof RRuleSet) return rule;
  const set = new RRuleSet();
  set.rrule(rule);
  return set;
};

/** Deep-clones an RRuleSet preserving all rrules and exdates. */
const cloneRRuleSet = (source: RRuleSet): RRuleSet => {
  const clone = new RRuleSet();
  (((source as any)._rrule as RRule[]) || []).forEach((r) => clone.rrule(r));
  (((source as any)._exdate as Date[]) || []).forEach((d) => clone.exdate(d));
  return clone;
};

/**
 * Returns a copy of the event whose recurrence rule has an EXDATE added for
 * the given occurrence start so that occurrence is skipped in future expansions.
 */
export const addExdateToEvent = (event: ProcessedEvent, occurrenceDate: Date): ProcessedEvent => {
  const set = cloneRRuleSet(toRRuleSet(event.recurring as RRule | RRuleSet));
  set.exdate(occurrenceDate);
  return { ...event, recurring: set };
};

/**
 * Returns a copy of the event whose recurrence rule ends strictly before
 * `cutoffDate` (used for "this and following" truncation).
 */
export const truncateEventBefore = (event: ProcessedEvent, cutoffDate: Date): ProcessedEvent => {
  const source = toRRuleSet(event.recurring as RRule | RRuleSet);
  const truncated = new RRuleSet();
  (((source as any)._rrule as RRule[]) || []).forEach((r) => {
    const opts = { ...r.origOptions };
    opts.until = new Date(cutoffDate.getTime() - 1000);
    delete opts.count;
    truncated.rrule(new RRule(opts));
  });
  (((source as any)._exdate as Date[]) || []).forEach((d) => truncated.exdate(d));
  return { ...event, recurring: truncated };
};

/**
 * Builds a new series event starting from `fromDate`, inheriting the parent's
 * recurrence frequency but with a fresh dtstart and any field overrides applied.
 */
export const createSeriesFrom = (
  parent: ProcessedEvent,
  fromDate: Date,
  overrides: Partial<ProcessedEvent>
): ProcessedEvent => {
  const source = toRRuleSet(parent.recurring as RRule | RRuleSet);
  const newSet = new RRuleSet();
  (((source as any)._rrule as RRule[]) || []).forEach((r) => {
    const opts = { ...r.origOptions, dtstart: fromDate };
    delete opts.count;
    delete opts.until;
    newSet.rrule(new RRule(opts));
  });
  const parentDuration = parent.end.getTime() - parent.start.getTime();
  const newDuration =
    overrides.start && overrides.end
      ? overrides.end.getTime() - overrides.start.getTime()
      : parentDuration;
  return {
    ...parent,
    ...overrides,
    event_id: `${parent.event_id}_from_${fromDate.getTime()}`,
    start: fromDate,
    end: new Date(fromDate.getTime() + newDuration),
    recurring: newSet,
    _recurringMeta: undefined,
  };
};

/**
 * Applies an edit to a recurring series according to the chosen scope.
 *
 * - "all"       → updates every field on the parent series in place.
 * - "this"      → exdates this occurrence on the parent; inserts a standalone
 *                 (non-recurring) override event.
 * - "following" → truncates the parent series before this occurrence; creates a
 *                 new recurring series starting from this occurrence.
 */
export const applyRecurringEdit = (
  events: ProcessedEvent[],
  updatedEvent: ProcessedEvent,
  mode: RecurringEditMode
): ProcessedEvent[] => {
  const meta = updatedEvent._recurringMeta;
  if (!meta) {
    // Not a recurring instance — plain edit
    return events.map((e) =>
      e.event_id === updatedEvent.event_id ? { ...e, ...updatedEvent } : e
    );
  }

  const parent = events.find((e) => e.event_id === meta.seriesId);
  if (!parent) return events;

  const originalStart = new Date(meta.originalStart);

  if (mode === "all") {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _recurringMeta: _ignored, ...rest } = updatedEvent;
    return events.map((e) =>
      e.event_id === meta.seriesId ? { ...parent, ...rest, event_id: parent.event_id } : e
    );
  }

  if (mode === "this") {
    const parentWithExdate = addExdateToEvent(parent, originalStart);
    const standalone: ProcessedEvent = {
      ...updatedEvent,
      event_id: `${meta.seriesId}_override_${meta.originalStart}`,
      recurring: undefined,
      _recurringMeta: undefined,
    };
    return [
      ...events.map((e) => (e.event_id === meta.seriesId ? parentWithExdate : e)),
      standalone,
    ];
  }

  // mode === "following"
  const truncatedParent = truncateEventBefore(parent, originalStart);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _recurringMeta: _ignored2, ...overrideFields } = updatedEvent;
  const newSeries = createSeriesFrom(parent, originalStart, overrideFields);
  return [...events.map((e) => (e.event_id === meta.seriesId ? truncatedParent : e)), newSeries];
};

/**
 * Applies a deletion to a recurring series according to the chosen scope.
 *
 * - "all"       → removes the entire parent series.
 * - "this"      → exdates this occurrence; parent series remains.
 * - "following" → truncates the parent series before this occurrence.
 */
export const applyRecurringDelete = (
  events: ProcessedEvent[],
  targetEvent: ProcessedEvent,
  mode: RecurringEditMode
): ProcessedEvent[] => {
  const meta = targetEvent._recurringMeta;
  if (!meta) {
    return events.filter((e) => e.event_id !== targetEvent.event_id);
  }

  const parent = events.find((e) => e.event_id === meta.seriesId);
  if (!parent) return events;

  const originalStart = new Date(meta.originalStart);

  if (mode === "all") {
    return events.filter((e) => e.event_id !== meta.seriesId);
  }

  if (mode === "this") {
    const parentWithExdate = addExdateToEvent(parent, originalStart);
    return events.map((e) => (e.event_id === meta.seriesId ? parentWithExdate : e));
  }

  // mode === "following"
  const truncatedParent = truncateEventBefore(parent, originalStart);
  return events.map((e) => (e.event_id === meta.seriesId ? truncatedParent : e));
};

// ─── End RRuleSet helpers ────────────────────────────────────────────────────

export const getOneView = (state: Partial<SchedulerProps>): View => {
  if (state.month) {
    return "month";
  } else if (state.week) {
    return "week";
  } else if (state.day) {
    return "day";
  }
  throw new Error("No views were selected");
};

export const getAvailableViews = (state: SchedulerProps) => {
  const views: View[] = [];
  if (state.month) {
    views.push("month");
  }
  if (state.week) {
    views.push("week");
  }
  if (state.day) {
    views.push("day");
  }
  return views;
};

export const arraytizeFieldVal = (field: FieldProps, val: any, event?: StateEvent) => {
  const arrytize = field.config?.multiple && !Array.isArray(event?.[field.name] || field.default);
  const value = arrytize ? (val ? [val] : []) : val;
  const validity = arrytize ? value.length : value;
  return { value, validity };
};

export const getResourcedEvents = (
  events: ProcessedEvent[],
  resource: DefaultResource,
  resourceFields: ResourceFields,
  fields: FieldProps[]
): ProcessedEvent[] => {
  const keyName = resourceFields.idField;
  const resourceField = fields.find((f) => f.name === keyName);
  const isMultiple = !!resourceField?.config?.multiple;

  const resourcedEvents = [];

  for (const event of events) {
    // Handle single select & multiple select accordingly
    const arrytize = isMultiple && !Array.isArray(event[keyName]);
    const eventVal = arrytize ? [event[keyName]] : event[keyName];

    const isThisResource =
      isMultiple || Array.isArray(eventVal)
        ? eventVal.includes(resource[keyName])
        : eventVal === resource[keyName];

    if (isThisResource) {
      resourcedEvents.push({
        ...event,
        color: event.color || resource[resourceFields.colorField || ""],
      });
    }
  }

  return resourcedEvents;
};

export const traversCrossingEvents = (
  todayEvents: ProcessedEvent[],
  event: ProcessedEvent
): ProcessedEvent[] => {
  return todayEvents.filter(
    (e) =>
      e.event_id !== event.event_id &&
      (isWithinInterval(addMinutes(event.start, 1), {
        start: e.start,
        end: e.end,
      }) ||
        isWithinInterval(addMinutes(event.end, -1), {
          start: e.start,
          end: e.end,
        }) ||
        isWithinInterval(addMinutes(e.start, 1), {
          start: event.start,
          end: event.end,
        }) ||
        isWithinInterval(addMinutes(e.end, -1), {
          start: event.start,
          end: event.end,
        }))
  );
};

export const calcMinuteHeight = (cellHeight: number, step: number) => {
  return Math.ceil(cellHeight) / step;
};

export const calcCellHeight = (tableHeight: number, hoursLength: number) => {
  return Math.max(tableHeight / hoursLength, 60);
};

export const differenceInDaysOmitTime = (start: Date, end: Date) => {
  return differenceInDays(endOfDay(addSeconds(end, -1)), startOfDay(start));
};

export const convertRRuleDateToDate = (rruleDate: Date) => {
  return new Date(
    rruleDate.getUTCFullYear(),
    rruleDate.getUTCMonth(),
    rruleDate.getUTCDate(),
    rruleDate.getUTCHours(),
    rruleDate.getUTCMinutes()
  );
};

export const getRecurrencesForDate = (event: ProcessedEvent, today: Date, timeZone?: string) => {
  const duration = differenceInMilliseconds(event.end, event.start);
  if (event.recurring) {
    return event.recurring
      ?.between(addDays(today, -1), addDays(today, 1), true)
      .map((d: Date, index: number) => {
        const start = convertRRuleDateToDate(d);
        return {
          ...event,
          recurrenceId: index,
          start: start,
          end: addMilliseconds(start, duration),
          // Stamp recurring metadata so editors/deletions can identify this occurrence
          _recurringMeta: {
            seriesId: event.event_id,
            originalStart: d.toISOString(),
          },
        };
      })
      .map((event) => convertEventTimeZone(event, timeZone));
  }
  return [convertEventTimeZone(event, timeZone)];
};

export const filterTodayEvents = (
  events: ProcessedEvent[],
  today: Date,
  timeZone?: string
): ProcessedEvent[] => {
  const list: ProcessedEvent[] = [];

  for (let i = 0; i < events.length; i++) {
    for (const rec of getRecurrencesForDate(events[i], today, timeZone)) {
      const isToday =
        !rec.allDay && isSameDay(today, rec.start) && !differenceInDaysOmitTime(rec.start, rec.end);
      if (isToday) {
        list.push(rec);
      }
    }
  }

  // Sort by the length est event
  return sortEventsByTheLengthest(list);
};

export const filterTodayAgendaEvents = (events: ProcessedEvent[], today: Date) => {
  const list: ProcessedEvent[] = events.filter((ev) =>
    isWithinInterval(today, {
      start: startOfDay(ev.start),
      end: endOfDay(subMinutes(ev.end, 1)),
    })
  );

  return sortEventsByTheEarliest(list);
};

export const sortEventsByTheLengthest = (events: ProcessedEvent[]) => {
  return events.sort((a, b) => {
    const aDiff = a.end.getTime() - a.start.getTime();
    const bDiff = b.end.getTime() - b.start.getTime();
    return bDiff - aDiff;
  });
};

export const sortEventsByTheEarliest = (events: ProcessedEvent[]) => {
  return events.sort((a, b) => {
    const isMulti = a.allDay || differenceInDaysOmitTime(a.start, a.end) > 0;
    return isMulti ? -1 : a.start.getTime() - b.start.getTime();
  });
};

export const filterMultiDaySlot = (
  events: ProcessedEvent[],
  date: Date | Date[],
  timeZone?: string,
  lengthOnly?: boolean
) => {
  const isMultiDates = Array.isArray(date);
  const list: ProcessedEvent[] = [];
  const multiPerDay: Record<string, ProcessedEvent[]> = {};
  for (let i = 0; i < events.length; i++) {
    const event = convertEventTimeZone(events[i], timeZone);
    let withinSlot = event.allDay || differenceInDaysOmitTime(event.start, event.end) > 0;
    if (!withinSlot) continue;
    if (isMultiDates) {
      withinSlot = date.some((weekday) =>
        isWithinInterval(weekday, {
          start: startOfDay(event.start),
          end: endOfDay(event.end),
        })
      );
    } else {
      withinSlot = isWithinInterval(date, {
        start: startOfDay(event.start),
        end: endOfDay(event.end),
      });
    }

    if (withinSlot) {
      list.push(event);
      if (isMultiDates) {
        for (const d of date) {
          const start = format(d, "yyyy-MM-dd");
          if (isWithinInterval(d, { start: startOfDay(event.start), end: endOfDay(event.end) })) {
            multiPerDay[start] = (multiPerDay[start] || []).concat(event);
          }
        }
      } else {
        const start = format(event.start, "yyyy-MM-dd");
        multiPerDay[start] = (multiPerDay[start] || []).concat(event);
      }
    }
  }

  if (isMultiDates && lengthOnly) {
    return Object.values(multiPerDay).sort((a, b) => b.length - a.length)?.[0] || [];
  }

  return list;
};

export const convertEventTimeZone = (event: ProcessedEvent, timeZone?: string) => {
  return {
    ...event,
    start: getTimeZonedDate(event.start, timeZone),
    end: getTimeZonedDate(event.end, timeZone),
    convertedTz: true,
  };
};

export const getTimeZonedDate = (date: Date, timeZone?: string) => {
  return new Date(
    new Intl.DateTimeFormat("en-US", {
      dateStyle: "short",
      timeStyle: "medium",
      timeZone,
    }).format(date)
  );
};

/**
 * Performs the reverse of getTimeZonedDate, IE: the given date is assumed
 * to already be in the provided timeZone and is reverted to the local
 * browser's timeZone.
 * @param date The date to convert.
 * @param timeZone The timeZone to convert from.
 * @returns A new date reverted from the given timeZone to local time.
 */
export const revertTimeZonedDate = (date: Date, timeZone?: string) => {
  if (!timeZone) {
    return date;
  }

  // This always gets the offset between the local computer's time
  // and UTC. It has nothing to do with the value of the date object,
  // despite being an instance method.
  const localOffset = -date.getTimezoneOffset();
  const desiredOffset = getTimezoneOffset(timeZone);
  const diff = localOffset - desiredOffset;
  return new Date(date.getTime() + diff * 60 * 1000);
};

export const isTimeZonedToday = ({
  dateLeft,
  dateRight,
  timeZone,
}: {
  dateLeft: Date;
  dateRight?: Date;
  timeZone?: string;
}) => {
  return isSameDay(dateLeft, getTimeZonedDate(dateRight || new Date(), timeZone));
};

export const getHourFormat = (hourFormat: "12" | "24") => {
  return hourFormat === "12" ? "hh:mm a" : "HH:mm";
};

/**
 * Gets the offset in minutes of the provided timeZone.
 * @param timeZone The timeZone to get the offset for.
 * @returns The offset in minutes of the provided timeZone.
 */
function getTimezoneOffset(timeZone: string) {
  const now = new Date();
  const localizedTime = new Date(now.toLocaleString("en-US", { timeZone }));
  const utcTime = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
  return Math.round((localizedTime.getTime() - utcTime.getTime()) / (60 * 1000));
}

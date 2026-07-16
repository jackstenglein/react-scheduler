import { describe, expect, it } from "vitest";
import { RRule } from "rrule";
import {
  arraytizeFieldVal,
  calcCellHeight,
  calcMinuteHeight,
  convertEventTimeZone,
  convertRRuleDateToDate,
  differenceInDaysOmitTime,
  filterMultiDaySlot,
  filterTodayAgendaEvents,
  filterTodayEvents,
  getAvailableViews,
  getHourFormat,
  getOneView,
  getResourcedEvents,
  getTimeZonedDate,
  revertTimeZonedDate,
  sortEventsByTheEarliest,
  sortEventsByTheLengthest,
  traversCrossingEvents,
} from "./generals";
import { FieldProps, ProcessedEvent, SchedulerProps } from "../types";
import { SchedulerState } from "../store/types";

const makeEvent = (overrides: Partial<ProcessedEvent> = {}): ProcessedEvent => ({
  event_id: 1,
  title: "Test Event",
  start: new Date(2025, 0, 15, 10, 0),
  end: new Date(2025, 0, 15, 11, 0),
  ...overrides,
});

describe("getOneView", () => {
  it("returns month when month view is enabled", () => {
    expect(getOneView({ month: {} } as SchedulerProps)).toBe("month");
  });

  it("returns week when only week view is enabled", () => {
    expect(getOneView({ week: {} } as SchedulerProps)).toBe("week");
  });

  it("returns day when only day view is enabled", () => {
    expect(getOneView({ day: {} } as SchedulerProps)).toBe("day");
  });

  it("prefers month over week and day", () => {
    expect(getOneView({ month: {}, week: {}, day: {} } as SchedulerProps)).toBe("month");
  });

  it("throws when no views are selected", () => {
    expect(() => getOneView({})).toThrow("No views were selected");
  });
});

describe("getAvailableViews", () => {
  it("returns all enabled views in order", () => {
    expect(
      getAvailableViews({ month: {}, week: {}, day: {}, enableAgenda: true } as SchedulerState)
    ).toEqual(["day", "week", "month", "agenda"]);
  });

  it("returns only enabled views", () => {
    expect(getAvailableViews({ week: {}, day: {} } as SchedulerProps)).toEqual(["day", "week"]);
  });

  it("returns empty array when no views are enabled", () => {
    expect(getAvailableViews({})).toEqual([]);
  });
});

describe("arraytizeFieldVal", () => {
  const multipleField: FieldProps = {
    name: "assignee",
    type: "select",
    config: { multiple: "default" },
  };

  it("wraps scalar value in array for multiple select fields", () => {
    expect(arraytizeFieldVal(multipleField, "a")).toEqual({ value: ["a"], validity: 1 });
  });

  it("returns empty array for falsy value on multiple select", () => {
    expect(arraytizeFieldVal(multipleField, "")).toEqual({ value: [], validity: 0 });
  });

  it("keeps scalar value for non-multiple fields", () => {
    const field: FieldProps = { name: "title", type: "input" };
    expect(arraytizeFieldVal(field, "hello")).toEqual({ value: "hello", validity: "hello" });
  });

  it("does not re-wrap when event already has array value", () => {
    const event = { assignee: ["a", "b"] };
    expect(arraytizeFieldVal(multipleField, "c", event)).toEqual({ value: "c", validity: "c" });
  });
});

describe("getResourcedEvents", () => {
  const resourceFields = {
    idField: "assignee",
    textField: "text",
    colorField: "color",
  };

  const fields: FieldProps[] = [
    { name: "assignee", type: "select", config: { multiple: "default" } },
  ];

  const events: ProcessedEvent[] = [
    makeEvent({ event_id: 1, assignee: "alice" }),
    makeEvent({ event_id: 2, assignee: ["bob", "alice"] }),
    makeEvent({ event_id: 3, assignee: "carol", color: "#ff0000" }),
  ];

  it("filters events for a single-select resource", () => {
    const singleFields: FieldProps[] = [{ name: "assignee", type: "select" }];
    const singleSelectEvents = [
      makeEvent({ event_id: 1, assignee: "alice" }),
      makeEvent({ event_id: 2, assignee: "bob" }),
    ];
    const result = getResourcedEvents(
      singleSelectEvents,
      { assignee: "alice" },
      resourceFields,
      singleFields
    );
    expect(result.map((e) => e.event_id)).toEqual([1]);
  });

  it("filters events for a multiple-select resource", () => {
    const result = getResourcedEvents(events, { assignee: "alice" }, resourceFields, fields);
    expect(result.map((e) => e.event_id)).toEqual([1, 2]);
  });

  it("inherits resource color when event has no color", () => {
    const result = getResourcedEvents(
      [makeEvent({ assignee: "alice" })],
      { assignee: "alice", color: "#00ff00" },
      resourceFields,
      fields
    );
    expect(result[0].color).toBe("#00ff00");
  });

  it("preserves event color over resource color", () => {
    const result = getResourcedEvents(
      [makeEvent({ assignee: "carol", color: "#ff0000" })],
      { assignee: "carol", color: "#00ff00" },
      resourceFields,
      fields
    );
    expect(result[0].color).toBe("#ff0000");
  });
});

describe("calcMinuteHeight", () => {
  it("divides cell height by step", () => {
    expect(calcMinuteHeight(120, 60)).toBe(2);
  });

  it("ceilings fractional cell heights", () => {
    expect(calcMinuteHeight(65, 30)).toBeCloseTo(2.17, 1);
  });
});

describe("calcCellHeight", () => {
  it("divides table height by hours length", () => {
    expect(calcCellHeight(600, 10)).toBe(60);
  });

  it("enforces a minimum height of 60", () => {
    expect(calcCellHeight(300, 10)).toBe(60);
  });
});

describe("differenceInDaysOmitTime", () => {
  it("returns 0 for same-day events", () => {
    const start = new Date(2025, 0, 15, 9, 0);
    const end = new Date(2025, 0, 15, 17, 0);
    expect(differenceInDaysOmitTime(start, end)).toBe(0);
  });

  it("returns 1 for events spanning two calendar days", () => {
    const start = new Date(2025, 0, 15, 22, 0);
    const end = new Date(2025, 0, 16, 2, 0);
    expect(differenceInDaysOmitTime(start, end)).toBe(1);
  });
});

describe("convertRRuleDateToDate", () => {
  it("converts UTC components to local date", () => {
    const utcDate = new Date(Date.UTC(2025, 5, 15, 14, 30));
    expect(convertRRuleDateToDate(utcDate)).toEqual(new Date(2025, 5, 15, 14, 30));
  });
});

describe("sortEventsByTheLengthest", () => {
  it("sorts events by number of days descending, then by start time ascending", () => {
    const short = makeEvent({ event_id: 1, end: new Date(2025, 0, 15, 11, 0) });
    const long = makeEvent({ event_id: 2, end: new Date(2025, 0, 15, 14, 0) });
    const multiday = makeEvent({ event_id: 3, end: new Date(2025, 0, 16, 14, 0) });
    const sorted = sortEventsByTheLengthest([short, long, multiday]);
    expect(sorted.map((e) => e.event_id)).toEqual([3, 1, 2]);
  });

  it("does not mutate the input array", () => {
    const short = makeEvent({ event_id: 1, end: new Date(2025, 0, 15, 11, 0) });
    const multiday = makeEvent({ event_id: 3, end: new Date(2025, 0, 16, 14, 0) });
    const input = [short, multiday];
    const originalOrder = input.map((e) => e.event_id);
    sortEventsByTheLengthest(input);
    expect(input.map((e) => e.event_id)).toEqual(originalOrder);
  });
});

describe("sortEventsByTheEarliest", () => {
  it("puts all-day events first", () => {
    const timed = makeEvent({
      event_id: 1,
      start: new Date(2025, 0, 15, 8, 0),
      end: new Date(2025, 0, 15, 9, 0),
    });
    const allDay = makeEvent({
      event_id: 2,
      allDay: true,
      start: new Date(2025, 0, 15, 0, 0),
      end: new Date(2025, 0, 16, 0, 0),
    });
    const sorted = sortEventsByTheEarliest([timed, allDay]);
    expect(sorted[0].event_id).toBe(2);
  });

  it("sorts timed events by start ascending", () => {
    const later = makeEvent({
      event_id: 1,
      start: new Date(2025, 0, 15, 14, 0),
      end: new Date(2025, 0, 15, 15, 0),
    });
    const earlier = makeEvent({
      event_id: 2,
      start: new Date(2025, 0, 15, 9, 0),
      end: new Date(2025, 0, 15, 10, 0),
    });
    const sorted = sortEventsByTheEarliest([later, earlier]);
    expect(sorted.map((e) => e.event_id)).toEqual([2, 1]);
  });

  it("does not mutate the input array", () => {
    const later = makeEvent({
      event_id: 1,
      start: new Date(2025, 0, 15, 14, 0),
      end: new Date(2025, 0, 15, 15, 0),
    });
    const earlier = makeEvent({
      event_id: 2,
      start: new Date(2025, 0, 15, 9, 0),
      end: new Date(2025, 0, 15, 10, 0),
    });
    const input = [later, earlier];
    sortEventsByTheEarliest(input);
    expect(input.map((e) => e.event_id)).toEqual([1, 2]);
  });
});

describe("filterTodayEvents", () => {
  const today = new Date(2025, 0, 15, 12, 0);

  it("includes same-day timed events", () => {
    const events = [
      makeEvent({
        event_id: 1,
        start: new Date(2025, 0, 15, 9, 0),
        end: new Date(2025, 0, 15, 10, 0),
      }),
      makeEvent({
        event_id: 2,
        start: new Date(2025, 0, 16, 9, 0),
        end: new Date(2025, 0, 16, 10, 0),
      }),
    ];
    const result = filterTodayEvents(events, today);
    expect(result.map((e) => e.event_id)).toEqual([1]);
  });

  it("excludes multi-day events", () => {
    const events = [
      makeEvent({
        event_id: 1,
        start: new Date(2025, 0, 14, 9, 0),
        end: new Date(2025, 0, 16, 10, 0),
      }),
    ];
    expect(filterTodayEvents(events, today)).toEqual([]);
  });

  it("expands recurring events for today", () => {
    const events = [
      makeEvent({
        event_id: 1,
        start: new Date(2025, 0, 13, 9, 0),
        end: new Date(2025, 0, 13, 10, 0),
        recurring: new RRule({
          freq: RRule.DAILY,
          dtstart: new Date(2025, 0, 13, 9, 0),
        }),
      }),
    ];
    const result = filterTodayEvents(events, today);
    expect(result).toHaveLength(1);
    expect(result[0].event_id).toBe(1);
    expect(result[0].start.getDate()).toBe(15);
  });
});

describe("filterTodayAgendaEvents", () => {
  const today = new Date(2025, 0, 15, 12, 0);

  it("includes events that span today", () => {
    const events = [
      makeEvent({
        event_id: 1,
        start: new Date(2025, 0, 14, 9, 0),
        end: new Date(2025, 0, 16, 10, 0),
      }),
      makeEvent({
        event_id: 2,
        start: new Date(2025, 0, 20, 9, 0),
        end: new Date(2025, 0, 20, 10, 0),
      }),
    ];
    const result = filterTodayAgendaEvents(events, today);
    expect(result.map((e) => e.event_id)).toEqual([1]);
  });
});

describe("filterMultiDaySlot", () => {
  const allDay = makeEvent({
    event_id: 1,
    allDay: true,
    start: new Date(2025, 0, 14, 0, 0),
    end: new Date(2025, 0, 17, 0, 0),
  });
  const singleDay = makeEvent({
    event_id: 2,
    start: new Date(2025, 0, 15, 9, 0),
    end: new Date(2025, 0, 15, 10, 0),
  });

  it("returns multi-day events within a single date", () => {
    const result = filterMultiDaySlot([allDay, singleDay], new Date(2025, 0, 15));
    expect(result.map((e) => e.event_id)).toEqual([1]);
  });

  it("returns events from the busiest multi-day slot when lengthOnly is true", () => {
    const weekDates = [
      new Date(2025, 0, 12),
      new Date(2025, 0, 13),
      new Date(2025, 0, 14),
      new Date(2025, 0, 15),
      new Date(2025, 0, 16),
      new Date(2025, 0, 17),
      new Date(2025, 0, 18),
    ];
    const eventA = makeEvent({
      event_id: 1,
      allDay: true,
      start: new Date(2025, 0, 12, 0, 0),
      end: new Date(2025, 0, 14, 0, 0),
    });
    const eventB = makeEvent({
      event_id: 2,
      allDay: true,
      start: new Date(2025, 0, 14, 0, 0),
      end: new Date(2025, 0, 18, 0, 0),
    });
    const result = filterMultiDaySlot([eventA, eventB], weekDates, undefined, true);
    expect(result.map((e) => e.event_id).sort()).toEqual([1, 2]);
  });
});

describe("traversCrossingEvents", () => {
  it("finds overlapping events excluding self", () => {
    const base = makeEvent({
      event_id: 1,
      start: new Date(2025, 0, 15, 10, 0),
      end: new Date(2025, 0, 15, 12, 0),
    });
    const overlapping = makeEvent({
      event_id: 2,
      start: new Date(2025, 0, 15, 11, 0),
      end: new Date(2025, 0, 15, 13, 0),
    });
    const separate = makeEvent({
      event_id: 3,
      start: new Date(2025, 0, 15, 14, 0),
      end: new Date(2025, 0, 15, 15, 0),
    });
    const result = traversCrossingEvents([base, overlapping, separate], base);
    expect(result.map((e) => e.event_id)).toEqual([2]);
  });

  it("returns empty array when no events overlap", () => {
    const base = makeEvent({
      event_id: 1,
      start: new Date(2025, 0, 15, 10, 0),
      end: new Date(2025, 0, 15, 11, 0),
    });
    const other = makeEvent({
      event_id: 2,
      start: new Date(2025, 0, 15, 14, 0),
      end: new Date(2025, 0, 15, 15, 0),
    });
    expect(traversCrossingEvents([base, other], base)).toEqual([]);
  });
});

describe("getHourFormat", () => {
  it("returns 12-hour format string", () => {
    expect(getHourFormat("12")).toBe("h:mm a");
  });

  it("returns 24-hour format string", () => {
    expect(getHourFormat("24")).toBe("HH:mm");
  });
});

describe("timezone helpers", () => {
  const date = new Date(Date.UTC(2025, 0, 15, 15, 30, 0));

  it("returns a Date when no timezone is provided", () => {
    const result = getTimeZonedDate(date);
    expect(result).toBeInstanceOf(Date);
    expect(result.getTime()).toBe(date.getTime());
  });

  it("returns the same date when no timezone is provided to revertTimeZonedDate", () => {
    expect(revertTimeZonedDate(date)).toBe(date);
  });

  it("marks converted events with convertedTz flag", () => {
    const result = convertEventTimeZone(makeEvent(), "UTC");
    expect(result.convertedTz).toBe(true);
  });

  it("projects wall-clock fields into the target timezone", () => {
    const utc = getTimeZonedDate(date, "UTC");
    expect(utc.getFullYear()).toBe(2025);
    expect(utc.getMonth()).toBe(0);
    expect(utc.getDate()).toBe(15);
    expect(utc.getHours()).toBe(15);
    expect(utc.getMinutes()).toBe(30);
  });
});
